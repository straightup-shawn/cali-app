import { useParams, Link } from 'react-router-dom';
import { useWorkout, type WorkoutExerciseWithSets } from '@/hooks/useWorkouts';
import { useWorkoutPersonalRecords } from '@/hooks/usePersonalRecords';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import type { ExerciseType } from '@/types';
import type { PersonalRecordRow } from '@/hooks/usePersonalRecords';
import type { Database } from '@/types/database';

type ExerciseSetRow = Database['public']['Tables']['exercise_sets']['Row'];

// =============================================================================
// Constants
// =============================================================================

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

// =============================================================================
// Helpers
// =============================================================================

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Checks if a given set achieved a PR for the exercise in this workout.
 */
function setHasPR(
  set: ExerciseSetRow,
  exerciseId: string,
  prRecords: PersonalRecordRow[],
): boolean {
  if (!set.completed) return false;

  return prRecords.some((pr) => {
    if (pr.exerciseId !== exerciseId) return false;

    switch (pr.recordType) {
      case 'max_reps':
        return set.reps !== null && set.reps >= pr.value;
      case 'max_weight':
        return set.weight_kg !== null && set.weight_kg >= pr.value;
      case 'max_volume':
        return (
          set.reps !== null &&
          set.weight_kg !== null &&
          set.reps * set.weight_kg >= pr.value
        );
      case 'longest_hold':
        return set.duration_seconds !== null && set.duration_seconds >= pr.value;
      default:
        return false;
    }
  });
}

// =============================================================================
// SetRowDisplay
// =============================================================================

interface SetRowDisplayProps {
  set: ExerciseSetRow;
  exerciseType: ExerciseType;
  isPR: boolean;
  formatWeight: (kg: number) => string;
}

function SetRowDisplay({ set, exerciseType, isPR, formatWeight }: SetRowDisplayProps) {
  const showReps = ['bodyweight', 'weighted', 'assisted'].includes(exerciseType);
  const showWeight = ['weighted', 'assisted'].includes(exerciseType);
  const showDuration = ['duration', 'static_hold'].includes(exerciseType);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
        isPR
          ? 'border-amber-200 bg-amber-50'
          : 'border-gray-100 bg-gray-50'
      }`}
    >
      {/* Set number */}
      <span className="w-6 text-center text-xs font-semibold text-gray-400">
        {set.set_number}
      </span>

      {/* Set data */}
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {showReps && set.reps !== null && (
          <span className="text-gray-900">
            <span className="font-medium">{set.reps}</span>
            <span className="ml-0.5 text-xs text-gray-500">reps</span>
          </span>
        )}
        {showWeight && set.weight_kg !== null && (
          <span className="text-gray-900">
            <span className="font-medium">{formatWeight(set.weight_kg)}</span>
          </span>
        )}
        {showDuration && set.duration_seconds !== null && (
          <span className="text-gray-900">
            <span className="font-medium">{formatDuration(set.duration_seconds)}</span>
          </span>
        )}
        {set.rpe !== null && (
          <span className="text-gray-500 text-xs">
            RPE {set.rpe}
          </span>
        )}
        {set.rir !== null && (
          <span className="text-gray-500 text-xs">
            RIR {set.rir}
          </span>
        )}
      </div>

      {/* PR indicator */}
      {isPR && (
        <span className="shrink-0 text-base" title="Personal Record" aria-label="Personal Record">
          🏆
        </span>
      )}
    </div>
  );
}

// =============================================================================
// ExerciseSummarySection
// =============================================================================

interface ExerciseSummarySectionProps {
  exercise: WorkoutExerciseWithSets;
  prRecords: PersonalRecordRow[];
  formatWeight: (kg: number) => string;
}

function ExerciseSummarySection({ exercise, prRecords, formatWeight }: ExerciseSummarySectionProps) {
  const exerciseName = exercise.exercises?.name ?? 'Unknown Exercise';
  const exerciseType = (exercise.exercises?.exercise_type ?? 'bodyweight') as ExerciseType;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {/* Exercise header */}
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {exerciseName}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            TYPE_COLORS[exerciseType]
          }`}
        >
          {TYPE_LABELS[exerciseType]}
        </span>
      </div>

      {/* Sets */}
      <div className="mt-3 space-y-1.5">
        {exercise.exercise_sets.map((set) => (
          <SetRowDisplay
            key={set.id}
            set={set}
            exerciseType={exerciseType}
            isPR={setHasPR(set, exercise.exercise_id, prRecords)}
            formatWeight={formatWeight}
          />
        ))}
        {exercise.exercise_sets.length === 0 && (
          <p className="py-2 text-center text-xs text-gray-400">No sets recorded</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WorkoutDetailPage
// =============================================================================

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading, error } = useWorkout(id);
  const { data: prRecords } = useWorkoutPersonalRecords(id);
  const { formatWeight } = useUnitPreference();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Workout not found'}
        </p>
        <Link
          to="/history"
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to History
        </Link>
      </div>
    );
  }

  const records = prRecords ?? [];
  const exercises = workout.workout_exercises ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          to="/history"
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
          Back to History
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{workout.name}</h1>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span>{formatDate(workout.started_at)}</span>
          <span>•</span>
          <span>{formatTime(workout.started_at)}</span>
          {workout.duration_seconds !== null && (
            <>
              <span>•</span>
              <span>{formatDuration(workout.duration_seconds)}</span>
            </>
          )}
        </div>
      </header>

      {/* Workout summary stats */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4">
        <div className="rounded-lg bg-white p-3 text-center border border-gray-100">
          <p className="text-lg font-bold text-gray-900">{exercises.length}</p>
          <p className="text-xs text-gray-500">Exercises</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center border border-gray-100">
          <p className="text-lg font-bold text-gray-900">
            {exercises.reduce((sum, ex) => sum + ex.exercise_sets.length, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Sets</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center border border-gray-100">
          <p className="text-lg font-bold text-amber-600">{records.length}</p>
          <p className="text-xs text-gray-500">PRs</p>
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="mx-4 mt-4 rounded-lg border border-gray-100 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
          <p className="mt-1 text-sm text-gray-700">{workout.notes}</p>
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 space-y-4 px-4 pt-4">
        {exercises.map((exercise) => (
          <ExerciseSummarySection
            key={exercise.id}
            exercise={exercise}
            prRecords={records}
            formatWeight={formatWeight}
          />
        ))}
        {exercises.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No exercises in this workout</p>
          </div>
        )}
      </div>
    </div>
  );
}
