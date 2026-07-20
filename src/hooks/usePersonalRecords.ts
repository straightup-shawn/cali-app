import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RecordType } from '@/types';

export interface PersonalRecordRow {
  id: string;
  userId: string;
  exerciseId: string;
  recordType: RecordType;
  value: number;
  workoutId: string | null;
  achievedAt: string;
}

/**
 * Fetches personal records for a specific exercise.
 */
export function usePersonalRecords(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ['records', exerciseId],
    queryFn: async () => {
      if (!exerciseId) throw new Error('Exercise ID is required');

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('exercise_id', exerciseId);
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        exerciseId: row.exercise_id,
        recordType: row.record_type as RecordType,
        value: row.value,
        workoutId: row.workout_id,
        achievedAt: row.achieved_at,
      })) as PersonalRecordRow[];
    },
    enabled: !!exerciseId,
  });
}

/**
 * Fetches personal records for multiple exercises in a single query.
 * Returns a map of exerciseId → records achieved in a specific workout.
 */
export function useWorkoutPersonalRecords(workoutId: string | undefined) {
  return useQuery({
    queryKey: ['records', 'workout', workoutId],
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID is required');

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('workout_id', workoutId);
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        exerciseId: row.exercise_id,
        recordType: row.record_type as RecordType,
        value: row.value,
        workoutId: row.workout_id,
        achievedAt: row.achieved_at,
      })) as PersonalRecordRow[];
    },
    enabled: !!workoutId,
  });
}
