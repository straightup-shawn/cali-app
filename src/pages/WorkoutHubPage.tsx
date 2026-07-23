import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useRoutines, type RoutineWithCount } from '@/hooks/useRoutines';

// =============================================================================
// Icons
// =============================================================================

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M6 4v16M18 4v16M3 8h6M15 8h6M3 16h6M15 16h6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// =============================================================================
// StartRoutineButton
// =============================================================================

function StartRoutineButton({ routine }: { routine: RoutineWithCount }) {
  const { startWorkout, discardWorkout } = useActiveWorkout();
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

      discardWorkout();
      startWorkout(fullRoutine ? (fullRoutine as any) : undefined);
    } catch {
      discardWorkout();
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
      className="flex w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3 text-sm font-medium text-gray-200 transition-all active:bg-gray-700 disabled:opacity-50"
    >
      <span className="truncate">{starting ? 'Starting…' : routine.name}</span>
      <span className="ml-2 shrink-0 text-xs text-gray-500">
        {routine.exercise_count} exercise{routine.exercise_count !== 1 ? 's' : ''}
      </span>
    </button>
  );
}

// =============================================================================
// WorkoutHubPage
// =============================================================================

export default function WorkoutHubPage() {
  const { startWorkout } = useActiveWorkout();
  const navigate = useNavigate();
  const { data: routines, isLoading: routinesLoading } = useRoutines();

  function handleStartEmpty() {
    startWorkout();
    navigate('/workout/active');
  }

  const quickRoutines = (routines ?? []).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <h1 className="text-xl font-bold text-gray-100">Workout</h1>
      </header>

      <div className="flex-1 space-y-4 px-4 pt-4 animate-slide-up">

        {/* ── Start Workout ─────────────────────────────────────────── */}
        <section className="glass-card rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="mb-3 flex items-center gap-2">
            <BoltIcon />
            <h2 className="text-sm font-semibold text-gray-100">Start Workout</h2>
          </div>

          <button
            type="button"
            onClick={handleStartEmpty}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/40 active:bg-indigo-700"
          >
            <span className="flex items-center justify-center gap-2">
              <PlusIcon />
              Start Empty Workout
            </span>
          </button>

          {/* Quick-pick routines */}
          {routinesLoading ? (
            <div className="mt-3 flex justify-center py-4">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : quickRoutines.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-400">From routine</p>
              <div className="space-y-2">
                {quickRoutines.map((routine) => (
                  <StartRoutineButton key={routine.id} routine={routine} />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* ── My Exercises ──────────────────────────────────────────── */}
        <Link
          to="/exercises"
          className="glass-card flex items-center justify-between rounded-2xl p-4 shadow-lg shadow-black/20 transition-all active:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <DumbbellIcon />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-100">My Exercises</p>
              <p className="text-xs text-gray-400">Browse & manage exercises</p>
            </div>
          </div>
          <ChevronRightIcon />
        </Link>

        {/* ── My Routines ───────────────────────────────────────────── */}
        <Link
          to="/routines"
          className="glass-card flex items-center justify-between rounded-2xl p-4 shadow-lg shadow-black/20 transition-all active:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
              <ListIcon />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-100">My Routines</p>
              <p className="text-xs text-gray-400">Create & manage routines</p>
            </div>
          </div>
          <ChevronRightIcon />
        </Link>

        {/* ── Workout History ───────────────────────────────────────── */}
        <Link
          to="/history"
          className="glass-card flex items-center justify-between rounded-2xl p-4 shadow-lg shadow-black/20 transition-all active:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-100">Workout History</p>
              <p className="text-xs text-gray-400">View past workouts</p>
            </div>
          </div>
          <ChevronRightIcon />
        </Link>

      </div>
    </div>
  );
}
