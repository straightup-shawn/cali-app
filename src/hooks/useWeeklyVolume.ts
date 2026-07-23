import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useBodyweightEntries } from '@/hooks/useBodyweight';
import { calculateEffectiveResistance, calculateSetVolume, calculateIsometricLoad } from '@/lib/volume-calculator';

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

interface WeeklyWorkoutData {
  id: string;
  workout_exercises: {
    exercise_id: string;
    exercises: {
      id: string;
      exercise_type: string;
      bodyweight_fraction: number | null;
      resistance_model: string | null;
      volume_mode: string | null;
    } | null;
    exercise_sets: {
      reps: number | null;
      weight_kg: number | null;
      duration_seconds: number | null;
      completed: boolean;
    }[];
  }[];
}

/**
 * Fetches all completed sets from this week's workouts and computes
 * the total estimated volume using AI classification data.
 */
export function useWeeklyVolume() {
  const { user } = useAuth();
  const { data: bodyweightEntries } = useBodyweightEntries();

  const weekStart = getStartOfWeek();
  const bw = bodyweightEntries?.[0]?.weight_kg ?? 0;

  return useQuery({
    queryKey: ['weekly-volume', weekStart, bw],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          workout_exercises(
            exercise_id,
            exercises(id, exercise_type, bodyweight_fraction, resistance_model, volume_mode),
            exercise_sets(reps, weight_kg, duration_seconds, completed)
          )
        `)
        .eq('user_id', user.id)
        .gte('completed_at', weekStart)
        .not('completed_at', 'is', null);

      if (error) throw error;
      if (!data) return 0;

      let totalKg = 0;
      for (const workout of data as unknown as WeeklyWorkoutData[]) {
        for (const we of workout.workout_exercises ?? []) {
          const exData = we.exercises;
          const fraction = exData?.bodyweight_fraction ?? null;
          const resistanceModel = exData?.resistance_model ?? null;
          const volumeMode = exData?.volume_mode ?? 'repetitions';
          const exerciseType = exData?.exercise_type ?? 'bodyweight';

          for (const set of we.exercise_sets ?? []) {
            if (!set.completed) continue;

            if (fraction !== null && resistanceModel !== null && bw > 0) {
              const effectiveR = calculateEffectiveResistance({
                bodyweightKg: bw,
                bodyweightFraction: fraction,
                addedResistanceKg: set.weight_kg ?? 0,
                assistanceKg: exerciseType === 'assisted' ? (set.weight_kg ?? 0) : 0,
                resistanceModel,
              });

              if (volumeMode === 'duration' && set.duration_seconds) {
                totalKg += calculateIsometricLoad(effectiveR, set.duration_seconds) / 60;
              } else if (set.reps != null) {
                totalKg += calculateSetVolume(effectiveR, set.reps);
              }
            } else {
              if (set.reps != null && set.weight_kg != null) {
                totalKg += set.reps * set.weight_kg;
              }
            }
          }
        }
      }

      return Math.round(totalKg);
    },
    enabled: !!user,
  });
}
