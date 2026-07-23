import { useState } from 'react';
import { usePreviousPerformance, formatPreviousSet } from '@/hooks/usePreviousPerformance';
import type { ActiveWorkoutExercise, ActiveSet, ExerciseType } from '@/types';
import type { PreviousSet } from '@/hooks/usePreviousPerformance';

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
};

export const TYPE_COLORS: Record<ExerciseType, string> = {
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
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
  onUpdate: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onComplete?: (exerciseId: string, setId: string) => void;
  onUncomplete?: (exerciseId: string, setId: string) => void;
  onDelete: (exerciseId: string, setId: string) => void;
}

function SetRow({ set, exerciseType, exerciseId, previousSet, mode, onUpdate, onComplete, onUncomplete, onDelete }: SetRowProps) {
  const [showRpePicker, setShowRpePicker] = useState(false);
  const showReps = ['bodyweight', 'weighted', 'assisted'].includes(exerciseType);
  const showWeight = ['weighted', 'assisted'].includes(exerciseType);
  const showDuration = ['duration', 'static_hold'].includes(exerciseType);
  const showRpe = true; // RPE is available for all exercise types

  const previousLabel = formatPreviousSet(previousSet, exerciseType);

  // In edit mode, always show completed styling
  const isCompleted = mode === 'edit' ? true : set.completed;

  return (
    <div
      className={`overflow-hidden rounded-xl border px-2 py-2 ${
        isCompleted
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

        {/* Complete/uncomplete button — only in active mode */}
        {mode === 'active' && (
          <button
            type="button"
            onClick={() => set.completed ? onUncomplete?.(exerciseId, set.id) : onComplete?.(exerciseId, set.id)}
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
        )}

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
