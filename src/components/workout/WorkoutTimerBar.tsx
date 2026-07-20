import { useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';

/**
 * Formats seconds into a time display string.
 * Returns MM:SS if under 1 hour, HH:MM:SS otherwise.
 */
export function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

/**
 * WorkoutTimerBar displays elapsed workout time in the active workout header.
 * It auto-starts on mount and pauses/resumes with the workout state.
 */
export function WorkoutTimerBar() {
  const { workout } = useActiveWorkout();
  const { seconds, isRunning, start, pause } = useTimer({
    mode: 'countup',
    initialSeconds: workout?.elapsedSeconds ?? 0,
  });

  const isPaused = workout?.isPaused ?? false;
  const workoutName = workout?.name ?? 'Workout';

  // Auto-start timer on mount when workout is not paused
  useEffect(() => {
    if (!isPaused && !isRunning) {
      start();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync pause/resume with workout state
  useEffect(() => {
    if (isPaused && isRunning) {
      pause();
    } else if (!isPaused && !isRunning) {
      start();
    }
  }, [isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold truncate">{workoutName}</h2>
        {isPaused && (
          <span className="shrink-0 rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs font-medium text-yellow-400">
            Paused
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`font-mono text-base tabular-nums ${isPaused ? 'text-yellow-400' : 'text-emerald-400'}`}
          aria-label={`Elapsed time: ${formatElapsedTime(seconds)}`}
        >
          {formatElapsedTime(seconds)}
        </span>
      </div>
    </div>
  );
}
