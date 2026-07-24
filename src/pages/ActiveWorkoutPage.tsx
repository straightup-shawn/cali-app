import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import { useBodyweightEntries } from '@/hooks/useBodyweight';
import { useExercises } from '@/hooks/useExercises';
import { calculateEffectiveResistance, calculateSetVolume, calculateIsometricLoad } from '@/lib/volume-calculator';
import { getDefaultClassification, getDefaultFractionByType } from '@/lib/default-classifications';
import { requestNotificationPermission } from '@/lib/notifications';
import { initAudioContext } from '@/lib/audio-alert';
import ExercisePicker from '@/components/ExercisePicker';
import RestTimerOverlay from '@/components/workout/RestTimerOverlay';
import { PRCelebration } from '@/components/PRCelebration';
import ExerciseSection from '@/components/workout/ExerciseSection';
import type { ExerciseType } from '@/types';

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
// AnimatedVolume — counts up smoothly when volume changes
// =============================================================================

function AnimatedVolume({ value, unit }: { value: number; unit: string }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const duration = 600; // ms
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = to;
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  const label = displayed >= 1000
    ? `${(displayed / 1000).toFixed(1).replace(/\.0$/, '')}k ${unit}`
    : `${displayed} ${unit}`;

  return <span className="text-white">{label}</span>;
}

// =============================================================================
// WorkoutTimerBar
// =============================================================================

interface WorkoutTimerBarProps {
  seconds: number;
  workoutName: string;
  volumeValue: number;
  volumeUnit: string;
  onMenuToggle: () => void;
}

function WorkoutTimerBar({ seconds, workoutName, volumeValue, volumeUnit, onMenuToggle }: WorkoutTimerBarProps) {
  return (
    <header className="sticky top-0 z-10 glass-header px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-gray-100">
            {workoutName}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono text-indigo-400">{formatTime(seconds)}</p>
            {volumeValue > 0 && (
              <p className="text-sm font-medium text-gray-400">
                Vol: <AnimatedVolume value={volumeValue} unit={volumeUnit} />
              </p>
            )}
          </div>
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
      <div className="fixed right-4 top-24 z-30 w-48 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-lg">
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
    reorderExercises,
    addSet,
    deleteSet,
    updateSet,
    completeSet,
    uncompleteSet,
    discardWorkout,
  } = useActiveWorkout();

  const { preference, weightLabel } = useUnitPreference();
  const { data: bodyweightEntries } = useBodyweightEntries();
  const { data: allExercises } = useExercises();

  // Get latest bodyweight for effective resistance calculations
  const latestBodyweightKg = useMemo(() => {
    if (!bodyweightEntries || bodyweightEntries.length === 0) return null;
    return bodyweightEntries[0].weight_kg;
  }, [bodyweightEntries]);

  // Build a lookup map for exercise classifications
  const exerciseClassificationMap = useMemo(() => {
    const map = new Map<string, { bodyweight_fraction: number | null; resistance_model: string | null; volume_mode: string | null }>();
    if (allExercises) {
      for (const ex of allExercises) {
        map.set(ex.id, {
          bodyweight_fraction: ex.bodyweight_fraction ?? null,
          resistance_model: ex.resistance_model ?? null,
          volume_mode: ex.volume_mode ?? null,
        });
      }
    }
    return map;
  }, [allExercises]);

  const {
    finishWorkout: doFinish,
    isFinishing: finishing,
    newPRs,
    showPRCelebration,
    dismissPRCelebration,
    error: finishError,
    result: finishResult,
  } = useFinishWorkout();

  // Live volume: enhanced with bodyweight fractions from AI classification
  const liveVolumeValue = useMemo(() => {
    if (!workout) return 0;
    const bw = latestBodyweightKg ?? 0;

    let totalKg = 0;
    for (const ex of workout.exercises) {
      const classification = exerciseClassificationMap.get(ex.exerciseId);
      const fraction = classification?.bodyweight_fraction ?? null;
      const resistanceModel = classification?.resistance_model ?? null;
      const volumeMode = classification?.volume_mode ?? 'repetitions';

      for (const set of ex.sets) {
        if (!set.completed) continue;

        // If we have classification data, use effective resistance
        if (fraction !== null && resistanceModel !== null && bw > 0) {
          const effectiveR = calculateEffectiveResistance({
            bodyweightKg: bw,
            bodyweightFraction: fraction,
            addedResistanceKg: set.weightKg ?? 0,
            assistanceKg: ex.exerciseType === 'assisted' ? (set.weightKg ?? 0) : 0,
            resistanceModel,
          });

          if (volumeMode === 'duration' && set.durationSeconds) {
            totalKg += calculateIsometricLoad(effectiveR, set.durationSeconds) / 60;
          } else if (set.reps != null) {
            totalKg += calculateSetVolume(effectiveR, set.reps);
          }
        } else if (bw > 0 && set.reps != null) {
          // Fallback: use default classifications from exercise name or type
          const nameDefault = getDefaultClassification(ex.exerciseName);
          const defaultFraction = nameDefault?.bodyweight_fraction ?? getDefaultFractionByType(ex.exerciseType);

          if (defaultFraction > 0) {
            const effectiveR = Math.max(0, bw * defaultFraction + (set.weightKg ?? 0) - (ex.exerciseType === 'assisted' ? (set.weightKg ?? 0) : 0));
            totalKg += effectiveR * set.reps;
          } else if (set.weightKg != null) {
            // weighted: just weight × reps
            totalKg += set.reps * set.weightKg;
          }
        } else {
          // No bodyweight available: simple weight × reps
          if (set.reps != null && set.weightKg != null) {
            totalKg += set.reps * set.weightKg;
          }
        }
      }
    }

    return preference === 'imperial'
      ? Math.round(totalKg * 2.20462)
      : Math.round(totalKg);
  }, [workout, preference, latestBodyweightKg, exerciseClassificationMap]);

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
  if (!workout && !showPRCelebration && !finishing) {
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
    <div className={`relative flex min-h-screen flex-col bg-gray-950 ${restTimerVisible ? 'pb-40' : 'pb-24'}`}>
      {/* Timer bar header */}
      <WorkoutTimerBar
        seconds={elapsedSeconds}
        workoutName={workout.name}
        volumeValue={liveVolumeValue}
        volumeUnit={weightLabel}
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
          workout.exercises.map((exercise, index) => (
            <ExerciseSection
              key={exercise.id}
              exercise={{
                ...exercise,
                restSeconds: exerciseRestDurations[exercise.id] ?? exercise.restSeconds,
              }}
              index={index}
              total={workout.exercises.length}
              mode="active"
              onUpdate={updateSet}
              onComplete={(exerciseId, setId) => {
                completeSet(exerciseId, setId);
                // Haptic feedback on set completion
                if (navigator.vibrate) navigator.vibrate(20);
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
              onMoveUp={() => reorderExercises(index, index - 1)}
              onMoveDown={() => reorderExercises(index, index + 1)}
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

      {/* Fixed bottom: Rest timer + Finish button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-800 bg-gray-900 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Rest timer inline (above Finish) */}
        {restTimerVisible && (
          <div className="mb-2">
            <RestTimerOverlay
              defaultSeconds={restTimerDuration}
              onClose={() => setRestTimerVisible(false)}
              visible={restTimerVisible}
              inline
            />
          </div>
        )}
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

      {/* Rest timer is now rendered inline in the fixed bottom bar above */}

      {/* Finish error display */}
      {finishError && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {finishError}
        </div>
      )}
    </div>
  );
}
