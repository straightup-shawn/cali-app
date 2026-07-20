import { useState, useCallback } from 'react';
import type { ActiveSet, ExerciseType } from '@/types';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import ExerciseDurationTimer from '@/components/workout/ExerciseDurationTimer';

// =============================================================================
// Types
// =============================================================================

interface SetRowProps {
  exerciseId: string;
  exerciseType: ExerciseType;
  set: ActiveSet;
  onUpdateSet: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void;
  onCompleteSet: (exerciseId: string, setId: string) => void;
  onUncompleteSet: (exerciseId: string, setId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** Parse a mm:ss string into total seconds, or null if invalid. */
function parseDuration(value: string): number | null {
  const match = value.match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  return minutes * 60 + seconds;
}

/** Format total seconds into mm:ss string. */
function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) return '';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// =============================================================================
// Sub-components
// =============================================================================

function RepsInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (reps: number | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-xs text-gray-400">Reps</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : parseInt(v, 10) || null);
        }}
        disabled={disabled}
        placeholder="—"
        className="h-11 w-16 rounded-lg border border-gray-700 bg-gray-800 text-center text-lg font-medium text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-800/50 disabled:text-gray-500"
        aria-label="Reps"
      />
    </div>
  );
}

function WeightInput({
  value,
  onChange,
  disabled,
  label,
  unitLabel,
}: {
  value: number | null;
  onChange: (weight: number | null) => void;
  disabled: boolean;
  label: string;
  unitLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-xs text-gray-400">
        {label} ({unitLabel})
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : parseFloat(v) || null);
        }}
        disabled={disabled}
        placeholder="—"
        className="h-11 w-20 rounded-lg border border-gray-700 bg-gray-800 text-center text-lg font-medium text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-800/50 disabled:text-gray-500"
        aria-label={label}
      />
    </div>
  );
}

function DurationInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (seconds: number | null) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState(formatDuration(value));

  const handleBlur = () => {
    const seconds = parseDuration(text);
    if (seconds !== null) {
      onChange(seconds);
    } else if (text === '') {
      onChange(null);
    } else {
      // Reset to last valid value on invalid input
      setText(formatDuration(value));
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-xs text-gray-400">Duration</label>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="0:00"
        className="h-11 w-20 rounded-lg border border-gray-700 bg-gray-800 text-center text-lg font-medium text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-800/50 disabled:text-gray-500"
        aria-label="Duration (mm:ss)"
      />
    </div>
  );
}

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;
const RIR_VALUES = [5, 4, 3, 2, 1, 0] as const;

function RPERIRSelector({
  rpe,
  rir,
  onRpeChange,
  onRirChange,
  disabled,
}: {
  rpe: number | null;
  rir: number | null;
  onRpeChange: (rpe: number | null) => void;
  onRirChange: (rir: number | null) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="flex min-h-[44px] items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 active:bg-gray-700 disabled:opacity-50"
        aria-expanded={expanded}
        aria-label="Toggle RPE/RIR selector"
      >
        <svg
          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {rpe !== null || rir !== null
            ? `RPE ${rpe ?? '—'} / RIR ${rir ?? '—'}`
            : 'RPE / RIR'}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
          {/* RPE */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">RPE</span>
              {rpe !== null && (
                <button
                  type="button"
                  onClick={() => onRpeChange(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RPE_VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onRpeChange(v)}
                  disabled={disabled}
                  className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-medium transition-colors ${
                    rpe === v
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* RIR */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">RIR</span>
              {rir !== null && (
                <button
                  type="button"
                  onClick={() => onRirChange(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RIR_VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onRirChange(v)}
                  disabled={disabled}
                  className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-medium transition-colors ${
                    rir === v
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SetRow Component
// =============================================================================

export default function SetRow({
  exerciseId,
  exerciseType,
  set,
  onUpdateSet,
  onCompleteSet,
  onUncompleteSet,
  onDeleteSet,
}: SetRowProps) {
  const { weightLabel, kgToDisplay, inputToKg } = useUnitPreference();

  // Derive display weight from stored kg
  const displayWeightValue =
    set.weightKg !== null ? kgToDisplay(set.weightKg) : null;

  const handleRepsChange = useCallback(
    (reps: number | null) => {
      onUpdateSet(exerciseId, set.id, { reps });
    },
    [exerciseId, set.id, onUpdateSet],
  );

  const handleWeightChange = useCallback(
    (displayValue: number | null) => {
      const weightKg = displayValue !== null ? inputToKg(displayValue) : null;
      onUpdateSet(exerciseId, set.id, { weightKg });
    },
    [exerciseId, set.id, onUpdateSet, inputToKg],
  );

  const handleDurationChange = useCallback(
    (durationSeconds: number | null) => {
      onUpdateSet(exerciseId, set.id, { durationSeconds });
    },
    [exerciseId, set.id, onUpdateSet],
  );

  const handleRpeChange = useCallback(
    (rpe: number | null) => {
      onUpdateSet(exerciseId, set.id, { rpe });
    },
    [exerciseId, set.id, onUpdateSet],
  );

  const handleRirChange = useCallback(
    (rir: number | null) => {
      onUpdateSet(exerciseId, set.id, { rir });
    },
    [exerciseId, set.id, onUpdateSet],
  );

  const handleComplete = useCallback(() => {
    if (set.completed) {
      onUncompleteSet(exerciseId, set.id);
    } else {
      onCompleteSet(exerciseId, set.id);
    }
  }, [exerciseId, set.id, set.completed, onCompleteSet, onUncompleteSet]);

  const handleDelete = useCallback(() => {
    onDeleteSet(exerciseId, set.id);
  }, [exerciseId, set.id, onDeleteSet]);

  // Render inputs based on exercise type
  const renderInputs = () => {
    switch (exerciseType) {
      case 'bodyweight':
        return <RepsInput value={set.reps} onChange={handleRepsChange} disabled={false} />;

      case 'weighted':
        return (
          <div className="flex items-end gap-3">
            <RepsInput value={set.reps} onChange={handleRepsChange} disabled={false} />
            <WeightInput
              value={displayWeightValue}
              onChange={handleWeightChange}
              disabled={false}
              label="Weight"
              unitLabel={weightLabel}
            />
          </div>
        );

      case 'assisted':
        return (
          <div className="flex items-end gap-3">
            <RepsInput value={set.reps} onChange={handleRepsChange} disabled={false} />
            <WeightInput
              value={displayWeightValue}
              onChange={handleWeightChange}
              disabled={false}
              label="Assist"
              unitLabel={weightLabel}
            />
          </div>
        );

      case 'duration':
      case 'static_hold':
        return (
          <div className="flex items-end gap-3">
            <DurationInput
              value={set.durationSeconds}
              onChange={handleDurationChange}
              disabled={false}
            />
            {!set.completed && (
              <ExerciseDurationTimer
                exerciseType={exerciseType as 'duration' | 'static_hold'}
                targetDurationSeconds={set.durationSeconds}
                onDurationCapture={handleDurationChange}
                disabled={false}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-lg px-3 py-2 ${set.completed ? 'bg-green-950/50' : 'bg-gray-800'}`}
    >
      <div className="flex items-center gap-3">
        {/* Delete set button */}
        <button
          type="button"
          onClick={handleDelete}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-950 hover:text-red-400 active:bg-red-900"
          aria-label={`Delete set ${set.setNumber}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Set number */}
        <span className="w-7 shrink-0 text-center text-sm font-medium text-gray-500">
          {set.setNumber}
        </span>

        {/* Type-specific inputs */}
        <div className="flex-1">{renderInputs()}</div>

        {/* Complete/uncomplete set button */}
        <button
          type="button"
          onClick={handleComplete}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            set.completed
              ? 'border-green-600 bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
              : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400 active:bg-green-950'
          }`}
          aria-label={set.completed ? 'Undo set completion' : 'Complete set'}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* Optional RPE/RIR selector (expandable) */}
      <div className="ml-7">
        <RPERIRSelector
          rpe={set.rpe}
          rir={set.rir}
          onRpeChange={handleRpeChange}
          onRirChange={handleRirChange}
          disabled={false}
        />
      </div>
    </div>
  );
}

// Export RPE/RIR selector separately for composability
export { RPERIRSelector };
