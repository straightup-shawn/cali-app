import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useExercises } from '@/hooks/useExercises';
import ExerciseCard from '@/components/ExerciseCard';
import type { ExerciseType } from '@/types';

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'triceps',
  'biceps',
  'forearms',
  'core',
  'quads',
  'glutes',
  'hamstrings',
  'hip_flexors',
  'obliques',
  'calves',
] as const;

const EXERCISE_TYPES: ExerciseType[] = [
  'bodyweight',
  'weighted',
  'assisted',
  'duration',
  'static_hold',
];

const TYPE_LABELS: Record<ExerciseType, string> = {
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
  duration: 'Duration',
  static_hold: 'Static Hold',
};

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ExercisesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exerciseType, setExerciseType] = useState('');

  const debouncedSearch = useDebounce(searchInput, 300);

  const filters = {
    search: debouncedSearch || undefined,
    muscleGroup: muscleGroup || undefined,
    type: exerciseType || undefined,
  };

  const { data: exercises, isLoading } = useExercises(filters);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <h1 className="text-xl font-bold text-gray-100">Exercises</h1>
      </header>

      {/* Search */}
      <div className="px-4 pt-4">
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
            className="block h-11 w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-3 text-base text-white placeholder:text-gray-500 transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 px-4 pt-3">
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="h-10 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          aria-label="Filter by muscle group"
        >
          <option value="">All Muscles</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        <select
          value={exerciseType}
          onChange={(e) => setExerciseType(e.target.value)}
          className="h-10 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          aria-label="Filter by exercise type"
        >
          <option value="">All Types</option>
          {EXERCISE_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Exercise List */}
      <div className="flex-1 px-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
          </div>
        ) : exercises && exercises.length > 0 ? (
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                id={exercise.id}
                name={exercise.name}
                exerciseType={exercise.exercise_type as ExerciseType}
                muscleGroups={exercise.muscle_groups ?? []}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No exercises found</p>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Create Exercise FAB */}
      <Link
        to="/exercises/new"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 active:bg-indigo-700"
        aria-label="Create new exercise"
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
