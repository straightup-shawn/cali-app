import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';

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
 * ActiveWorkoutBar — a small floating pill that hovers above the nav bar
 * when a workout is in progress. Shows workout name + elapsed time.
 * Tapping it navigates back to the active workout.
 */
export default function ActiveWorkoutBar() {
  const { workout } = useActiveWorkout();
  const location = useLocation();
  const navigate = useNavigate();

  // Live elapsed timer derived from startedAt (survives navigations)
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!workout || workout.isPaused) return;
    const startTime = new Date(workout.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workout?.startedAt, workout?.isPaused]);

  // Don't render if no workout is active
  if (!workout) return null;

  // Don't render on the active workout page (user is already there)
  if (location.pathname === '/workout/active') return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/workout/active')}
      className="fixed left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-full border border-indigo-500/30 bg-gray-900/95 px-5 py-2 shadow-lg shadow-indigo-500/10 backdrop-blur-xl transition-all duration-200 active:scale-95 md:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
      aria-label="Resume active workout"
    >
      {/* Pulsing dot to indicate active */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>

      {/* Workout name */}
      <span className="max-w-[140px] truncate text-sm font-medium text-white">
        {workout.name}
      </span>

      {/* Separator dot */}
      <span className="h-1 w-1 shrink-0 rounded-full bg-gray-600" />

      {/* Elapsed time */}
      <span className="font-mono text-sm font-semibold tabular-nums text-indigo-400">
        {formatTime(elapsed)}
      </span>

      {/* Chevron */}
      <svg
        className="h-4 w-4 shrink-0 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
