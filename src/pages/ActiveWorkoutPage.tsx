import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';
import { useTimer } from '@/hooks/useTimer';
import { useExercises } from '@/hooks/useExercises';
import RestTimerOverlay from '@/components/workout/RestTimerOverlay';
import { PRCelebration } from '@/components/PRCelebration';
import type { ActiveWorkoutExercise, ActiveSet, ExerciseType } from '@/types';

// =============================================================================
// Helper: format seconds as HH:MM:SS or MM:SS
// =============================================================================

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// =============================================================================
// WorkoutTimerBar
// =============================================================================

interface WorkoutTimerBarProps {
  seconds: number;
  workoutName: string;
  onMenuToggle: () => void;
}

function WorkoutTimerBar({ seconds, workoutName, onMenuToggle }: WorkoutTimerBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-gray-100">
            {workoutName}
          </h1>
          <p className="text-sm font-mono text-indigo-400">{formatTime(seconds)}</p>
        </div>
        <button
          type="button"
          onClick={onMenuToggle}
          className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 active:bg-gray-700"
          aria-label="Workout menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
      </div>
    </header>
  );
}

// =============================================================================
// HeaderMenu (discard option)
// =============================================================================

interface HeaderMenuProps {
  open: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

function HeaderMenu({ open, onClose, onDiscard }: HeaderMenuProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-4 top-14 z-30 w-48 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-lg">
        <button
          type="button"
          onClick={onDiscard}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 active:bg-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Discard Workout
        </button>
      </div>
    </>
  );
}

// =============================================================================
// DiscardConfirmDialog
// =============================================================================

interface DiscardConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DiscardConfirmDialog({ open, onCancel, onConfirm }: DiscardConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-100">Discard Workout?</h3>
        <p className="mt-2 text-sm text-gray-400">
          All progress for this workout will be lost. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 active:bg-red-700"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SetRow
// =============================================================================

interface SetRowProps {
  set: ActiveSet;
  exerciseType: ExerciseType;
  exerciseId: string;
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete: (exerciseId: string, setId: string) => void;
}

function SetRow({ set, exerciseType, exerciseId, onUpdate, onComplete }: SetRowProps) {
  const showReps = ['bodyweight', 'weighted', 'assisted'].includes(exerciseType);
  const showWeight = ['weighted', 'assisted'].includes(exerciseType);
  const showDuration = ['duration', 'static_hold'].includes(exerciseType);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        set.completed
          ? 'border-green-800 bg-green-950/50'
          : 'border-gray-700 bg-gray-800'
      }`}
    >
      {/* Set number */}
      <span className="w-6 text-center text-xs font-medium text-gray-500">
        {set.setNumber}
      </span>

      {/* Reps input */}
      {showReps && (
        <input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={set.reps ?? ''}
          onChange={(e) =>
            onUpdate(exerciseId, set.id, {
              reps: e.target.value ? parseInt(e.target.value, 10) : null,
            })
          }
          disabled={set.completed}
          className="h-11 w-16 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-800/50 disabled:text-gray-500"
        />
      )}

      {/* Weight input */}
      {showWeight && (
        <input
          type="number"
          inputMode="decimal"
          placeholder="kg"
          value={set.weightKg ?? ''}
          onChange={(e) =>
            onUpdate(exerciseId, set.id, {
              weightKg: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          disabled={set.completed}
          className="h-11 w-16 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-800/50 disabled:text-gray-500"
        />
      )}

      {/* Duration input */}
      {showDuration && (
        <input
          type="number"
          inputMode="numeric"
          placeholder="Sec"
          value={set.durationSeconds ?? ''}
          onChange={(e) =>
            onUpdate(exerciseId, set.id, {
              durationSeconds: e.target.value ? parseInt(e.target.value, 10) : null,
            })
          }
          disabled={set.completed}
          className="h-11 w-20 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-800/50 disabled:text-gray-500"
        />
      )}

      {/* Complete button */}
      <button
        type="button"
        onClick={() => onComplete(exerciseId, set.id)}
        disabled={set.completed}
        className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
          set.completed
            ? 'bg-green-500 text-white'
            : 'border border-gray-600 text-gray-500 hover:border-green-500 hover:text-green-400 active:bg-green-950'
        }`}
        aria-label={set.completed ? 'Set completed' : 'Complete set'}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// ExerciseSection
// =============================================================================

interface ExerciseSectionProps {
  exercise: ActiveWorkoutExercise;
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onRemove: (exerciseId: string) => void;
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
  duration: 'Duration',
  static_hold: 'Static Hold',
};

const TYPE_COLORS: Record<ExerciseType, string> = {
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
};

function ExerciseSection({ exercise, onUpdate, onComplete, onAddSet, onRemove }: ExerciseSectionProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      {/* Exercise header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-100">
            {exercise.exerciseName}
          </h3>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              TYPE_COLORS[exercise.exerciseType]
            }`}
          >
            {TYPE_LABELS[exercise.exerciseType]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowRemoveConfirm(true)}
          className="ml-2 flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-950 hover:text-red-400 active:bg-red-900"
          aria-label={`Remove ${exercise.exerciseName}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Sets */}
      <div className="mt-3 space-y-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            exerciseType={exercise.exerciseType}
            exerciseId={exercise.id}
            onUpdate={onUpdate}
            onComplete={onComplete}
          />
        ))}
      </div>

      {/* Add set button */}
      <button
        type="button"
        onClick={() => onAddSet(exercise.id)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-700 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400 active:bg-indigo-950/50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Set
      </button>

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 p-3">
          <p className="flex-1 text-xs text-red-300">Remove this exercise and all its sets?</p>
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(false)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onRemove(exercise.id);
              setShowRemoveConfirm(false);
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AddExerciseSheet (bottom sheet with exercise picker)
// =============================================================================

interface AddExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; exerciseType: ExerciseType }) => void;
  excludeIds: string[];
}

function AddExerciseSheet({ open, onClose, onSelect, excludeIds }: AddExerciseSheetProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  const { data: exercises, isLoading } = useExercises({
    search: debouncedSearch || undefined,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div className="relative z-50 flex max-h-[85vh] w-full flex-col rounded-t-xl border border-gray-700 bg-gray-900 sm:max-w-lg sm:rounded-xl sm:shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-100">Add Exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 active:bg-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="block h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
            </div>
          ) : exercises && exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.map((exercise) => {
                const isExcluded = excludeIds.includes(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    disabled={isExcluded}
                    onClick={() =>
                      onSelect({
                        id: exercise.id,
                        name: exercise.name,
                        exerciseType: exercise.exercise_type as ExerciseType,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      isExcluded
                        ? 'border-gray-800 bg-gray-800/50 opacity-50'
                        : 'border-gray-700 bg-gray-800 hover:border-indigo-600 hover:bg-gray-700 active:bg-gray-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-100">{exercise.name}</p>
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {exercise.muscle_groups
                            .map((g: string) =>
                              g.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                            )
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[exercise.exercise_type as ExerciseType] ?? 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {TYPE_LABELS[exercise.exercise_type as ExerciseType] ?? exercise.exercise_type}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">No exercises found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FinishWorkoutButton
// =============================================================================

interface FinishWorkoutButtonProps {
  onFinish: () => void;
  disabled: boolean;
}

function FinishWorkoutButton({ onFinish, disabled }: FinishWorkoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onFinish}
      disabled={disabled}
      className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Finish Workout
    </button>
  );
}

// =============================================================================
// ActiveWorkoutPage (main export)
// =============================================================================

export default function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const {
    workout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    completeSet,
    discardWorkout,
  } = useActiveWorkout();

  const {
    finishWorkout: doFinish,
    isFinishing: finishing,
    newPRs,
    showPRCelebration,
    dismissPRCelebration,
    error: finishError,
  } = useFinishWorkout();

  // Timer - count up from workout start
  const timer = useTimer({ mode: 'countup' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90); // default 90s

  // Start timer on mount if workout is active
  useEffect(() => {
    if (workout && !workout.isPaused) {
      timer.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync timer with elapsed seconds from workout state
  useEffect(() => {
    if (workout) {
      timer.reset(workout.elapsedSeconds);
      if (!workout.isPaused) {
        timer.start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.isPaused]);

  const handleDiscard = useCallback(() => {
    discardWorkout();
    navigate('/dashboard');
  }, [discardWorkout, navigate]);

  const handleFinish = useCallback(async () => {
    await doFinish();
    // Navigation handled after PR celebration is dismissed, or if no PRs
  }, [doFinish]);

  const handleAddExercise = useCallback(
    (exercise: { id: string; name: string; exerciseType: ExerciseType }) => {
      addExercise({
        id: exercise.id,
        userId: null,
        name: exercise.name,
        exerciseType: exercise.exerciseType,
        muscleGroups: [],
        instructions: null,
        progressesTo: null,
        isSystem: false,
        createdAt: '',
      });
      setAddExerciseOpen(false);
    },
    [addExercise]
  );

  // If no workout is active and not showing PRs, auto-navigate to dashboard
  if (!workout && !showPRCelebration) {
    // Use effect to navigate instead of rendering a dead-end
    navigate('/dashboard', { replace: true });
    return null;
  }

  // Show PR celebration even after workout is cleared
  if (!workout && showPRCelebration) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <PRCelebration
          newPRs={newPRs}
          onClose={() => {
            dismissPRCelebration();
            navigate('/dashboard');
          }}
        />
      </div>
    );
  }

  // At this point workout is guaranteed to be non-null
  if (!workout) return null;

  const exerciseIds = workout.exercises.map((e) => e.exerciseId);

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-950 pb-24">
      {/* Timer bar header */}
      <WorkoutTimerBar
        seconds={timer.seconds}
        workoutName={workout.name}
        onMenuToggle={() => setMenuOpen((o) => !o)}
      />

      {/* Header menu */}
      <HeaderMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onDiscard={() => {
          setMenuOpen(false);
          setDiscardOpen(true);
        }}
      />

      {/* Exercise list */}
      <div className="flex-1 space-y-4 px-4 pt-4">
        {workout.exercises.length > 0 ? (
          workout.exercises.map((exercise) => (
            <ExerciseSection
              key={exercise.id}
              exercise={exercise}
              onUpdate={updateSet}
              onComplete={(exerciseId, setId) => {
                completeSet(exerciseId, setId);
                // Find the exercise's rest duration or use default
                const ex = workout.exercises.find((e) => e.id === exerciseId);
                const duration = ex?.restSeconds ?? 90;
                setRestTimerDuration(duration);
                setRestTimerVisible(true);
              }}
              onAddSet={addSet}
              onRemove={removeExercise}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-600"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-300">No exercises yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Add exercises to start logging your workout
            </p>
          </div>
        )}

        {/* Add exercise button */}
        <button
          type="button"
          onClick={() => setAddExerciseOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 py-4 text-sm font-medium text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400 active:bg-indigo-950/50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exercise
        </button>
      </div>

      {/* Fixed bottom: Finish button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-800 bg-gray-900 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <FinishWorkoutButton onFinish={handleFinish} disabled={finishing} />
        {finishError && (
          <p className="mt-2 text-center text-sm text-red-400">{finishError}</p>
        )}
      </div>

      {/* Discard confirmation dialog */}
      <DiscardConfirmDialog
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={handleDiscard}
      />

      {/* Add exercise sheet */}
      <AddExerciseSheet
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        onSelect={handleAddExercise}
        excludeIds={exerciseIds}
      />

      {/* Rest timer overlay - auto-shows after completing a set */}
      <RestTimerOverlay
        defaultSeconds={restTimerDuration}
        onClose={() => setRestTimerVisible(false)}
        visible={restTimerVisible}
      />

      {/* Finish error display */}
      {finishError && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {finishError}
        </div>
      )}
    </div>
  );
}
