import type { ActiveWorkoutExercise, PersonalRecord, RecordType } from '@/types';

// =============================================================================
// Types
// =============================================================================

export interface PRCheck {
  exerciseId: string;
  exerciseName: string;
  recordType: RecordType;
  newValue: number;
  previousValue: number | null;
}

export interface CompletedWorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseType: string;
  sets: {
    completed: boolean;
    reps: number | null;
    weightKg: number | null;
    durationSeconds: number | null;
  }[];
}

// =============================================================================
// Helpers
// =============================================================================

function getCurrentRecord(
  records: PersonalRecord[],
  exerciseId: string,
  recordType: RecordType
): number {
  const record = records.find(
    (r) => r.exerciseId === exerciseId && r.recordType === recordType
  );
  return record?.value ?? 0;
}

// =============================================================================
// PR Detection
// =============================================================================

/**
 * Detects new personal records from a completed workout's exercises.
 * Compares against existing records and returns only strictly-greater values.
 * No duplicate record types per exercise in the result.
 *
 * Record types:
 * - max_reps: highest reps in any completed set for the exercise
 * - max_weight: highest weight used in any completed set
 * - max_volume: highest (reps × weight) for a single completed set
 * - longest_hold: longest duration for any completed set
 */
export function detectPersonalRecords(
  workoutExercises: CompletedWorkoutExercise[],
  currentRecords: PersonalRecord[]
): PRCheck[] {
  const newPRs: PRCheck[] = [];

  for (const exercise of workoutExercises) {
    const completedSets = exercise.sets.filter((s) => s.completed);
    if (completedSets.length === 0) continue;

    // Max reps (bodyweight, weighted, assisted)
    if (['bodyweight', 'weighted', 'assisted'].includes(exercise.exerciseType)) {
      const repsValues = completedSets
        .map((s) => s.reps ?? 0)
        .filter((r) => r > 0);
      if (repsValues.length > 0) {
        const maxReps = Math.max(...repsValues);
        const currentMax = getCurrentRecord(currentRecords, exercise.exerciseId, 'max_reps');
        if (maxReps > currentMax) {
          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            recordType: 'max_reps',
            newValue: maxReps,
            previousValue: currentMax > 0 ? currentMax : null,
          });
        }
      }
    }

    // Max weight (weighted exercises)
    if (exercise.exerciseType === 'weighted') {
      const weightValues = completedSets
        .map((s) => s.weightKg ?? 0)
        .filter((w) => w > 0);
      if (weightValues.length > 0) {
        const maxWeight = Math.max(...weightValues);
        const currentMax = getCurrentRecord(currentRecords, exercise.exerciseId, 'max_weight');
        if (maxWeight > currentMax) {
          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            recordType: 'max_weight',
            newValue: maxWeight,
            previousValue: currentMax > 0 ? currentMax : null,
          });
        }
      }
    }

    // Max volume (reps × weight for weighted exercises)
    if (exercise.exerciseType === 'weighted') {
      const volumeValues = completedSets
        .map((s) => (s.reps ?? 0) * (s.weightKg ?? 0))
        .filter((v) => v > 0);
      if (volumeValues.length > 0) {
        const maxVolume = Math.max(...volumeValues);
        const currentMax = getCurrentRecord(currentRecords, exercise.exerciseId, 'max_volume');
        if (maxVolume > currentMax) {
          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            recordType: 'max_volume',
            newValue: maxVolume,
            previousValue: currentMax > 0 ? currentMax : null,
          });
        }
      }
    }

    // Longest hold (duration, static_hold)
    if (['duration', 'static_hold'].includes(exercise.exerciseType)) {
      const durationValues = completedSets
        .map((s) => s.durationSeconds ?? 0)
        .filter((d) => d > 0);
      if (durationValues.length > 0) {
        const longestHold = Math.max(...durationValues);
        const currentMax = getCurrentRecord(currentRecords, exercise.exerciseId, 'longest_hold');
        if (longestHold > currentMax) {
          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            recordType: 'longest_hold',
            newValue: longestHold,
            previousValue: currentMax > 0 ? currentMax : null,
          });
        }
      }
    }
  }

  return newPRs;
}

/**
 * Converts ActiveWorkoutExercise[] into CompletedWorkoutExercise[] for PR detection.
 */
export function toCompletedExercises(
  exercises: ActiveWorkoutExercise[]
): CompletedWorkoutExercise[] {
  return exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    exerciseType: ex.exerciseType,
    sets: ex.sets.map((s) => ({
      completed: s.completed,
      reps: s.reps,
      weightKg: s.weightKg,
      durationSeconds: s.durationSeconds,
    })),
  }));
}
