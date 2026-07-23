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
 * RestTimerOverlay displays a non-blocking floating countdown bar at the top of the
 * workout page. The user can continue scrolling and logging sets while it runs.
 *
 * - Collapsed (default): thin bar with countdown + Skip button + progress line
 * - Expanded (tap to toggle): reveals +15s / -15s adjustment buttons
 * - Auto-dismisses 2 seconds after completion (with beep + vibration)
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
  const [expanded, setExpanded] = useState(false);

  const handleComplete = useCallback(() => {
    setCompleted(true);
    // Play audio alert
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
      setExpanded(false);
      setTotalDuration(defaultSeconds);
      reset(defaultSeconds);
      // Small delay to allow reset to settle before starting
      const id = setTimeout(() => start(), 50);
      return () => clearTimeout(id);
    }
  }, [visible, defaultSeconds, reset, start]);

  // Auto-dismiss 2 seconds after completion
  useEffect(() => {
    if (completed && visible) {
      const id = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [completed, visible, onClose]);

  const handleAdjust = (delta: number) => {
    adjustTime(delta);
    setTotalDuration((prev) => Math.max(1, prev + delta));
  };

  const handleSkip = () => {
    reset(0);
    onClose();
  };

  const toggleExpanded = () => {
    if (!completed) {
      setExpanded((prev) => !prev);
    }
  };

  if (!visible) return null;

  // Progress fraction (1 = full, 0 = done)
  const progress = totalDuration > 0 ? seconds / totalDuration : 0;

  return (
    <>
      {/* Collapse when tapping outside (only when expanded) */}
      {expanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating timer bar */}
      <div
        className={`fixed left-4 right-4 z-50 transition-all duration-300 ease-out ${
          completed
            ? 'glass-card rounded-2xl shadow-2xl ring-2 ring-green-400/50'
            : 'glass-card rounded-2xl shadow-2xl'
        }`}
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 100px)' }}
        role="timer"
        aria-label="Rest timer"
        aria-live="polite"
      >
        {/* Main bar content - always visible */}
        <div
          className="flex items-center gap-3 px-4 cursor-pointer select-none"
          style={{ height: '48px' }}
          onClick={toggleExpanded}
        >
          {/* Timer icon */}
          <div className={`flex-shrink-0 ${completed ? 'text-green-400' : 'text-indigo-400'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Countdown display */}
          <span
            className={`text-lg font-bold tabular-nums font-mono ${
              completed ? 'text-green-400 animate-pulse' : 'text-white'
            }`}
          >
            {completed ? 'Rest Complete!' : formatTime(seconds)}
          </span>

          {/* Status text */}
          {!completed && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {isRunning ? 'Resting...' : 'Paused'}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Expand indicator (chevron) */}
          {!completed && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}

          {/* Skip button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="flex-shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 active:bg-white/30"
          >
            {completed ? 'Dismiss' : 'Skip'}
          </button>
        </div>

        {/* Expanded section - adjustment buttons */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${
            expanded && !completed ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-3 px-4 pb-3">
            <button
              type="button"
              onClick={() => handleAdjust(-15)}
              className="flex h-8 items-center justify-center rounded-full bg-gray-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-600 active:bg-gray-500"
              aria-label="Subtract 15 seconds"
            >
              −15s
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(15)}
              className="flex h-8 items-center justify-center rounded-full bg-gray-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-600 active:bg-gray-500"
              aria-label="Add 15 seconds"
            >
              +15s
            </button>
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="h-1 w-full overflow-hidden rounded-b-2xl bg-gray-700/50">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              completed ? 'bg-green-400' : 'bg-indigo-400'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
