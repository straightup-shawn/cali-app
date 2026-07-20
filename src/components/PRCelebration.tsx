import type { PRCheck } from '@/lib/personal-records';
import type { RecordType } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface PRCelebrationProps {
  newPRs: PRCheck[];
  onClose: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function recordTypeLabel(type: RecordType): string {
  switch (type) {
    case 'max_reps':
      return 'Max Reps';
    case 'max_weight':
      return 'Max Weight';
    case 'max_volume':
      return 'Max Volume';
    case 'longest_hold':
      return 'Longest Hold';
  }
}

function recordTypeIcon(type: RecordType): string {
  switch (type) {
    case 'max_reps':
      return '💪';
    case 'max_weight':
      return '🏋️';
    case 'max_volume':
      return '📈';
    case 'longest_hold':
      return '⏱️';
  }
}

function formatValue(type: RecordType, value: number): string {
  switch (type) {
    case 'max_reps':
      return `${value} reps`;
    case 'max_weight':
      return `${value} kg`;
    case 'max_volume':
      return `${value} kg·reps`;
    case 'longest_hold':
      return `${value}s`;
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * Celebration modal shown after a workout when new personal records are achieved.
 * Displays each new PR with the exercise name, record type, and value.
 */
export function PRCelebration({ newPRs, onClose }: PRCelebrationProps) {
  if (newPRs.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pr-celebration-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-xl animate-in fade-in zoom-in">
        {/* Trophy header */}
        <div className="mb-4 text-center">
          <div className="text-5xl mb-2">🏆</div>
          <h2
            id="pr-celebration-title"
            className="text-xl font-bold text-white"
          >
            New Personal {newPRs.length === 1 ? 'Record' : 'Records'}!
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            You crushed it this workout
          </p>
        </div>

        {/* PR list */}
        <ul className="mb-6 space-y-3">
          {newPRs.map((pr) => (
            <li
              key={`${pr.exerciseId}-${pr.recordType}`}
              className="flex items-center gap-3 rounded-lg bg-amber-950/50 p-3 border border-amber-700"
            >
              <span className="text-2xl" aria-hidden="true">
                {recordTypeIcon(pr.recordType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-100 truncate">
                  {pr.exerciseName}
                </p>
                <p className="text-sm text-gray-300">
                  {recordTypeLabel(pr.recordType)}:{' '}
                  <span className="font-semibold text-amber-400">
                    {formatValue(pr.recordType, pr.newValue)}
                  </span>
                  {pr.previousValue != null && (
                    <span className="text-gray-500 ml-1">
                      (was {formatValue(pr.recordType, pr.previousValue)})
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white active:bg-amber-600 transition-colors"
          type="button"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
