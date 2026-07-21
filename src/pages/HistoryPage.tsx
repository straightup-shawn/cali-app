import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkouts, type WorkoutSummary } from '@/hooks/useWorkouts';

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

function WorkoutCard({ workout }: { workout: WorkoutSummary }) {
  const dateStr = workout.completed_at ?? workout.started_at;

  return (
    <Link
      to={`/history/${workout.id}`}
      className="block glass-card rounded-2xl p-4 transition-colors active:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-100">
            {workout.name}
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {formatDate(dateStr)}
          </p>
        </div>
        <svg
          className="h-4 w-4 shrink-0 text-gray-500"
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
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formatDuration(workout.duration_seconds)}
        </span>
        <span className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
          {workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: workouts, isLoading } = useWorkouts({ page, pageSize });

  const hasNextPage = (workouts?.length ?? 0) === pageSize;
  const hasPrevPage = page > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <h1 className="text-xl font-bold text-gray-100">History</h1>
      </header>

      {/* Workout List */}
      <div className="flex-1 px-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
          </div>
        ) : (workouts?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            {workouts!.map((workout: WorkoutSummary) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 py-4">
              {hasPrevPage && (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-700 active:bg-gray-700"
                >
                  Previous
                </button>
              )}
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-700 active:bg-gray-700"
                >
                  Load More
                </button>
              )}
            </div>
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-300">
              No workouts yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Complete your first workout to see it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
