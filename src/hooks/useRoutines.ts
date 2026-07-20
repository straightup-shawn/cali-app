import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

type RoutineRow = Database['public']['Tables']['routines']['Row'];
type RoutineExerciseRow = Database['public']['Tables']['routine_exercises']['Row'];

export interface CreateRoutineInput {
  name: string;
  exercises: {
    exercise_id: string;
    position: number;
    target_sets: number;
    target_reps?: number | null;
    target_weight_kg?: number | null;
    target_duration_seconds?: number | null;
    rest_seconds?: number | null;
  }[];
}

export interface UpdateRoutineInput {
  id: string;
  name: string;
  exercises: {
    exercise_id: string;
    position: number;
    target_sets: number;
    target_reps?: number | null;
    target_weight_kg?: number | null;
    target_duration_seconds?: number | null;
    rest_seconds?: number | null;
  }[];
}

export interface RoutineWithCount extends RoutineRow {
  exercise_count: number;
}

export interface RoutineExerciseWithDetails extends RoutineExerciseRow {
  exercises: {
    id: string;
    name: string;
    exercise_type: string;
    muscle_groups: string[];
  } | null;
}

export interface RoutineWithExercises extends RoutineRow {
  routine_exercises: RoutineExerciseWithDetails[];
}

/**
 * Fetches all routines for the current user with exercise count.
 */
export function useRoutines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises(id)
        `)
        .eq('user_id', user.id)
        .order('position');
      if (error) throw error;

      return (data ?? []).map((routine: any) => ({
        ...routine,
        exercise_count: routine.routine_exercises?.length ?? 0,
        routine_exercises: undefined,
      })) as RoutineWithCount[];
    },
    enabled: !!user,
  });
}

/**
 * Fetches a single routine with joined routine_exercises and exercise details.
 */
export function useRoutine(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routines', id],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      if (!id) throw new Error('Routine ID is required');

      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises(
            *,
            exercises(id, name, exercise_type, muscle_groups)
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;

      const result = data as any;

      // Sort routine_exercises by position
      if (result.routine_exercises) {
        result.routine_exercises.sort(
          (a: RoutineExerciseWithDetails, b: RoutineExerciseWithDetails) =>
            a.position - b.position
        );
      }

      return result as RoutineWithExercises;
    },
    enabled: !!user && !!id,
  });
}

/**
 * Creates a new routine with its associated exercises.
 * Invalidates the routines query cache on success.
 */
export function useCreateRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoutineInput) => {
      if (!user) throw new Error('No authenticated user');

      // Get the next position for the new routine
      const { data: existingRoutines } = await supabase
        .from('routines')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingRoutines && existingRoutines.length > 0
        ? existingRoutines[0].position + 1
        : 0;

      // Create the routine
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          name: input.name,
          position: nextPosition,
        })
        .select()
        .single();
      if (routineError) throw routineError;

      // Insert routine exercises if any
      if (input.exercises.length > 0) {
        const exerciseRows = input.exercises.map((ex) => ({
          routine_id: routine.id,
          exercise_id: ex.exercise_id,
          position: ex.position,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps ?? null,
          target_weight_kg: ex.target_weight_kg ?? null,
          target_duration_seconds: ex.target_duration_seconds ?? null,
          rest_seconds: ex.rest_seconds ?? null,
        }));

        const { error: exercisesError } = await supabase
          .from('routine_exercises')
          .insert(exerciseRows);
        if (exercisesError) throw exercisesError;
      }

      return routine as RoutineRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

/**
 * Updates a routine's name and exercises.
 * Deletes existing routine_exercises and reinserts the new list.
 * Invalidates the routines query cache on success.
 */
export function useUpdateRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRoutineInput) => {
      if (!user) throw new Error('No authenticated user');

      // Update routine name
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .update({ name: input.name })
        .eq('id', input.id)
        .select()
        .single();
      if (routineError) throw routineError;

      // Delete existing routine exercises
      const { error: deleteError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', input.id);
      if (deleteError) throw deleteError;

      // Reinsert routine exercises
      if (input.exercises.length > 0) {
        const exerciseRows = input.exercises.map((ex) => ({
          routine_id: input.id,
          exercise_id: ex.exercise_id,
          position: ex.position,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps ?? null,
          target_weight_kg: ex.target_weight_kg ?? null,
          target_duration_seconds: ex.target_duration_seconds ?? null,
          rest_seconds: ex.rest_seconds ?? null,
        }));

        const { error: exercisesError } = await supabase
          .from('routine_exercises')
          .insert(exerciseRows);
        if (exercisesError) throw exercisesError;
      }

      return routine as RoutineRow;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routines', variables.id] });
    },
  });
}

/**
 * Deletes a routine and its associated exercises (cascade handled by DB).
 * Invalidates the routines query cache on success.
 */
export function useDeleteRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

/**
 * Duplicates an existing routine with a "Copy of" prefix.
 * Fetches the original routine with exercises, creates a copy, and inserts the exercises.
 * Invalidates the routines query cache on success.
 */
export function useDuplicateRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No authenticated user');

      // Fetch the original routine with exercises
      const { data, error: fetchError } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises(*)
        `)
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const original = data as any;

      // Get the next position
      const { data: existingRoutines } = await supabase
        .from('routines')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingRoutines && existingRoutines.length > 0
        ? existingRoutines[0].position + 1
        : 0;

      // Create the copy
      const { data: newRoutine, error: createError } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          name: `Copy of ${original.name}`,
          position: nextPosition,
        })
        .select()
        .single();
      if (createError) throw createError;

      // Duplicate the exercises
      if (original.routine_exercises && original.routine_exercises.length > 0) {
        const exerciseRows = original.routine_exercises.map(
          (ex: RoutineExerciseRow) => ({
            routine_id: newRoutine.id,
            exercise_id: ex.exercise_id,
            position: ex.position,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            target_weight_kg: ex.target_weight_kg,
            target_duration_seconds: ex.target_duration_seconds,
            rest_seconds: ex.rest_seconds,
          })
        );

        const { error: exercisesError } = await supabase
          .from('routine_exercises')
          .insert(exerciseRows);
        if (exercisesError) throw exercisesError;
      }

      return newRoutine as RoutineRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}
