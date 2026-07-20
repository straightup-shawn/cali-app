import { useFinishWorkout } from '@/hooks/useFinishWorkout';
import { PRCelebration } from '@/components/PRCelebration';

// =============================================================================
// Props
// =============================================================================

interface FinishWorkoutButtonProps {
  /** Called after the workout is saved and PR celebration is dismissed (or if no PRs). */
  onComplete?: () => void;
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Button that finishes the active workout.
 * Saves to Supabase, detects personal records, shows celebration if PRs found,
 * and clears localStorage.
 */
export function FinishWorkoutButton({ onComplete, disabled }: FinishWorkoutButtonProps) {
  const {
    finishWorkout,
    dismissPRCelebration,
    isFinishing,
    error,
    newPRs,
    showPRCelebration,
  } = useFinishWorkout();

  const handleFinish = async () => {
    await finishWorkout();
    // If no PRs, immediately notify completion
    // (if PRs exist, completion happens after celebration dismiss)
  };

  const handleDismissCelebration = () => {
    dismissPRCelebration();
    onComplete?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleFinish}
        disabled={disabled || isFinishing}
        className="w-full rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-500 active:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
      >
        {isFinishing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </span>
        ) : (
          'Finish Workout'
        )}
      </button>

      {/* Error display */}
      {error && (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* PR Celebration overlay */}
      {showPRCelebration && (
        <PRCelebration
          newPRs={newPRs}
          onClose={handleDismissCelebration}
        />
      )}
    </>
  );
}
