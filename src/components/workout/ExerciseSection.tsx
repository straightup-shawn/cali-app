import { useState, useRef, useCallback } from 'react';
import { usePreviousPerformance, formatPreviousSet } from '@/hooks/usePreviousPerformance';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import type { ActiveWorkoutExercise, ActiveSet, ExerciseType } from '@/types';
import type { PreviousSet } from '@/hooks/usePreviousPerformance';

// =============================================================================
// Duration Input — MM:SS two-field input (for exercise sets)
// =============================================================================

function DurationInput({ value, onChange }: { value: number | null; onChange: (s: number | null) => void }) {
  const totalSec = value ?? 0;
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;

  const update = (newM: number, newS: number) => {
    const clamped = Math.min(newM, 99) * 60 + Math.min(newS, 59);
    onChange(clamped > 0 ? clamped : null);
  };

  const fieldClass =
    'h-8 w-10 rounded-md border border-gray-700 bg-gray-900 text-center text-xs text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none';

  return (
    <div className="flex items-center gap-0.5">
      <input
        type="number"
        inputMode="numeric"
        placeholder="MM"
        min={0}
        max={99}
        value={mm || ''}
        onChange={(e) => {
          const v = Math.min(99, Math.max(0, parseInt(e.target.value) || 0));
          update(v, ss);
        }}
        className={fieldClass}
      />
      <span className="text-[10px] text-gray-500">:</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="SS"
        min={0}
        max={59}
        value={ss || ''}
        onChange={(e) => {
          const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
          update(mm, v);
        }}
        className={fieldClass}
      />
    </div>
  );
}

// =============================================================================
// Constants
// =============================================================================

export const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

export const TYPE_LABELS: Record<ExerciseType, string> = {
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
  duration: 'Duration',
  static_hold: 'Static Hold',
  distance: 'Distance',
  rounds: 'Rounds',
  calories: 'Calories',
};

export const TYPE_COLORS: Record<ExerciseType, string> = {
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
  distance: 'bg-cyan-900/50 text-cyan-300',
  rounds: 'bg-yellow-900/50 text-yellow-300',
  calories: 'bg-pink-900/50 text-pink-300',
};

export const REST_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 240, 300] as const;

// =============================================================================
// SetRow
// =============================================================================

interface SetRowProps {
  set: ActiveSet;
  exerciseType: ExerciseType;
  exerciseId: string;
  previousSet?: PreviousSet;
  mode: 'active' | 'edit';
  weightLabel: string;
  kgToDisplay: (kg: number) => number;
  inputToKg: (val: number) => number;
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete?: (exerciseId: string, setId: string) => void;
  onUncomplete?: (exerciseId: string, setId: string) => void;
  onDelete: (exerciseId: string, setId: string) => void;
}

function SetRow({ set, exerciseType, exerciseId, previousSet, mode, weightLabel, kgToDisplay, inputToKg, onUpdate, onComplete, onUncomplete, onDelete }: SetRowProps) {
  const [showRpePicker, setShowRpePicker] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipingRef = useRef(false);

  const showReps = ['bodyweight', 'weighted', 'assisted'].includes(exerciseType);
  const showWeight = ['weighted', 'assisted'].includes(exerciseType);
  const showDuration = ['duration', 'static_hold', 'distance', 'rounds', 'calories'].includes(exerciseType);
  const showDistance = exerciseType === 'distance';
  const showRounds = exerciseType === 'rounds';
  const showCalories = exerciseType === 'calories';
  const showRpe = true;

  const previousLabel = formatPreviousSet(previousSet, exerciseType);
  const isCompleted = mode === 'edit' ? true : set.completed;

  const isPR = isCompleted && previousSet && (() => {
    if (showReps && set.reps != null && previousSet.reps != null) {
      if (showWeight && set.weightKg != null && previousSet.weightKg != null) {
        return set.weightKg > previousSet.weightKg || (set.weightKg === previousSet.weightKg && set.reps > previousSet.reps);
      }
      return set.reps > previousSet.reps;
    }
    if (showDuration && set.durationSeconds != null && previousSet.durationSeconds != null) {
      return set.durationSeconds > previousSet.durationSeconds;
    }
    return false;
  })();

  // Swipe-to-delete handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    // Lock into horizontal swipe if moved more X than Y
    if (!swipingRef.current && Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2) {
      swipingRef.current = true;
    }
    if (swipingRef.current) {
      e.preventDefault();
      setSwipeX(Math.min(0, Math.max(-80, dx)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    if (swipeX < -40) {
      setSwipeX(-72); // snap to reveal delete
    } else {
      setSwipeX(0);
    }
    swipingRef.current = false;
  }, [swipeX]);

  const inputClass = 'h-8 w-0 flex-1 rounded-md border border-gray-700 bg-gray-900 text-center text-xs text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none';

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete button behind (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center">
        <button
          type="button"
          onClick={() => { onDelete(exerciseId, set.id); setSwipeX(0); }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white active:bg-red-700"
          aria-label="Delete set"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Main row content (slides left) */}
      <div
        className={`relative border px-2 py-1.5 rounded-xl transition-transform ${
          isCompleted
            ? 'border-green-800 bg-green-950'
            : 'border-gray-700 bg-gray-800'
        }`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swipingRef.current ? 'none' : 'transform 0.2s ease-out' }}
        onTouchStart={showRpePicker ? undefined : handleTouchStart}
        onTouchMove={showRpePicker ? undefined : handleTouchMove}
        onTouchEnd={showRpePicker ? undefined : handleTouchEnd}
        onClick={() => { if (showRpePicker) setShowRpePicker(false); }}
      >
        <div className="flex items-center gap-1.5">
          {/* Set number + previous */}
          <div className="w-12 shrink-0">
            <div className="text-center">
              {isPR ? (
                <span className="text-xs">🏆</span>
              ) : (
                <span className="text-xs font-semibold text-gray-400">{set.setNumber}</span>
              )}
            </div>
            {previousLabel !== '—' && (
              <p className="text-[9px] leading-tight text-gray-500 text-center" title={previousLabel}>{previousLabel}</p>
            )}
          </div>

          {/* Inputs */}
          <div className="flex flex-1 items-center gap-1 min-w-0">
            {showReps && (
              <input
                type="number"
                inputMode="numeric"
                placeholder="Reps"
                value={set.reps ?? ''}
                onChange={(e) =>
                  onUpdate(exerciseId, set.id, { reps: e.target.value ? parseInt(e.target.value, 10) : null })
                }
                className={inputClass}
              />
            )}

            {showWeight && (
              <input
                type="number"
                inputMode="decimal"
                placeholder={weightLabel}
                value={set.weightKg != null ? parseFloat(kgToDisplay(set.weightKg).toFixed(1)) : ''}
                onChange={(e) =>
                  onUpdate(exerciseId, set.id, { weightKg: e.target.value ? inputToKg(parseFloat(e.target.value)) : null })
                }
                className={inputClass}
              />
            )}

            {showDuration && (
              <DurationInput
                value={set.durationSeconds}
                onChange={(seconds) => onUpdate(exerciseId, set.id, { durationSeconds: seconds })}
              />
            )}

            {showDistance && (
              <input
                type="number"
                inputMode="decimal"
                placeholder="km"
                step="0.01"
                value={set.distanceMeters != null ? (set.distanceMeters / 1000).toFixed(2).replace(/\.?0+$/, '') : ''}
                onChange={(e) =>
                  onUpdate(exerciseId, set.id, { distanceMeters: e.target.value ? Math.round(parseFloat(e.target.value) * 1000) : null })
                }
                className={inputClass}
              />
            )}

            {showDistance && set.durationSeconds && set.distanceMeters && set.distanceMeters > 0 && (
              <span className="shrink-0 text-[9px] text-gray-400">
                {(() => {
                  const km = set.distanceMeters / 1000;
                  const paceSeconds = set.durationSeconds / km;
                  const m = Math.floor(paceSeconds / 60);
                  const s = Math.round(paceSeconds % 60);
                  return `${m}:${String(s).padStart(2, '0')}/km`;
                })()}
              </span>
            )}

            {showRounds && (
              <input
                type="number"
                inputMode="numeric"
                placeholder="Rnds"
                value={set.rounds ?? ''}
                onChange={(e) =>
                  onUpdate(exerciseId, set.id, { rounds: e.target.value ? parseInt(e.target.value, 10) : null })
                }
                className={inputClass}
              />
            )}

            {showCalories && (
              <input
                type="number"
                inputMode="numeric"
                placeholder="cal"
                value={set.calories ?? ''}
                onChange={(e) =>
                  onUpdate(exerciseId, set.id, { calories: e.target.value ? parseInt(e.target.value, 10) : null })
                }
                className={inputClass}
              />
            )}
          </div>

          {/* RPE pill */}
          {showRpe && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowRpePicker(!showRpePicker); }}
              className={`h-7 w-9 shrink-0 rounded-full text-[10px] font-medium transition-colors ${
                set.rpe !== null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
              aria-label={set.rpe !== null ? `RPE ${set.rpe}` : 'Set RPE'}
            >
              {set.rpe !== null ? `${set.rpe}` : 'RPE'}
            </button>
          )}

          {/* Complete button — active mode only */}
          {mode === 'active' && (
            <button
              type="button"
              onClick={() => { setShowRpePicker(false); set.completed ? onUncomplete?.(exerciseId, set.id) : onComplete?.(exerciseId, set.id); }}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                set.completed
                  ? 'bg-green-500 text-white'
                  : 'border border-gray-600 text-gray-500'
              }`}
              aria-label={set.completed ? 'Undo set completion' : 'Complete set'}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>

        {/* RPE picker — gradient slider */}
        {showRpePicker && (
          <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900 p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">RPE</span>
              <span className="text-sm font-bold text-white">{set.rpe ?? '—'}</span>
              {set.rpe !== null && (
                <button
                  type="button"
                  onClick={() => { onUpdate(exerciseId, set.id, { rpe: null }); setShowRpePicker(false); }}
                  className="text-[10px] text-red-400 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            {/* Gradient track */}
            <div className="relative h-8 rounded-full overflow-hidden"
              style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)' }}
            >
              <input
                type="range"
                min={6}
                max={10}
                step={0.5}
                value={set.rpe ?? 6}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate(exerciseId, set.id, { rpe: val });
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ WebkitAppearance: 'none' }}
              />
              {/* Thumb indicator */}
              <div
                className="absolute top-1 bottom-1 w-6 rounded-full bg-white shadow-lg border-2 border-gray-300 transition-all pointer-events-none"
                style={{ left: `calc(${((set.rpe ?? 6) - 6) / 4 * 100}% - 12px)` }}
              />
            </div>
            {/* Scale labels */}
            <div className="flex justify-between mt-1.5 px-1">
              <span className="text-[9px] text-green-400">Easy</span>
              <span className="text-[9px] text-yellow-400">Moderate</span>
              <span className="text-[9px] text-orange-400">Hard</span>
              <span className="text-[9px] text-red-400">Max</span>
            </div>
            {/* Tap to confirm */}
            <button
              type="button"
              onClick={() => setShowRpePicker(false)}
              className="mt-2 w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white active:bg-indigo-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ExerciseSection
// =============================================================================

export interface ExerciseSectionProps {
  exercise: ActiveWorkoutExercise;
  index: number;
  total: number;
  mode: 'active' | 'edit';
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete?: (exerciseId: string, setId: string) => void;
  onUncomplete?: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onRemove: (exerciseId: string) => void;
  onRestDurationChange?: (exerciseId: string, seconds: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ExerciseSection({ exercise, index, total, mode, onUpdate, onComplete, onUncomplete, onAddSet, onDeleteSet, onRemove, onRestDurationChange, onMoveUp, onMoveDown }: ExerciseSectionProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const { data: previousPerformance } = usePreviousPerformance(exercise.exerciseId);
  const { weightLabel, kgToDisplay, inputToKg } = useUnitPreference();

  const currentRest = exercise.restSeconds ?? 90;

  return (
    <div className="overflow-hidden glass-card rounded-2xl p-3">
      {/* Exercise header */}
      <div className="flex items-start justify-between">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 mr-2 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-20"
            aria-label="Move exercise up"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-20"
            aria-label="Move exercise down"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

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
            {/* Rest timer duration button — only in active mode */}
            {mode === 'active' && (
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
            )}
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

      {/* Rest duration picker (inline) — only in active mode */}
      {mode === 'active' && showRestPicker && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-gray-700 bg-gray-800 p-2">
          {REST_DURATION_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                onRestDurationChange?.(exercise.id, sec);
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
            mode={mode}
            weightLabel={weightLabel}
            kgToDisplay={kgToDisplay}
            inputToKg={inputToKg}
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
        <div
          className="mt-3 flex items-center gap-2 rounded-lg border border-red-800 p-3"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 90%, #7f1d1d)' }}
        >
          <p className="flex-1 text-xs text-red-300">Remove this exercise and all its sets?</p>
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(false)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
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
