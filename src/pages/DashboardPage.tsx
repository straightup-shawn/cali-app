import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useWorkouts, type WorkoutSummary } from '@/hooks/useWorkouts';
import { useRoutines, type RoutineWithCount } from '@/hooks/useRoutines';

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

// =============================================================================
// StartRoutineButton — fetches full routine then starts workout
// =============================================================================

function StartRoutineButton({ routine }: { routine: RoutineWithCount }) {
  const { startWorkout } = useActiveWorkout();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: fullRoutine } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises(
            *,
            exercises(id, name, exercise_type, muscle_groups)
          )
        `)
        .eq('id', routine.id)
        .single();

      startWorkout(fullRoutine ? (fullRoutine as any) : undefined);
    } catch {
      startWorkout();
    } finally {
      setStarting(false);
      navigate('/workout/active');
    }
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={starting}
      className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-200 active:bg-gray-700 disabled:opacity-50"
    >
      {starting ? '...' : routine.name}
    </button>
  );
}

// =============================================================================
// QuickStartCard
// =============================================================================

function QuickStartCard({ routines }: { routines: RoutineWithCount[] }) {
  const { startWorkout } = useActiveWorkout();
  const navigate = useNavigate();

  function handleStartEmpty() {
    startWorkout();
    navigate('/workout/active');
  }

  return (
    <section className="glass-card rounded-2xl p-4 shadow-lg shadow-black/20">
      <h2 className="text-sm font-semibold text-gray-100">Quick Start</h2>

      <button
        type="button"
        onClick={handleStartEmpty}
        className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/40 active:bg-indigo-700"
      >
        Start Empty Workout
      </button>

      {routines.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-400">From routine</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {routines.slice(0, 3).map((routine) => (
              <StartRoutineButton key={routine.id} routine={routine} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// =============================================================================
// RecentWorkouts
// =============================================================================

function RecentWorkouts({ workouts }: { workouts: WorkoutSummary[] }) {
  if (workouts.length === 0) return null;

  return (
    <section className="glass-card rounded-2xl p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">Recent Workouts</h2>
        <Link to="/history" className="text-xs font-medium text-indigo-400">
          See all
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {workouts.map((workout) => {
          const dateStr = workout.completed_at ?? workout.started_at;
          return (
            <Link
              key={workout.id}
              to={`/history/${workout.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-3 active:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-100">
                  {workout.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDate(dateStr)} · {formatDuration(workout.duration_seconds)}
                </p>
              </div>
              <svg
                className="ml-2 h-4 w-4 shrink-0 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// WeeklyStats
// =============================================================================

function WeeklyStats({ workouts }: { workouts: WorkoutSummary[] }) {
  const weekStart = useMemo(() => getStartOfWeek(), []);

  const workoutsThisWeek = useMemo(() => {
    return workouts.filter((w) => {
      if (!w.completed_at) return false;
      return new Date(w.completed_at) >= weekStart;
    }).length;
  }, [workouts, weekStart]);

  return (
    <section className="glass-card rounded-2xl p-4 shadow-lg shadow-black/20">
      <h2 className="text-sm font-semibold text-gray-100">This Week</h2>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-indigo-400">
          {workoutsThisWeek}
        </span>
        <span className="text-sm text-gray-400">
          workout{workoutsThisWeek !== 1 ? 's' : ''} completed
        </span>
      </div>
    </section>
  );
}

// =============================================================================
// Welcome State
// =============================================================================

function WelcomeCard() {
  const navigate = useNavigate();
  const { startWorkout } = useActiveWorkout();

  function handleStart() {
    startWorkout();
    navigate('/workout/active');
  }

  return (
    <section className="glass-card rounded-2xl border-indigo-800 p-5 text-center">
      <h2 className="text-lg font-bold text-indigo-100">Welcome!</h2>
      <p className="mt-2 text-sm text-indigo-300">
        You're all set. Start your first workout to begin tracking your progress.
      </p>
      <button
        type="button"
        onClick={handleStart}
        className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/40 active:bg-indigo-700"
      >
        Start Your First Workout
      </button>
    </section>
  );
}

// =============================================================================
// DashboardPage
// =============================================================================

export default function DashboardPage() {
  const { data: workouts, isLoading: workoutsLoading } = useWorkouts({ pageSize: 20 });
  const { data: routines, isLoading: routinesLoading } = useRoutines();

  const isLoading = workoutsLoading || routinesLoading;
  const recentWorkouts = useMemo(() => (workouts ?? []).slice(0, 3), [workouts]);
  const hasWorkouts = (workouts ?? []).length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <h1 className="text-xl font-bold text-gray-100">Dashboard</h1>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 animate-slide-up">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
          </div>
        ) : !hasWorkouts ? (
          <div className="space-y-4">
            <WelcomeCard />
            <QuickStartCard routines={routines ?? []} />
          </div>
        ) : (
          <div className="space-y-4">
            <QuickStartCard routines={routines ?? []} />
            <WeeklyStats workouts={workouts ?? []} />
            <RecentWorkouts workouts={recentWorkouts} />
          </div>
        )}
      </div>
    </div>
  );
}
