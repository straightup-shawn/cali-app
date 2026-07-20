import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';

/**
 * ResumeWorkoutPrompt
 *
 * Shown when the app loads and detects a persisted active workout in localStorage.
 * Gives the user the choice to resume or discard the in-progress workout.
 *
 * Requirements: 10.2
 */
export function ResumeWorkoutPrompt() {
  const { workout, discardWorkout } = useActiveWorkout();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Only show if there's a persisted workout and we're NOT already on the active workout page
  const isOnActiveWorkoutPage = location.pathname === '/workout/active';
  const shouldShow = workout !== null && !dismissed && !isOnActiveWorkoutPage;

  // Auto-dismiss if no workout (e.g., it was finished or discarded elsewhere)
  useEffect(() => {
    if (!workout) {
      setDismissed(false); // Reset for future sessions
    }
  }, [workout]);

  if (!shouldShow) return null;

  function handleResume() {
    setDismissed(true);
    navigate('/workout/active');
  }

  function handleDiscard() {
    discardWorkout();
    setDismissed(true);
  }

  // Format the start time for display
  const startedAt = workout ? new Date(workout.startedAt) : null;
  const formattedTime = startedAt
    ? startedAt.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const exerciseCount = workout?.exercises.length ?? 0;
  const completedSets = workout?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  ) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-workout-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id="resume-workout-title"
          className="text-lg font-semibold text-gray-900"
        >
          Resume Workout?
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          You have an unfinished workout from{' '}
          <span className="font-medium">{formattedTime}</span>.
        </p>

        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-800">
            {workout?.name ?? 'Workout'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} &middot;{' '}
            {completedSets} set{completedSets !== 1 ? 's' : ''} completed
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-100 transition-colors"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleResume}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white active:bg-indigo-700 transition-colors"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
