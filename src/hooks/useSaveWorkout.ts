import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { detectPersonalRecords, toCompletedExercises } from '@/lib/personal-records';
import { calculateEffectiveResistance, calculateSetVolume as calcSetVol } from '@/lib/volume-calculator';
import type { PRCheck } from '@/lib/personal-records';
import type { ActiveWorkout, PersonalRecord } from '@/types';

// =============================================================================
// Types
// =============================================================================

export interface SaveWorkoutResult {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  newPRs: PRCheck[];
}

// =============================================================================
// Helper: get latest bodyweight from DB
// =============================================================================

async function getLatestBodyweightKg(): Promise<number | null> {
  const { data } = await supabase
    .from('bodyweight_entries')
    .select('weight_kg')
    .order('entry_date', { ascending: false })
    .limit(1);
  if (data && data.length > 0) return Number(data[0].weight_kg);
  return null;
}

// =============================================================================
// Helper: get exercise classifications for volume calculation
// =============================================================================

async function getExerciseClassifications(exerciseIds: string[]): Promise<Map<string, { bodyweight_fraction: number | null; resistance_model: string | null; volume_mode: string | null }>> {
  const map = new Map<string, { bodyweight_fraction: number | null; resistance_model: string | null; volume_mode: string | null }>();
  if (exerciseIds.length === 0) return map;

  const { data } = await supabase
    .from('exercises')
    .select('id, bodyweight_fraction, resistance_model, volume_mode')
    .in('id', exerciseIds);

  if (data) {
    for (const ex of data) {
      map.set(ex.id, {
        bodyweight_fraction: ex.bodyweight_fraction != null ? Number(ex.bodyweight_fraction) : null,
        resistance_model: ex.resistance_model,
        volume_mode: ex.volume_mode,
      });
    }
  }
  return map;
}

// =============================================================================
// Types
// =============================================================================

export interface SaveWorkoutResult {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  newPRs: PRCheck[];
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Mutation hook to save a completed workout to Supabase, detect personal records,
 * and upsert any new PRs. Returns the saved workout ID and detected PRs.
 */
export function useSaveWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: ActiveWorkout): Promise<SaveWorkoutResult> => {
      if (!user) throw new Error('No authenticated user');

      const completedAt = new Date().toISOString();
      const startedAt = new Date(workout.startedAt);
      const durationSeconds = Math.round(
        (new Date(completedAt).getTime() - startedAt.getTime()) / 1000
      );

      // Get bodyweight snapshot for this workout
      const bodyweightSnapshotKg = await getLatestBodyweightKg();

      // 1. Insert workout record (with bodyweight snapshot)
      const { data: savedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          id: workout.id,
          user_id: user.id,
          routine_id: workout.routineId,
          name: workout.name,
          started_at: workout.startedAt,
          completed_at: completedAt,
          duration_seconds: durationSeconds,
          notes: null,
          bodyweight_snapshot_kg: bodyweightSnapshotKg,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // 2. Insert workout exercises and sets
      for (const exercise of workout.exercises) {
        const { data: savedExercise, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: savedWorkout.id,
            exercise_id: exercise.exerciseId,
            position: exercise.position,
            rest_seconds: exercise.restSeconds,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        const completedSets = exercise.sets.filter((s) => s.completed);
        if (completedSets.length > 0) {
          const setRows = completedSets.map((s) => ({
            workout_exercise_id: savedExercise.id,
            set_number: s.setNumber,
            reps: s.reps,
            weight_kg: s.weightKg,
            duration_seconds: s.durationSeconds,
            rpe: s.rpe,
            rir: s.rir,
            completed: s.completed,
            completed_at: s.completedAt,
          }));

          const { error: setsError } = await supabase
            .from('exercise_sets')
            .insert(setRows);

          if (setsError) throw setsError;
        }
      }

      // 3. Fetch current personal records for exercises in this workout
      const exerciseIds = workout.exercises.map((e) => e.exerciseId);
      const { data: existingRecords, error: recordsError } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds);

      if (recordsError) throw recordsError;

      // Map DB rows to PersonalRecord type
      const currentRecords: PersonalRecord[] = (existingRecords ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        exerciseId: r.exercise_id,
        recordType: r.record_type as PersonalRecord['recordType'],
        value: Number(r.value),
        workoutId: r.workout_id,
        achievedAt: r.achieved_at,
      }));

      // 4. Detect new personal records
      const completedExercises = toCompletedExercises(workout.exercises);
      const newPRs = detectPersonalRecords(completedExercises, currentRecords);

      // 5. Upsert new personal records
      if (newPRs.length > 0) {
        const prRows = newPRs.map((pr) => ({
          user_id: user.id,
          exercise_id: pr.exerciseId,
          record_type: pr.recordType,
          value: pr.newValue,
          workout_id: savedWorkout.id,
          achieved_at: completedAt,
        }));

        // Upsert on the unique constraint (user_id, exercise_id, record_type)
        const { error: prError } = await supabase
          .from('personal_records')
          .upsert(prRows, {
            onConflict: 'user_id,exercise_id,record_type',
          });

        if (prError) throw prError;
      }

      // Compute summary stats
      const exerciseCount = workout.exercises.length;
      const completedSetsAll = workout.exercises.flatMap((e) =>
        e.sets.filter((s) => s.completed)
      );
      const totalSets = completedSetsAll.length;
      const totalReps = completedSetsAll.reduce((sum, s) => sum + (s.reps ?? 0), 0);

      // Enhanced volume calculation using bodyweight fractions
      const classifications = await getExerciseClassifications(exerciseIds);
      const bw = bodyweightSnapshotKg ?? 0;

      let totalVolume = 0;
      for (const exercise of workout.exercises) {
        const classification = classifications.get(exercise.exerciseId);
        const fraction = classification?.bodyweight_fraction ?? null;
        const resistanceModel = classification?.resistance_model ?? null;

        for (const set of exercise.sets) {
          if (!set.completed) continue;

          if (fraction !== null && resistanceModel !== null && bw > 0) {
            // Use effective resistance calculation
            const effectiveR = calculateEffectiveResistance({
              bodyweightKg: bw,
              bodyweightFraction: fraction,
              addedResistanceKg: set.weightKg ?? 0,
              assistanceKg: exercise.exerciseType === 'assisted' ? (set.weightKg ?? 0) : 0,
              resistanceModel,
            });
            if (set.reps != null) {
              totalVolume += calcSetVol(effectiveR, set.reps);
            }
          } else {
            // Fallback: simple reps × weight
            totalVolume += (set.reps ?? 0) * (set.weightKg ?? 0);
          }
        }
      }

      return {
        workoutId: savedWorkout.id,
        workoutName: workout.name,
        startedAt: workout.startedAt,
        completedAt,
        durationSeconds,
        exerciseCount,
        totalSets,
        totalReps,
        totalVolume,
        newPRs,
      };
    },
    onSuccess: () => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}
