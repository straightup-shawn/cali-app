import { useCallback, useState } from 'react';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useSaveWorkout, type SaveWorkoutResult } from '@/hooks/useSaveWorkout';
import { addToPendingSync } from '@/lib/sync';
import { showSyncToast } from '@/components/SyncToast';
import { isProgressionEnabled } from '@/lib/feature-flags';
import { useProgressionEval } from '@/hooks/useProgression';
import type { PRCheck } from '@/lib/personal-records';
import type { WorkoutEvalInput } from '@/types/progression';

// =============================================================================
// Types
// =============================================================================

export interface FinishWorkoutState {
  isFinishing: boolean;
  error: string | null;
  newPRs: PRCheck[];
  showPRCelebration: boolean;
  result: SaveWorkoutResult | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Orchestrates the complete workout finish flow:
 * 1. Clears active workout from context and localStorage
 * 2. Saves workout to Supabase via useSaveWorkout (includes sets, exercises)
 * 3. Detects personal records and upserts new ones
 * 4. Returns PR celebration state and summary result for UI display
 */
export function useFinishWorkout() {
  const { finishWorkout: contextFinish } = useActiveWorkout();
  const saveWorkoutMutation = useSaveWorkout();
  const progressionEval = useProgressionEval();
  const [state, setState] = useState<FinishWorkoutState>({
    isFinishing: false,
    error: null,
    newPRs: [],
    showPRCelebration: false,
    result: null,
  });

  const finishWorkout = useCallback(async (): Promise<SaveWorkoutResult | null> => {
    setState((prev) => ({ ...prev, isFinishing: true, error: null }));

    try {
      // Step 1: Get the workout data and clear local state
      const workoutData = await contextFinish();
      if (!workoutData) {
        setState((prev) => ({ ...prev, isFinishing: false }));
        return null;
      }

      // Step 2: If offline, queue for later sync
      if (!navigator.onLine) {
        addToPendingSync(workoutData);
        showSyncToast('info', 'Offline — workout saved locally, will sync when online');
        setState({
          isFinishing: false,
          error: null,
          newPRs: [],
          showPRCelebration: false,
          result: null,
        });
        return null;
      }

      // Step 3: Save to Supabase + detect PRs
      const result = await saveWorkoutMutation.mutateAsync(workoutData);

      // Step 4: Progression evaluation (if enabled) — non-blocking
      if (isProgressionEnabled()) {
        try {
          const evalInput: WorkoutEvalInput = {
            workoutId: result.workoutId,
            completedAt: result.completedAt,
            exercises: workoutData.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets.map((s) => ({
                completed: s.completed,
                reps: s.reps,
                weightKg: s.weightKg,
                durationSeconds: s.durationSeconds,
              })),
            })),
          };
          await progressionEval.mutateAsync(evalInput);
        } catch (progressionError) {
          // Log but don't block workout completion
          console.error('[Progression] Evaluation failed:', progressionError);
        }
      }

      // Step 5: Show celebration if PRs were achieved
      if (result.newPRs.length > 0) {
        setState({
          isFinishing: false,
          error: null,
          newPRs: result.newPRs,
          showPRCelebration: true,
          result,
        });
      } else {
        setState({
          isFinishing: false,
          error: null,
          newPRs: [],
          showPRCelebration: false,
          result,
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save workout';
      setState({
        isFinishing: false,
        error: message,
        newPRs: [],
        showPRCelebration: false,
        result: null,
      });
      return null;
    }
  }, [contextFinish, saveWorkoutMutation, progressionEval]);

  const dismissPRCelebration = useCallback(() => {
    setState((prev) => ({ ...prev, showPRCelebration: false }));
  }, []);

  return {
    finishWorkout,
    dismissPRCelebration,
    ...state,
  };
}
