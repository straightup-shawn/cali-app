import { useCallback, useEffect, useRef } from 'react';
import { useTimer } from '@/hooks/useTimer';
import type { ExerciseType } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface ExerciseDurationTimerProps {
  /** The exercise type — determines timer behavior (countup for static_hold, configurable for duration) */
  exerciseType: Extract<ExerciseType, 'duration' | 'static_hold'>;
  /** Target duration in seconds (used as countdown start for duration exercises) */
  targetDurationSeconds?: number | null;
  /** Callback fired when the timer stops, providing the elapsed/remaining seconds */
  onDurationCapture: (seconds: number) => void;
  /** Whether the set is already completed (disables controls) */
  disabled?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

/** Format total seconds into MM:SS display string. */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// =============================================================================
// ExerciseDurationTimer Component
// =============================================================================

/**
 * Inline timer for duration and static_hold exercises.
 *
 * - static_hold: always counts UP from 0 (measuring hold time).
 * - duration: counts DOWN from targetDurationSeconds if provided, otherwise counts UP from 0.
 *
 * When the timer is stopped (paused or countdown completes), the final value is
 * passed to onDurationCapture so the parent SetRow can store it as durationSeconds.
 */
export default function ExerciseDurationTimer({
  exerciseType,
  targetDurationSeconds,
  onDurationCapture,
  disabled = false,
}: ExerciseDurationTimerProps) {
  // Determine timer mode
  const useCountdown =
    exerciseType === 'duration' &&
    targetDurationSeconds !== null &&
    targetDurationSeconds !== undefined &&
    targetDurationSeconds > 0;

  const mode = useCountdown ? 'countdown' : 'countup';
  const initialSeconds = useCountdown ? targetDurationSeconds! : 0;

  // Track whether we've already captured the duration on complete
  const capturedOnCompleteRef = useRef(false);

  const handleCountdownComplete = useCallback(() => {
    // Countdown reached 0 — capture the full target duration as the elapsed time
    capturedOnCompleteRef.current = true;
    onDurationCapture(initialSeconds);
  }, [initialSeconds, onDurationCapture]);

  const timer = useTimer({
    mode,
    initialSeconds,
    onComplete: useCountdown ? handleCountdownComplete : undefined,
  });

  // Reset the captured flag when timer resets
  useEffect(() => {
    if (!timer.isRunning && timer.seconds === initialSeconds) {
      capturedOnCompleteRef.current = false;
    }
  }, [timer.isRunning, timer.seconds, initialSeconds]);

  const handleStartStop = useCallback(() => {
    if (timer.isRunning) {
      timer.pause();
      // Capture duration on stop
      if (mode === 'countup') {
        // For countup, the current seconds IS the elapsed duration
        onDurationCapture(timer.seconds);
      } else {
        // For countdown, elapsed = initial - remaining
        const elapsed = initialSeconds - timer.seconds;
        onDurationCapture(elapsed > 0 ? elapsed : initialSeconds);
      }
    } else {
      capturedOnCompleteRef.current = false;
      timer.start();
    }
  }, [timer, mode, initialSeconds, onDurationCapture]);

  const handleReset = useCallback(() => {
    timer.reset();
    capturedOnCompleteRef.current = false;
  }, [timer]);

  return (
    <div className="flex items-center gap-2">
      {/* Time display */}
      <span
        className={`min-w-[52px] text-center font-mono text-lg font-semibold tabular-nums ${
          timer.isRunning ? 'text-indigo-400' : 'text-gray-300'
        }`}
        aria-live="polite"
        aria-label={`Timer: ${formatTime(timer.seconds)}`}
      >
        {formatTime(timer.seconds)}
      </span>

      {/* Start / Stop button */}
      <button
        type="button"
        onClick={handleStartStop}
        disabled={disabled}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          timer.isRunning
            ? 'bg-red-900/50 text-red-400 hover:bg-red-900 active:bg-red-800'
            : 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900 active:bg-indigo-800'
        } disabled:opacity-40 disabled:pointer-events-none`}
        aria-label={timer.isRunning ? 'Stop timer' : 'Start timer'}
      >
        {timer.isRunning ? (
          // Stop icon (square)
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Play icon (triangle)
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Reset button — shown only when timer has been used (seconds > 0 or not at initial) */}
      {(timer.seconds !== initialSeconds || (!timer.isRunning && timer.seconds > 0)) && (
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled || timer.isRunning}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-gray-400 transition-colors hover:bg-gray-600 active:bg-gray-500 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Reset timer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
