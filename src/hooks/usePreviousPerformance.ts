import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ExerciseType } from '@/types';

// =============================================================================
// Types
// =============================================================================

export interface PreviousSet {
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  rpe: number | null;
}

export interface PreviousPerformance {
  sets: PreviousSet[];
  workoutDate: string | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetches the most recent workout's sets for a given exercise.
 * Returns the sets from the last time this exercise was performed,
 * which can be displayed as "previous" reference data in set rows.
 */
export function usePreviousPerformance(exerciseId: string | undefined): {
  data: PreviousPerformance | null;
  isLoading: boolean;
} {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['previousPerformance', exerciseId],
    queryFn: async (): Promise<PreviousPerformance | null> => {
      if (!user || !exerciseId) return null;

      // Find the most recent workout containing this exercise
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          exercise_sets(set_number, reps, weight_kg, duration_seconds, rpe),
          workouts!inner(completed_at)
        `)
        .eq('exercise_id', exerciseId)
        .eq('workouts.user_id', user.id)
        .not('workouts.completed_at', 'is', null)
        .order('workouts(completed_at)', { ascending: false })
        .limit(1);

      if (error) {
        // Fallback: try alternative query structure
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('workouts')
          .select(`
            completed_at,
            workout_exercises!inner(
              exercise_sets(set_number, reps, weight_kg, duration_seconds, rpe)
            )
          `)
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .eq('workout_exercises.exercise_id', exerciseId)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (fallbackError || !fallbackData || (fallbackData as any[]).length === 0) {
          return null;
        }

        const workout = fallbackData[0] as any;
        const workoutExercise = workout.workout_exercises?.[0];
        if (!workoutExercise?.exercise_sets) return null;

        const sets: PreviousSet[] = workoutExercise.exercise_sets
          .sort((a: any, b: any) => a.set_number - b.set_number)
          .map((s: any) => ({
            setNumber: s.set_number,
            reps: s.reps,
            weightKg: s.weight_kg,
            durationSeconds: s.duration_seconds,
            rpe: s.rpe,
          }));

        return {
          sets,
          workoutDate: workout.completed_at,
        };
      }

      if (!data || data.length === 0) return null;

      const row = data[0] as any;
      const workoutDate = row.workouts?.completed_at ?? null;
      const exerciseSets = row.exercise_sets ?? [];

      const sets: PreviousSet[] = exerciseSets
        .sort((a: any, b: any) => a.set_number - b.set_number)
        .map((s: any) => ({
          setNumber: s.set_number,
          reps: s.reps,
          weightKg: s.weight_kg,
          durationSeconds: s.duration_seconds,
          rpe: s.rpe,
        }));

      return {
        sets,
        workoutDate,
      };
    },
    enabled: !!user && !!exerciseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
  };
}

/**
 * Format a previous set for display based on exercise type.
 */
export function formatPreviousSet(
  set: PreviousSet | undefined,
  exerciseType: ExerciseType,
): string {
  if (!set) return '—';

  switch (exerciseType) {
    case 'bodyweight':
      return set.reps !== null ? `${set.reps} reps` : '—';
    case 'weighted':
      if (set.weightKg !== null && set.reps !== null) {
        return `${set.weightKg}kg × ${set.reps}`;
      }
      if (set.reps !== null) return `${set.reps} reps`;
      return '—';
    case 'assisted':
      if (set.weightKg !== null && set.reps !== null) {
        return `-${set.weightKg}kg × ${set.reps}`;
      }
      if (set.reps !== null) return `${set.reps} reps`;
      return '—';
    case 'duration':
    case 'static_hold':
      if (set.durationSeconds !== null) {
        const mins = Math.floor(set.durationSeconds / 60);
        const secs = set.durationSeconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
      }
      return '—';
    default:
      return '—';
  }
}
