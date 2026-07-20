import { Link } from 'react-router-dom';
import type { ExerciseType } from '@/types';

interface ExerciseCardProps {
  id: string;
  name: string;
  exerciseType: ExerciseType;
  muscleGroups: string[];
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

export default function ExerciseCard({ id, name, exerciseType, muscleGroups }: ExerciseCardProps) {
  return (
    <Link
      to={`/exercises/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:shadow-md active:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-medium text-gray-900">{name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[exerciseType]}`}
        >
          {TYPE_LABELS[exerciseType]}
        </span>
      </div>
      {muscleGroups.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {muscleGroups.map((group) => (
            <span
              key={group}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {group.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
