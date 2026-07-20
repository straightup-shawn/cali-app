import { Link } from 'react-router-dom';
import { useRoutines, useDeleteRoutine, useDuplicateRoutine } from '@/hooks/useRoutines';
import RoutineCard from '@/components/RoutineCard';

export default function RoutinesPage() {
  const { data: routines, isLoading } = useRoutines();
  const deleteRoutine = useDeleteRoutine();
  const duplicateRoutine = useDuplicateRoutine();

  function handleDelete(id: string) {
    deleteRoutine.mutate(id);
  }

  function handleDuplicate(id: string) {
    duplicateRoutine.mutate(id);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-100">Routines</h1>
      </header>

      {/* Routine List */}
      <div className="flex-1 px-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
          </div>
        ) : routines && routines.length > 0 ? (
          <div className="space-y-3">
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                id={routine.id}
                name={routine.name}
                exerciseCount={routine.exercise_count}
                updatedAt={routine.updated_at}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-300">
              No routines yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Create your first routine to get started
            </p>
            <Link
              to="/routines/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Routine
            </Link>
          </div>
        )}
      </div>

      {/* Create Routine FAB */}
      <Link
        to="/routines/new"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 active:bg-indigo-700"
        aria-label="Create new routine"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Link>
    </div>
  );
}
