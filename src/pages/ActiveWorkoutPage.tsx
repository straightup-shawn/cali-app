import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';
import { usePreviousPerformance, formatPreviousSet } from '@/hooks/usePreviousPerformance';
import { requestNotificationPermission } from '@/lib/notifications';
import { initAudioContext } from '@/lib/audio-alert';
import ExercisePicker from '@/components/ExercisePicker';
import RestTimerOverlay from '@/components/workout/RestTimerOverlay';
import { PRCelebration } from '@/components/PRCelebration';
import type { ActiveWorkoutExercise, ActiveSet, ExerciseType } from '@/types';
import type { PreviousSet } from '@/hooks/usePreviousPerformance';

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
    <header className="sticky top-0 z-10 glass-header px-4 py-3">
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm glass-card rounded-2xl p-6 shadow-xl animate-slide-up">
        <h3 className="text-lg font-bold text-gray-100">Discard Workout?</h3>
        <p className="mt-2 text-sm text-gray-400">
          All progress for this workout will be lost. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-gray-700 active:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-500 active:bg-red-700"
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

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

interface SetRowProps {
  set: ActiveSet;
  exerciseType: ExerciseType;
  exerciseId: string;
  previousSet?: PreviousSet;
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete: (exerciseId: string, setId: string) => void;
  onUncomplete: (exerciseId: string, setId: string) => void;
  onDelete: (exerciseId: string, setId: string) => void;
}

function SetRow({ set, exerciseType, exerciseId, previousSet, onUpdate, onComplete, onUncomplete, onDelete }: SetRowProps) {
  const [showRpePicker, setShowRpePicker] = useState(false);
  const showReps = ['bodyweight', 'weighted', 'assisted'].includes(exerciseType);
  const showWeight = ['weighted', 'assisted'].includes(exerciseType);
  const showDuration = ['duration', 'static_hold'].includes(exerciseType);
  const showRpe = true; // RPE is available for all exercise types

  const previousLabel = formatPreviousSet(previousSet, exerciseType);

  return (
    <div
      className={`overflow-hidden rounded-xl border px-2 py-2 ${
        set.completed
          ? 'border-green-800 bg-green-950/50'
          : 'border-gray-700 bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {/* Set number + previous stacked */}
        <div className="w-7 shrink-0 text-center">
          <span className="text-xs font-medium text-gray-400">{set.setNumber}</span>
          {previousLabel !== '—' && (
            <p className="truncate text-[9px] leading-tight text-gray-500" title={previousLabel}>{previousLabel}</p>
          )}
        </div>

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
            className="h-10 w-0 min-w-[3rem] flex-1 rounded-md border border-gray-700 bg-gray-900 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
            className="h-10 w-0 min-w-[3rem] flex-1 rounded-md border border-gray-700 bg-gray-900 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
            className="h-10 w-0 min-w-[3.5rem] flex-1 rounded-md border border-gray-700 bg-gray-900 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        )}

        {/* RPE pill button */}
        {showRpe && (
          <button
            type="button"
            onClick={() => setShowRpePicker(!showRpePicker)}
            className={`h-8 shrink-0 rounded-full px-2 text-xs font-medium transition-colors ${
              set.rpe !== null
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            aria-label={set.rpe !== null ? `RPE ${set.rpe}` : 'Set RPE'}
          >
            {set.rpe !== null ? `${set.rpe}` : 'RPE'}
          </button>
        )}

        {/* Complete/uncomplete button */}
        <button
          type="button"
          onClick={() => set.completed ? onUncomplete(exerciseId, set.id) : onComplete(exerciseId, set.id)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            set.completed
              ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
              : 'border border-gray-600 text-gray-500 hover:border-green-500 hover:text-green-400 active:bg-green-950'
          }`}
          aria-label={set.completed ? 'Undo set completion' : 'Complete set'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* Delete set button */}
        <button
          type="button"
          onClick={() => onDelete(exerciseId, set.id)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-600 hover:text-red-400 active:bg-red-950"
          aria-label="Delete set"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Inline RPE picker */}
      {showRpePicker && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-gray-700 bg-gray-900 p-2">
          {RPE_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                onUpdate(exerciseId, set.id, { rpe: v });
                setShowRpePicker(false);
              }}
              className={`min-h-[36px] min-w-[36px] rounded-lg border text-xs font-medium transition-colors ${
                set.rpe === v
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {v}
            </button>
          ))}
          {set.rpe !== null && (
            <button
              type="button"
              onClick={() => {
                onUpdate(exerciseId, set.id, { rpe: null });
                setShowRpePicker(false);
              }}
              className="min-h-[36px] rounded-lg border border-gray-600 bg-gray-700 px-2 text-xs font-medium text-red-400 hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Rest Timer Duration Options
// =============================================================================

const REST_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 240, 300] as const;

// =============================================================================
// ExerciseSection
// =============================================================================

interface ExerciseSectionProps {
  exercise: ActiveWorkoutExercise;
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete: (exerciseId: string, setId: string) => void;
  onUncomplete: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onRemove: (exerciseId: string) => void;
  onRestDurationChange: (exerciseId: string, seconds: number) => void;
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

function ExerciseSection({ exercise, onUpdate, onComplete, onUncomplete, onAddSet, onDeleteSet, onRemove, onRestDurationChange }: ExerciseSectionProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const { data: previousPerformance } = usePreviousPerformance(exercise.exerciseId);

  const currentRest = exercise.restSeconds ?? 90;

  return (
    <div className="overflow-hidden glass-card rounded-2xl p-3">
      {/* Exercise header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-100">
            {exercise.exerciseName}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                TYPE_COLORS[exercise.exerciseType]
              }`}
            >
              {TYPE_LABELS[exercise.exerciseType]}
            </span>
            {/* Rest timer duration button */}
            <button
              type="button"
              onClick={() => setShowRestPicker(!showRestPicker)}
              className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600"
              aria-label={`Rest timer: ${currentRest} seconds. Tap to change.`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {currentRest}s
            </button>
          </div>
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

      {/* Rest duration picker (inline) */}
      {showRestPicker && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-gray-700 bg-gray-800 p-2">
          {REST_DURATION_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                onRestDurationChange(exercise.id, sec);
                setShowRestPicker(false);
              }}
              className={`min-h-[36px] rounded-lg border px-3 text-xs font-medium transition-colors ${
                currentRest === sec
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {sec >= 60 ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : `${sec}s`}
            </button>
          ))}
        </div>
      )}

      {/* Sets */}
      <div className="mt-3 space-y-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            exerciseType={exercise.exerciseType}
            exerciseId={exercise.id}
            previousSet={previousPerformance?.sets.find((ps) => ps.setNumber === set.setNumber)}
            onUpdate={onUpdate}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onDelete={onDeleteSet}
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
// FinishWorkoutButton
// =============================================================================

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
    deleteSet,
    updateSet,
    completeSet,
    uncompleteSet,
    discardWorkout,
  } = useActiveWorkout();

  const {
    finishWorkout: doFinish,
    isFinishing: finishing,
    newPRs,
    showPRCelebration,
    dismissPRCelebration,
    error: finishError,
    result: finishResult,
  } = useFinishWorkout();

  // Timer - derive elapsed from persisted startedAt timestamp (survives refresh)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!workout || workout.isPaused) return;
    const startTime = new Date(workout.startedAt).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    tick(); // immediate first update
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workout?.startedAt, workout?.isPaused]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90); // default 90s
  const [exerciseRestDurations, setExerciseRestDurations] = useState<Record<string, number>>({});

  // Request notification permission on first mount (when starting a workout)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleDiscard = useCallback(() => {
    discardWorkout();
    navigate('/dashboard');
  }, [discardWorkout, navigate]);

  const handleFinish = useCallback(async () => {
    const result = await doFinish();
    // If no PRs to celebrate, navigate directly to summary
    if (result && !result.newPRs.length) {
      navigate('/workout/summary', { state: result });
    }
    // If PRs exist, navigation happens after PR celebration is dismissed
  }, [doFinish, navigate]);

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

  const handleRestDurationChange = useCallback(
    (exerciseId: string, seconds: number) => {
      setExerciseRestDurations((prev) => ({ ...prev, [exerciseId]: seconds }));
    },
    []
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
            if (finishResult) {
              navigate('/workout/summary', { state: finishResult });
            } else {
              navigate('/dashboard');
            }
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
        seconds={elapsedSeconds}
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
              exercise={{
                ...exercise,
                restSeconds: exerciseRestDurations[exercise.id] ?? exercise.restSeconds,
              }}
              onUpdate={updateSet}
              onComplete={(exerciseId, setId) => {
                completeSet(exerciseId, setId);
                // Init audio on user gesture (required for iOS)
                initAudioContext();
                // Find the exercise's rest duration (local override or from exercise state)
                const duration = exerciseRestDurations[exerciseId] ?? exercise.restSeconds ?? 90;
                setRestTimerDuration(duration);
                setRestTimerVisible(true);
              }}
              onUncomplete={uncompleteSet}
              onAddSet={addSet}
              onDeleteSet={deleteSet}
              onRemove={removeExercise}
              onRestDurationChange={handleRestDurationChange}
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

      {/* Add exercise picker (shared component with create new exercise) */}
      <ExercisePicker
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        onSelect={(exercise) => {
          handleAddExercise({
            id: exercise.id,
            name: exercise.name,
            exerciseType: exercise.exercise_type as ExerciseType,
          });
        }}
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
