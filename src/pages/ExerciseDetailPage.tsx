import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useExercise, useUpdateExercise, useDeleteExercise } from '@/hooks/useExercises';
import type { ExerciseType } from '@/types';

const TYPE_LABELS: Record<ExerciseType, string> = {
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
  duration: 'Duration',
  static_hold: 'Static Hold',
};

const TYPE_COLORS: Record<ExerciseType, string> = {
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
};

const EXERCISE_TYPES: ExerciseType[] = ['bodyweight', 'weighted', 'assisted', 'duration', 'static_hold'];

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: exercise, isLoading, error } = useExercise(id);
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<ExerciseType>('bodyweight');
  const [editMuscleGroups, setEditMuscleGroups] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function startEditing() {
    if (!exercise) return;
    setEditName(exercise.name);
    setEditType(exercise.exercise_type as ExerciseType);
    setEditMuscleGroups(exercise.muscle_groups?.join(', ') ?? '');
    setEditInstructions(exercise.instructions ?? '');
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }

  async function handleSave() {
    if (!exercise || !id) return;
    const muscleGroups = editMuscleGroups
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    await updateExercise.mutateAsync({
      id,
      name: editName,
      exercise_type: editType,
      muscle_groups: muscleGroups,
      instructions: editInstructions || null,
    });
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!id) return;
    await deleteExercise.mutateAsync(id);
    navigate('/exercises');
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Exercise not found'}
        </p>
        <Link
          to="/exercises"
          className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Back to Exercises
        </Link>
      </div>
    );
  }

  const exerciseType = exercise.exercise_type as ExerciseType;
  const isCustom = !exercise.is_system;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/exercises"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
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
            Back
          </Link>
          {isCustom && !isEditing && (
            <button
              onClick={startEditing}
              className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={cancelEditing}
                className="rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateExercise.isPending}
                className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {updateExercise.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xl font-bold text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <h1 className="mt-2 text-xl font-bold text-gray-100">{exercise.name}</h1>
        )}
      </header>

      <div className="flex-1 space-y-6 px-4 pt-4">
        {/* Type Badge & Muscle Groups */}
        <section>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Exercise Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as ExerciseType)}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Muscle Groups (comma-separated)
                </label>
                <input
                  type="text"
                  value={editMuscleGroups}
                  onChange={(e) => setEditMuscleGroups(e.target.value)}
                  placeholder="e.g. chest, triceps, shoulders"
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <>
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
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                    >
                      {group.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Instructions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300">Instructions</h2>
          {isEditing ? (
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              rows={4}
              placeholder="Enter exercise instructions…"
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          ) : exercise.instructions ? (
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              {exercise.instructions}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">No instructions provided.</p>
          )}
        </section>

        {/* Error display */}
        {(updateExercise.isError || deleteExercise.isError) && (
          <div className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2">
            <p className="text-sm text-red-400">
              {updateExercise.error instanceof Error
                ? updateExercise.error.message
                : deleteExercise.error instanceof Error
                  ? deleteExercise.error.message
                  : 'An error occurred'}
            </p>
          </div>
        )}

        {/* Delete Exercise - only in edit mode */}
        {isEditing && (
          <section className="pt-4 border-t border-gray-800">
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-red-400">
                  Are you sure you want to delete this exercise? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteExercise.isPending}
                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {deleteExercise.isPending ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-md bg-red-900/50 border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900 transition-colors"
              >
                Delete Exercise
              </button>
            )}
          </section>
        )}

        {/* Progression Chain - only visible when not editing */}
        {!isEditing && (
          <section>
            <h2 className="text-sm font-semibold text-gray-300">Progression Chain</h2>
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
                        className="block rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-gray-700 active:bg-gray-700"
                      >
                        ← {prereq.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Current exercise indicator */}
              <div className="rounded-md border-2 border-indigo-600 bg-indigo-950/50 px-3 py-2 text-sm font-semibold text-indigo-200">
                {exercise.name}
                <span className="ml-2 text-xs font-normal text-indigo-400">(current)</span>
              </div>

              {/* Harder exercise (progresses to) */}
              {exercise.progressesToExercise && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Harder</p>
                  <div className="mt-1">
                    <Link
                      to={`/exercises/${exercise.progressesToExercise.id}`}
                      className="block rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-gray-700 active:bg-gray-700"
                    >
                      {exercise.progressesToExercise.name} →
                    </Link>
                  </div>
                </div>
              )}

              {/* No progression links */}
              {(!exercise.prerequisiteExercises || exercise.prerequisiteExercises.length === 0) &&
                !exercise.progressesToExercise && (
                  <p className="text-sm text-gray-500">No progression links for this exercise</p>
                )}
            </div>
          </section>
        )}

        {/* Personal Records Section (placeholder) - only when not editing */}
        {!isEditing && (
          <section>
            <h2 className="text-sm font-semibold text-gray-300">Personal Records</h2>
            <p className="mt-1 text-sm text-gray-500">
              Personal records will appear here once you log workouts with this exercise.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
