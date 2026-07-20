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
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
};

export default function ExerciseCard({ id, name, exerciseType, muscleGroups }: ExerciseCardProps) {
  return (
    <Link
      to={`/exercises/${id}`}
      className="block rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors active:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-medium text-gray-100">{name}</h3>
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
              className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
            >
              {group.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
