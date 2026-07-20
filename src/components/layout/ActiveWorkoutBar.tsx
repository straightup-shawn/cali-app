import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useTimer } from '@/hooks/useTimer';

/**
 * Formats seconds into MM:SS (or HH:MM:SS if over an hour).
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Finds the current exercise — the first exercise that has at least one incomplete set.
 */
function getCurrentExerciseName(
  exercises: { exerciseName: string; sets: { completed: boolean }[] }[],
): string | null {
  for (const exercise of exercises) {
    const hasIncomplete = exercise.sets.some((s) => !s.completed);
    if (hasIncomplete) {
      return exercise.exerciseName;
    }
  }
  return null;
}

/**
 * ActiveWorkoutBar — a persistent mini-player style bar that appears above the
 * bottom navigation whenever a workout is in progress.
 *
 * Shows: workout name, elapsed time, current exercise, and a resume button.
 * Hidden on /workout/active (user is already there) and when no workout is active.
 */
export default function ActiveWorkoutBar() {
  const { workout } = useActiveWorkout();
  const location = useLocation();
  const navigate = useNavigate();

  const isPaused = workout?.isPaused ?? false;

  const { seconds, isRunning, start, pause } = useTimer({
    mode: 'countup',
    initialSeconds: workout?.elapsedSeconds ?? 0,
  });

  // Auto-start timer when component mounts and workout is not paused
  useEffect(() => {
    if (workout && !isPaused && !isRunning) {
      start();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync pause/resume with workout state
  useEffect(() => {
    if (isPaused && isRunning) {
      pause();
    } else if (!isPaused && !isRunning && workout) {
      start();
    }
  }, [isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render if no workout is active
  if (!workout) return null;

  // Don't render on the active workout page (user is already there)
  if (location.pathname === '/workout/active') return null;

  const currentExercise = getCurrentExerciseName(workout.exercises);

  return (
    <button
      type="button"
      onClick={() => navigate('/workout/active')}
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-900 px-4 py-3 shadow-lg shadow-black/20 transition-transform active:scale-[0.99] md:hidden"
      aria-label="Resume active workout"
    >
      {/* Left section: workout info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">
            {workout.name}
          </span>
          {isPaused && (
            <span className="shrink-0 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
              Paused
            </span>
          )}
        </div>
        {currentExercise && (
          <span className="truncate text-xs text-indigo-200/80">
            {currentExercise}
          </span>
        )}
      </div>

      {/* Center: elapsed time */}
      <div className="shrink-0">
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${
            isPaused ? 'text-yellow-400' : 'text-emerald-400'
          }`}
        >
          {formatTime(seconds)}
        </span>
      </div>

      {/* Right: resume chevron */}
      <div className="shrink-0 text-white/70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </button>
  );
}
