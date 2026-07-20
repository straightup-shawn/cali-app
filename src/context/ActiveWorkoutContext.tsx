import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  persistWorkout,
  loadPersistedWorkout,
  clearPersistedWorkout,
} from '@/lib/workout-persistence';
import type {
  ActiveWorkout,
  ActiveWorkoutExercise,
  ActiveSet,
  Exercise,
  Routine,
  ExerciseType,
} from '@/types';
import type { RoutineWithExercises } from '@/hooks/useRoutines';

// =============================================================================
// Context Interface
// =============================================================================

interface ActiveWorkoutContextValue {
  workout: ActiveWorkout | null;
  startWorkout: (fromRoutine?: Routine | RoutineWithExercises) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  addSet: (exerciseId: string) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  uncompleteSet: (exerciseId: string, setId: string) => void;
  /** Saves workout to Supabase, detects PRs, clears local state. Returns the workout data for PR celebration. */
  finishWorkout: () => Promise<ActiveWorkout | null>;
  discardWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | undefined>(undefined);

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

function createEmptySet(setNumber: number): ActiveSet {
  return {
    id: generateId(),
    setNumber,
    reps: null,
    weightKg: null,
    durationSeconds: null,
    rpe: null,
    rir: null,
    completed: false,
    completedAt: null,
  };
}

/**
 * Converts a Routine (with exercises) into pre-populated ActiveWorkoutExercise entries.
 */
function routineToExercises(routine: Routine | RoutineWithExercises): ActiveWorkoutExercise[] {
  // Handle the Routine type (from types/index.ts)
  if ('exercises' in routine && Array.isArray(routine.exercises)) {
    return routine.exercises.map((re, index) => {
      const sets: ActiveSet[] = [];
      const targetSets = re.targetSets ?? 3;
      for (let i = 1; i <= targetSets; i++) {
        sets.push({
          id: generateId(),
          setNumber: i,
          reps: re.targetReps ?? null,
          weightKg: re.targetWeightKg ?? null,
          durationSeconds: re.targetDurationSeconds ?? null,
          rpe: null,
          rir: null,
          completed: false,
          completedAt: null,
        });
      }

      return {
        id: generateId(),
        exerciseId: re.exerciseId,
        exerciseName: re.exerciseName,
        exerciseType: re.exerciseType,
        position: index,
        restSeconds: re.restSeconds ?? null,
        sets,
      };
    });
  }

  // Handle RoutineWithExercises (from useRoutines hook - DB row format)
  if ('routine_exercises' in routine && Array.isArray(routine.routine_exercises)) {
    const routineExercises = routine.routine_exercises;
    return routineExercises.map((re, index) => {
      const exerciseDetail = re.exercises;
      const sets: ActiveSet[] = [];
      const targetSets = re.target_sets ?? 3;
      for (let i = 1; i <= targetSets; i++) {
        sets.push({
          id: generateId(),
          setNumber: i,
          reps: re.target_reps ?? null,
          weightKg: re.target_weight_kg ?? null,
          durationSeconds: re.target_duration_seconds ?? null,
          rpe: null,
          rir: null,
          completed: false,
          completedAt: null,
        });
      }

      return {
        id: generateId(),
        exerciseId: exerciseDetail?.id ?? re.exercise_id,
        exerciseName: exerciseDetail?.name ?? 'Unknown Exercise',
        exerciseType: (exerciseDetail?.exercise_type ?? 'bodyweight') as ExerciseType,
        position: index,
        restSeconds: re.rest_seconds ?? null,
        sets,
      };
    });
  }

  return [];
}

// =============================================================================
// Provider
// =============================================================================

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<ActiveWorkout | null>(() => loadPersistedWorkout());
  const workoutRef = useRef<ActiveWorkout | null>(workout);

  // Keep ref in sync for beforeunload handler
  useEffect(() => {
    workoutRef.current = workout;
  }, [workout]);

  // Persist on every state change
  useEffect(() => {
    if (workout) {
      persistWorkout(workout);
    }
  }, [workout]);

  // Safety net: persist on page unload
  useEffect(() => {
    function handleBeforeUnload() {
      if (workoutRef.current) {
        persistWorkout(workoutRef.current);
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const startWorkout = useCallback((fromRoutine?: Routine | RoutineWithExercises) => {
    const exercises = fromRoutine ? routineToExercises(fromRoutine) : [];
    const routineId = fromRoutine?.id ?? null;
    const name = fromRoutine?.name ?? 'Empty Workout';

    const newWorkout: ActiveWorkout = {
      id: generateId(),
      routineId,
      name,
      startedAt: new Date().toISOString(),
      isPaused: false,
      elapsedSeconds: 0,
      exercises,
    };

    setWorkout(newWorkout);
  }, []);

  const addExercise = useCallback((exercise: Exercise) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const position = prev.exercises.length;
      const newExercise: ActiveWorkoutExercise = {
        id: generateId(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseType: exercise.exerciseType,
        position,
        restSeconds: null,
        sets: [createEmptySet(1)],
      };
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const filtered = prev.exercises.filter((e) => e.id !== exerciseId);
      // Re-assign positions
      const reindexed = filtered.map((e, i) => ({ ...e, position: i }));
      return { ...prev, exercises: reindexed };
    });
  }, []);

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      if (fromIndex < 0 || fromIndex >= exercises.length) return prev;
      if (toIndex < 0 || toIndex >= exercises.length) return prev;

      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);

      // Re-assign positions
      const reindexed = exercises.map((e, i) => ({ ...e, position: i }));
      return { ...prev, exercises: reindexed };
    });
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const nextSetNumber = ex.sets.length + 1;
          return {
            ...ex,
            sets: [...ex.sets, createEmptySet(nextSetNumber)],
          };
        }),
      };
    });
  }, []);

  const updateSet = useCallback((exerciseId: string, setId: string, data: Partial<ActiveSet>) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              return { ...s, ...data };
            }),
          };
        }),
      };
    });
  }, []);

  const completeSet = useCallback((exerciseId: string, setId: string) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              return { ...s, completed: true, completedAt: new Date().toISOString() };
            }),
          };
        }),
      };
    });
  }, []);

  const uncompleteSet = useCallback((exerciseId: string, setId: string) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              return { ...s, completed: false, completedAt: null };
            }),
          };
        }),
      };
    });
  }, []);

  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const filtered = ex.sets.filter((s) => s.id !== setId);
          // Renumber remaining sets
          const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }));
          return { ...ex, sets: renumbered };
        }),
      };
    });
  }, []);

  const finishWorkout = useCallback(async (): Promise<ActiveWorkout | null> => {
    const current = workoutRef.current;
    if (!current || !user) return null;

    // Capture the workout data before clearing
    const finishedWorkout = { ...current };

    // Clear local state and persistence
    clearPersistedWorkout();
    setWorkout(null);

    return finishedWorkout;
  }, [user]);

  const discardWorkout = useCallback(() => {
    clearPersistedWorkout();
    setWorkout(null);
  }, []);

  const pauseWorkout = useCallback(() => {
    setWorkout((prev) => {
      if (!prev || prev.isPaused) return prev;
      return { ...prev, isPaused: true };
    });
  }, []);

  const resumeWorkout = useCallback(() => {
    setWorkout((prev) => {
      if (!prev || !prev.isPaused) return prev;
      return { ...prev, isPaused: false };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: ActiveWorkoutContextValue = {
    workout,
    startWorkout,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    deleteSet,
    updateSet,
    completeSet,
    uncompleteSet,
    finishWorkout,
    discardWorkout,
    pauseWorkout,
    resumeWorkout,
  };

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useActiveWorkout(): ActiveWorkoutContextValue {
  const context = useContext(ActiveWorkoutContext);
  if (context === undefined) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
}
