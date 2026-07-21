import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
type WorkoutExerciseRow = Database['public']['Tables']['workout_exercises']['Row'];
type ExerciseSetRow = Database['public']['Tables']['exercise_sets']['Row'];
type PersonalRecordRow = Database['public']['Tables']['personal_records']['Row'];

// =============================================================================
// Types
// =============================================================================

export interface WorkoutsParams {
  page?: number;
  pageSize?: number;
}

export interface WorkoutSummary extends WorkoutRow {
  exercise_count: number;
}

export interface WorkoutExerciseWithSets extends WorkoutExerciseRow {
  exercises: {
    id: string;
    name: string;
    exercise_type: string;
    muscle_groups: string[];
  } | null;
  exercise_sets: ExerciseSetRow[];
}

export interface WorkoutWithExercises extends WorkoutRow {
  workout_exercises: WorkoutExerciseWithSets[];
}

// =============================================================================
// useWorkouts – paginated list ordered by completed_at descending
// =============================================================================

/**
 * Fetches a paginated list of workouts for the current user,
 * ordered by completed_at descending (most recent first).
 * Includes the exercise count per workout.
 */
export function useWorkouts(params?: WorkoutsParams) {
  const { user } = useAuth();
  const page = params?.page ?? 0;
  const pageSize = params?.pageSize ?? 20;

  return useQuery({
    queryKey: ['workouts', { page, pageSize }],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises(id)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (error) throw error;

      return (data ?? []).map((workout: any) => ({
        ...workout,
        exercise_count: workout.workout_exercises?.length ?? 0,
        workout_exercises: undefined,
      })) as WorkoutSummary[];
    },
    enabled: !!user,
  });
}

// =============================================================================
// useWorkout – single workout with full detail (exercises + sets)
// =============================================================================

/**
 * Fetches a single workout by ID with all workout_exercises and their
 * exercise_sets joined. Includes exercise name and type from the exercises table.
 */
export function useWorkout(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workouts', id],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      if (!id) throw new Error('Workout ID is required');

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises(
            *,
            exercises(id, name, exercise_type, muscle_groups),
            exercise_sets(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const result = data as any;

      // Sort workout_exercises by position, and exercise_sets by set_number
      if (result.workout_exercises) {
        result.workout_exercises.sort(
          (a: WorkoutExerciseWithSets, b: WorkoutExerciseWithSets) =>
            a.position - b.position
        );
        for (const we of result.workout_exercises) {
          if (we.exercise_sets) {
            we.exercise_sets.sort(
              (a: ExerciseSetRow, b: ExerciseSetRow) =>
                a.set_number - b.set_number
            );
          }
        }
      }

      return result as WorkoutWithExercises;
    },
    enabled: !!user && !!id,
  });
}

// =============================================================================
// useDeleteWorkout – deletes a workout (CASCADE handles child records)
// =============================================================================

/**
 * Deletes a workout by ID. Supabase CASCADE on foreign keys will remove
 * workout_exercises, exercise_sets, and personal_records linked to this workout.
 */
export function useDeleteWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId: string) => {
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// =============================================================================
// useUpdateWorkout – updates workout name and individual set values
// =============================================================================

export interface UpdateSetPayload {
  id: string;
  reps?: number | null;
  weight_kg?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
}

export interface UpdateWorkoutPayload {
  workoutId: string;
  name?: string;
  sets?: UpdateSetPayload[];
}

/**
 * Updates a workout's name and/or individual exercise set values.
 */
export function useUpdateWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateWorkoutPayload) => {
      if (!user) throw new Error('No authenticated user');

      // Update workout name if provided
      if (payload.name !== undefined) {
        const { error } = await supabase
          .from('workouts')
          .update({ name: payload.name })
          .eq('id', payload.workoutId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update individual sets if provided
      if (payload.sets && payload.sets.length > 0) {
        for (const set of payload.sets) {
          const { id, ...updates } = set;
          const { error } = await supabase
            .from('exercise_sets')
            .update(updates)
            .eq('id', id);

          if (error) throw error;
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', variables.workoutId] });
    },
  });
}

// =============================================================================
// usePersonalRecords – records for a specific exercise
// =============================================================================

/**
 * Fetches personal records for a specific exercise, ordered by achieved_at descending.
 */
export function usePersonalRecords(exerciseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['records', exerciseId],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      if (!exerciseId) throw new Error('Exercise ID is required');

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .order('achieved_at', { ascending: false });

      if (error) throw error;
      return data as PersonalRecordRow[];
    },
    enabled: !!user && !!exerciseId,
  });
}
