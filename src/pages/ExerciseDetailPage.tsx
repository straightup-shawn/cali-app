import { useParams, Link } from 'react-router-dom';
import { useExercise } from '@/hooks/useExercises';
import type { ExerciseType } from '@/types';

const TYPE_LABELS: Record<ExerciseType, string> = {
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
  duration: 'Duration',
  static_hold: 'Static Hold',
};

const TYPE_COLORS: Record<ExerciseType, string> = {
  bodyweight: 'bg-green-100 text-green-800',
  weighted: 'bg-blue-100 text-blue-800',
  assisted: 'bg-purple-100 text-purple-800',
  duration: 'bg-orange-100 text-orange-800',
  static_hold: 'bg-red-100 text-red-800',
};

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: exercise, isLoading, error } = useExercise(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Exercise not found'}
        </p>
        <Link
          to="/exercises"
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Exercises
        </Link>
      </div>
    );
  }

  const exerciseType = exercise.exercise_type as ExerciseType;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          to="/exercises"
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Exercises
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{exercise.name}</h1>
      </header>

      <div className="flex-1 space-y-6 px-4 pt-4">
        {/* Type Badge & Muscle Groups */}
        <section>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLORS[exerciseType]}`}
          >
            {TYPE_LABELS[exerciseType]}
          </span>

          {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {exercise.muscle_groups.map((group) => (
                <span
                  key={group}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {group.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Instructions */}
        {exercise.instructions && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700">Instructions</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {exercise.instructions}
            </p>
          </section>
        )}

        {/* Progression Chain */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700">Progression Chain</h2>
          <div className="mt-2 space-y-2">
            {/* Easier exercises (prerequisites) */}
            {exercise.prerequisiteExercises && exercise.prerequisiteExercises.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Easier</p>
                <div className="mt-1 space-y-1">
                  {exercise.prerequisiteExercises.map((prereq) => (
                    <Link
                      key={prereq.id}
                      to={`/exercises/${prereq.id}`}
                      className="block rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
                    >
                      ← {prereq.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Current exercise indicator */}
            <div className="rounded-md border-2 border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800">
              {exercise.name}
              <span className="ml-2 text-xs font-normal text-indigo-600">(current)</span>
            </div>

            {/* Harder exercise (progresses to) */}
            {exercise.progressesToExercise && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Harder</p>
                <div className="mt-1">
                  <Link
                    to={`/exercises/${exercise.progressesToExercise.id}`}
                    className="block rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
                  >
                    {exercise.progressesToExercise.name} →
                  </Link>
                </div>
              </div>
            )}

            {/* No progression links */}
            {(!exercise.prerequisiteExercises || exercise.prerequisiteExercises.length === 0) &&
              !exercise.progressesToExercise && (
                <p className="text-sm text-gray-400">No progression links for this exercise</p>
              )}
          </div>
        </section>

        {/* Personal Records Section (placeholder) */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700">Personal Records</h2>
          <p className="mt-1 text-sm text-gray-400">
            Personal records will appear here once you log workouts with this exercise.
          </p>
        </section>
      </div>
    </div>
  );
}
