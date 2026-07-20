import { useState, useEffect, useCallback } from 'react';
import { useExercises } from '@/hooks/useExercises';
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
  bodyweight: 'bg-green-100 text-green-800',
  weighted: 'bg-blue-100 text-blue-800',
  assisted: 'bg-purple-100 text-purple-800',
  duration: 'bg-orange-100 text-orange-800',
  static_hold: 'bg-red-100 text-red-800',
};

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
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: exercises, isLoading } = useExercises({
    search: debouncedSearch || undefined,
  });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  // Reset search when modal opens
  useEffect(() => {
    if (open) setSearchInput('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-50 flex max-h-[85vh] w-full flex-col rounded-t-xl bg-white sm:max-w-lg sm:rounded-xl sm:shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">Add Exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
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
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
              autoFocus
              className="block h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-base shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
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
                        ? 'border-gray-100 bg-gray-50 opacity-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {exercise.name}
                      </p>
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-500">
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
                        TYPE_COLORS[exercise.exercise_type as ExerciseType] ?? 'bg-gray-100 text-gray-800'
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
              <p className="text-sm text-gray-500">No exercises found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
