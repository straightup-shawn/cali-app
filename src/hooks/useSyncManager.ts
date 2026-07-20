import { useEffect, useRef, useCallback } from 'react';
import {
  getPendingSyncItems,
  removePendingItem,
  incrementPendingItemAttempts,
  syncWithRetry,
} from '@/lib/sync';
import { showSyncToast } from '@/components/SyncToast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ActiveWorkout } from '@/types';

// =============================================================================
// Hook: useSyncManager
// =============================================================================

/**
 * Manages sync of pending workouts when the device comes online.
 * Listens for the 'online' event and processes all queued items.
 * Shows toast notifications on success or persistent failure.
 *
 * Place this hook in a component rendered while the user is authenticated.
 */
export function useSyncManager(): void {
  const { user } = useAuth();
  const isSyncingRef = useRef(false);

  const processPendingSync = useCallback(async () => {
    if (!user || isSyncingRef.current) return;

    const items = getPendingSyncItems();
    if (items.length === 0) return;

    isSyncingRef.current = true;

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        await syncWithRetry(() => saveWorkoutToSupabase(item.workout, user.id));
        removePendingItem(item.id);
        successCount++;
      } catch {
        incrementPendingItemAttempts(item.id);
        failCount++;
      }
    }

    if (successCount > 0) {
      showSyncToast(
        'success',
        successCount === 1
          ? 'Workout synced successfully'
          : `${successCount} workouts synced successfully`
      );
    }

    if (failCount > 0) {
      showSyncToast(
        'error',
        'Sync failed — will retry when connection improves'
      );
    }

    isSyncingRef.current = false;
  }, [user]);

  useEffect(() => {
    // Process pending items on mount (in case we're already online)
    if (navigator.onLine) {
      processPendingSync();
    }

    // Listen for online event to trigger sync
    const handleOnline = () => {
      processPendingSync();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processPendingSync]);
}

// =============================================================================
// Direct Supabase save (used by sync queue, mirrors useSaveWorkout logic)
// =============================================================================

async function saveWorkoutToSupabase(
  workout: ActiveWorkout,
  userId: string
): Promise<void> {
  const completedAt = workout.exercises.some((e) =>
    e.sets.some((s) => s.completedAt)
  )
    ? new Date().toISOString()
    : new Date().toISOString();

  const startedAt = new Date(workout.startedAt);
  const durationSeconds = Math.round(
    (new Date(completedAt).getTime() - startedAt.getTime()) / 1000
  );

  // 1. Insert workout record
  const { data: savedWorkout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      id: workout.id,
      user_id: userId,
      routine_id: workout.routineId,
      name: workout.name,
      started_at: workout.startedAt,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
      notes: null,
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
}
