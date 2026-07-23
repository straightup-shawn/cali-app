import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  ActiveWorkout,
  ActiveWorkoutExercise,
  ActiveSet,
  ExerciseType,
} from '@/types';
import type {
  WorkoutWithExercises,
  UpdateWorkoutPayload,
  UpdateSetPayload,
  AddSetPayload,
  AddExercisePayload,
} from '@/hooks/useWorkouts';

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Converts a fetched WorkoutWithExercises (DB format) into ActiveWorkout shape
 * for local editing.
 */
function workoutToEditState(workout: WorkoutWithExercises): ActiveWorkout {
  const exercises: ActiveWorkoutExercise[] = (workout.workout_exercises ?? []).map(
    (we, index) => {
      const sets: ActiveSet[] = (we.exercise_sets ?? []).map((s) => ({
        id: s.id,
        setNumber: s.set_number,
        reps: s.reps,
        weightKg: s.weight_kg,
        durationSeconds: s.duration_seconds,
        rpe: s.rpe,
        rir: null,
        completed: true,
        completedAt: null,
      }));

      return {
        id: we.id,
        exerciseId: we.exercises?.id ?? we.exercise_id,
        exerciseName: we.exercises?.name ?? 'Unknown Exercise',
        exerciseType: (we.exercises?.exercise_type ?? 'bodyweight') as ExerciseType,
        position: index,
        restSeconds: null,
        sets,
      };
    }
  );

  return {
    id: workout.id,
    routineId: workout.routine_id ?? null,
    name: workout.name,
    startedAt: workout.started_at,
    isPaused: false,
    elapsedSeconds: 0,
    exercises,
  };
}

/**
 * Deep-clone the edit state for snapshot comparison.
 */
function cloneState(state: ActiveWorkout): ActiveWorkout {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Compare two ActiveSet objects for value equality (fields that matter for updates).
 */
function setsEqual(a: ActiveSet, b: ActiveSet): boolean {
  return (
    a.reps === b.reps &&
    a.weightKg === b.weightKg &&
    a.durationSeconds === b.durationSeconds &&
    a.rpe === b.rpe
  );
}

// =============================================================================
// Hook
// =============================================================================

export interface UseEditWorkoutStateReturn {
  editState: ActiveWorkout | null;
  isDirty: boolean;
  isLoading: boolean;

  updateWorkoutName: (name: string) => void;
  addExercise: (exercise: { id: string; name: string; exerciseType: ExerciseType }) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  addSet: (exerciseId: string) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  computePayload: () => UpdateWorkoutPayload;
}

export function useEditWorkoutState(
  workout: WorkoutWithExercises | undefined
): UseEditWorkoutStateReturn {
  const [editState, setEditState] = useState<ActiveWorkout | null>(null);
  const originalRef = useRef<ActiveWorkout | null>(null);
  const initializedRef = useRef(false);

  // Initialize editing state when workout first loads
  useEffect(() => {
    if (workout && !initializedRef.current) {
      const state = workoutToEditState(workout);
      setEditState(state);
      originalRef.current = cloneState(state);
      initializedRef.current = true;
    }
  }, [workout]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const isLoading = !editState;

  const isDirty = (() => {
    if (!editState || !originalRef.current) return false;
    return JSON.stringify(editState) !== JSON.stringify(originalRef.current);
  })();

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const updateWorkoutName = useCallback((name: string) => {
    setEditState((prev) => {
      if (!prev) return prev;
      return { ...prev, name };
    });
  }, []);

  const addExercise = useCallback(
    (exercise: { id: string; name: string; exerciseType: ExerciseType }) => {
      setEditState((prev) => {
        if (!prev) return prev;
        const position = prev.exercises.length;
        const newExercise: ActiveWorkoutExercise = {
          id: generateId(),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          exerciseType: exercise.exerciseType,
          position,
          restSeconds: null,
          sets: [
            {
              id: generateId(),
              setNumber: 1,
              reps: null,
              weightKg: null,
              durationSeconds: null,
              rpe: null,
              rir: null,
              completed: true,
              completedAt: null,
            },
          ],
        };
        return { ...prev, exercises: [...prev.exercises, newExercise] };
      });
    },
    []
  );

  const removeExercise = useCallback((exerciseId: string) => {
    setEditState((prev) => {
      if (!prev) return prev;
      const filtered = prev.exercises
        .filter((e) => e.id !== exerciseId)
        .map((e, idx) => ({ ...e, position: idx }));
      return { ...prev, exercises: filtered };
    });
  }, []);

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setEditState((prev) => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      if (fromIndex < 0 || fromIndex >= exercises.length) return prev;
      if (toIndex < 0 || toIndex >= exercises.length) return prev;

      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);

      const reindexed = exercises.map((e, idx) => ({ ...e, position: idx }));
      return { ...prev, exercises: reindexed };
    });
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setEditState((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((e) => {
        if (e.id !== exerciseId) return e;
        const newSet: ActiveSet = {
          id: generateId(),
          setNumber: e.sets.length + 1,
          reps: null,
          weightKg: null,
          durationSeconds: null,
          rpe: null,
          rir: null,
          completed: true,
          completedAt: null,
        };
        return { ...e, sets: [...e.sets, newSet] };
      });
      return { ...prev, exercises };
    });
  }, []);

  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    setEditState((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((e) => {
        if (e.id !== exerciseId) return e;
        const filtered = e.sets
          .filter((s) => s.id !== setId)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...e, sets: filtered };
      });
      return { ...prev, exercises };
    });
  }, []);

  const updateSet = useCallback(
    (exerciseId: string, setId: string, data: Partial<ActiveSet>) => {
      setEditState((prev) => {
        if (!prev) return prev;
        const exercises = prev.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const sets = e.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, ...data };
          });
          return { ...e, sets };
        });
        return { ...prev, exercises };
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // computePayload – diffs editState vs original
  // ---------------------------------------------------------------------------

  const computePayload = useCallback((): UpdateWorkoutPayload => {
    const original = originalRef.current;
    if (!editState || !original) {
      return { workoutId: workout?.id ?? '' };
    }

    const payload: UpdateWorkoutPayload = { workoutId: original.id };

    // Name change
    if (editState.name !== original.name) {
      payload.name = editState.name;
    }

    // Build lookup maps for original exercises/sets
    const originalExerciseIds = new Set(original.exercises.map((e) => e.id));
    const editExerciseIds = new Set(editState.exercises.map((e) => e.id));

    // Deleted exercises (in original but not in edit)
    const deletedExerciseIds = original.exercises
      .filter((e) => !editExerciseIds.has(e.id))
      .map((e) => e.id);
    if (deletedExerciseIds.length > 0) {
      payload.deleteExercises = deletedExerciseIds;
    }

    // Added exercises (in edit but not in original)
    const addedExercises: AddExercisePayload[] = editState.exercises
      .filter((e) => !originalExerciseIds.has(e.id))
      .map((e) => ({
        exercise_id: e.exerciseId,
        position: e.position,
        sets: e.sets.map((s) => ({
          reps: s.reps,
          weight_kg: s.weightKg,
          duration_seconds: s.durationSeconds,
          rpe: s.rpe,
        })),
      }));
    if (addedExercises.length > 0) {
      payload.addExercises = addedExercises;
    }

    // For exercises that exist in both, check sets
    const updatedSets: UpdateSetPayload[] = [];
    const deletedSets: string[] = [];
    const addedSets: AddSetPayload[] = [];

    for (const editExercise of editState.exercises) {
      if (!originalExerciseIds.has(editExercise.id)) continue; // new exercise, handled above

      const originalExercise = original.exercises.find((e) => e.id === editExercise.id);
      if (!originalExercise) continue;

      const originalSetIds = new Set(originalExercise.sets.map((s) => s.id));
      const editSetIds = new Set(editExercise.sets.map((s) => s.id));

      // Deleted sets
      for (const origSet of originalExercise.sets) {
        if (!editSetIds.has(origSet.id)) {
          deletedSets.push(origSet.id);
        }
      }

      // Added sets (new IDs not in original)
      for (const editSet of editExercise.sets) {
        if (!originalSetIds.has(editSet.id)) {
          addedSets.push({
            workout_exercise_id: editExercise.id,
            set_number: editSet.setNumber,
            reps: editSet.reps,
            weight_kg: editSet.weightKg,
            duration_seconds: editSet.durationSeconds,
            rpe: editSet.rpe,
          });
        }
      }

      // Updated sets (same ID, different values)
      for (const editSet of editExercise.sets) {
        if (!originalSetIds.has(editSet.id)) continue; // new set
        const origSet = originalExercise.sets.find((s) => s.id === editSet.id);
        if (!origSet) continue;

        if (!setsEqual(editSet, origSet)) {
          const update: UpdateSetPayload = { id: editSet.id };
          if (editSet.reps !== origSet.reps) update.reps = editSet.reps;
          if (editSet.weightKg !== origSet.weightKg) update.weight_kg = editSet.weightKg;
          if (editSet.durationSeconds !== origSet.durationSeconds)
            update.duration_seconds = editSet.durationSeconds;
          if (editSet.rpe !== origSet.rpe) update.rpe = editSet.rpe;
          updatedSets.push(update);
        }
      }
    }

    if (updatedSets.length > 0) payload.sets = updatedSets;
    if (deletedSets.length > 0) payload.deleteSets = deletedSets;
    if (addedSets.length > 0) payload.addSets = addedSets;

    return payload;
  }, [editState, workout?.id]);

  return {
    editState,
    isDirty,
    isLoading,
    updateWorkoutName,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    deleteSet,
    updateSet,
    computePayload,
  };
}
