import { useEffect, useRef } from 'react';
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
 * - Tap the time to pause/resume
 * - Tap the clock icon to open native time picker to set elapsed time manually
 */
export function WorkoutTimerBar() {
  const { workout, pauseWorkout, resumeWorkout } = useActiveWorkout();
  const { seconds, isRunning, start, pause, reset } = useTimer({
    mode: 'countup',
    initialSeconds: workout?.elapsedSeconds ?? 0,
  });

  const timeInputRef = useRef<HTMLInputElement>(null);

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

  // Toggle pause on tap
  const handleTimeTap = () => {
    if (isPaused) {
      resumeWorkout();
    } else {
      pauseWorkout();
    }
  };

  // Open native time picker
  const handleClockTap = () => {
    // Small delay to let state update before focusing
    setTimeout(() => timeInputRef.current?.showPicker?.(), 50);
  };

  // Handle time picker change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parts = e.target.value.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const s = parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;
      const total = h * 3600 + m * 60 + s;
      reset(total);
      // If was running, restart
      if (!isPaused) {
        setTimeout(() => start(), 10);
      }
    }
  };

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
      <div className="flex items-center gap-2 shrink-0">
        {/* Clock icon — tap to set time manually */}
        <button
          type="button"
          onClick={handleClockTap}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-700"
          aria-label="Set workout time"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Timer display — tap to pause/resume */}
        <button
          type="button"
          onClick={handleTimeTap}
          className={`font-mono text-base tabular-nums rounded-md px-2 py-0.5 active:bg-gray-700/50 ${
            isPaused ? 'text-yellow-400' : 'text-emerald-400'
          }`}
          aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
        >
          {formatElapsedTime(seconds)}
        </button>

        {/* Hidden native time input for iOS picker */}
        <input
          ref={timeInputRef}
          type="time"
          step="1"
          value={(() => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          })()}
          onChange={handleTimeChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
