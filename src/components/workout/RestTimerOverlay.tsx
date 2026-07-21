import { useEffect, useCallback, useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { sendTimerNotification } from '@/lib/notifications';
import { playTimerAlert } from '@/lib/audio-alert';

interface RestTimerOverlayProps {
  /** Default countdown duration in seconds (from profile or exercise override) */
  defaultSeconds: number;
  /** Callback when overlay is dismissed or timer completes and user closes */
  onClose: () => void;
  /** Whether the overlay is visible */
  visible: boolean;
}

/**
 * Format seconds into MM:SS display string.
 */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * RestTimerOverlay displays a countdown rest timer with circular progress,
 * adjustment buttons, and completion notifications (vibration + visual flash).
 *
 * Validates: Requirements 6.3, 6.4, 6.5, 6.6
 */
export default function RestTimerOverlay({
  defaultSeconds,
  onClose,
  visible,
}: RestTimerOverlayProps) {
  const [completed, setCompleted] = useState(false);
  const [totalDuration, setTotalDuration] = useState(defaultSeconds);

  const handleComplete = useCallback(() => {
    setCompleted(true);
    // Play audio alert (works on iOS even when foregrounded after background)
    playTimerAlert();
    // Vibrate if the API is available (mobile devices)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    // Send browser notification (works on Android when backgrounded)
    sendTimerNotification('Rest Complete', 'Time to start your next set!');
  }, []);

  const { seconds, isRunning, start, reset, adjustTime } = useTimer({
    mode: 'countdown',
    initialSeconds: defaultSeconds,
    onComplete: handleComplete,
  });

  // Auto-start timer when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setCompleted(false);
      setTotalDuration(defaultSeconds);
      reset(defaultSeconds);
      // Small delay to allow reset to settle before starting
      const id = setTimeout(() => start(), 50);
      return () => clearTimeout(id);
    }
  }, [visible, defaultSeconds, reset, start]);

  const handleAdjust = (delta: number) => {
    adjustTime(delta);
    setTotalDuration((prev) => Math.max(1, prev + delta));
  };

  const handleSkip = () => {
    reset(0);
    onClose();
  };

  if (!visible) return null;

  // Calculate progress (0 to 1, where 1 = full circle remaining)
  const progress = totalDuration > 0 ? seconds / totalDuration : 0;

  // SVG circular progress
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-label="Rest timer"
      aria-modal="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 glass-card rounded-2xl p-8 shadow-2xl animate-slide-up">
        {/* Circular progress with countdown */}
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            aria-hidden="true"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-700"
            />
            {/* Progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-linear ${
                completed ? 'text-green-400' : 'text-blue-400'
              }`}
            />
          </svg>

          {/* Countdown display centered over SVG */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-5xl font-bold tabular-nums ${
                completed ? 'animate-pulse text-green-400' : 'text-white'
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {formatTime(seconds)}
            </span>
            <span className="mt-1 text-sm text-gray-400">
              {completed ? 'Rest complete!' : isRunning ? 'Resting...' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Adjustment buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleAdjust(-15)}
            disabled={completed}
            className="flex h-12 w-20 items-center justify-center rounded-lg bg-gray-700 text-lg font-semibold text-white transition-colors hover:bg-gray-600 active:bg-gray-500 disabled:opacity-40"
            aria-label="Subtract 15 seconds"
          >
            −15s
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(15)}
            disabled={completed}
            className="flex h-12 w-20 items-center justify-center rounded-lg bg-gray-700 text-lg font-semibold text-white transition-colors hover:bg-gray-600 active:bg-gray-500 disabled:opacity-40"
            aria-label="Add 15 seconds"
          >
            +15s
          </button>
        </div>

        {/* Skip / Dismiss button */}
        <button
          type="button"
          onClick={handleSkip}
          className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          {completed ? 'Dismiss' : 'Skip Rest'}
        </button>
      </div>
    </div>
  );
}
