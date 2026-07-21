import { useState, useEffect, useCallback } from 'react';
import { useExercises, useCreateExercise } from '@/hooks/useExercises';
import type { ExerciseType } from '@/types';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: {
    id: string;
    name: string;
    exercise_type: string;
  }) => void;
  /** Exercise IDs already added to the routine (shown as disabled) */
  excludeIds?: string[];
}

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

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ExercisePicker({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}: ExercisePickerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ExerciseType>('bodyweight');
  const [createError, setCreateError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: exercises, isLoading } = useExercises({
    search: debouncedSearch || undefined,
  });
  const createExercise = useCreateExercise();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchInput('');
      setShowCreateForm(false);
      setNewName('');
      setNewType('bodyweight');
      setCreateError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError('Name is required');
      return;
    }
    setCreateError(null);
    try {
      const created = await createExercise.mutateAsync({
        name: newName.trim(),
        exercise_type: newType,
      });
      // Select the newly created exercise immediately
      onSelect({
        id: created.id,
        name: created.name,
        exercise_type: created.exercise_type,
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create exercise');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:items-center sm:pt-0">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-50 flex h-[80vh] w-full flex-col glass-card rounded-2xl mx-4 sm:max-w-lg sm:shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-100">Add Exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 active:bg-gray-700"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchInput}
              onChange={handleSearchChange}
              className="block h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Create New Exercise button */}
          {!showCreateForm && (
            <button
              type="button"
              onClick={() => {
                setNewName(searchInput);
                setShowCreateForm(true);
              }}
              className="mb-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-indigo-600/50 bg-indigo-950/30 p-3 text-left transition-colors hover:bg-indigo-950/50 active:bg-indigo-900/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-300">Create New Exercise</p>
                <p className="text-xs text-gray-500">Add a custom exercise to your library</p>
              </div>
            </button>
          )}

          {/* Inline Create Form */}
          {showCreateForm && (
            <div className="mb-3 rounded-xl border border-indigo-600/50 bg-indigo-950/20 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-indigo-200">New Exercise</h3>
              <input
                type="text"
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ExerciseType)}
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none"
              >
                {EXERCISE_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              {createError && (
                <p className="text-xs text-red-400">{createError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createExercise.isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createExercise.isPending ? 'Creating...' : 'Create & Add'}
                </button>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
            </div>
          ) : exercises && exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.map((exercise) => {
                const isExcluded = excludeIds.includes(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    disabled={isExcluded}
                    onClick={() =>
                      onSelect({
                        id: exercise.id,
                        name: exercise.name,
                        exercise_type: exercise.exercise_type,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      isExcluded
                        ? 'border-gray-800 bg-gray-800/50 opacity-50'
                        : 'border-gray-700 bg-gray-800 hover:border-indigo-600 hover:bg-gray-700 active:bg-gray-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        {exercise.name}
                      </p>
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {exercise.muscle_groups
                            .map((g: string) =>
                              g.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                            )
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[exercise.exercise_type as ExerciseType] ?? 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {TYPE_LABELS[exercise.exercise_type as ExerciseType] ?? exercise.exercise_type}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">No exercises found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
