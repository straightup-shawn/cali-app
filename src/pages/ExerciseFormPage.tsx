import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateExercise } from '@/hooks/useExercises';
import { useExercises } from '@/hooks/useExercises';
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

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'assisted', label: 'Assisted' },
  { value: 'duration', label: 'Duration' },
  { value: 'static_hold', label: 'Static Hold' },
];

const exerciseFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Exercise name is required')
    .max(100, 'Name must be 100 characters or less'),
  exercise_type: z.enum(
    ['bodyweight', 'weighted', 'assisted', 'duration', 'static_hold'],
    { message: 'Please select an exercise type' }
  ),
  muscle_groups: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  progresses_to: z.string().nullable().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

export default function ExerciseFormPage() {
  const navigate = useNavigate();
  const createExercise = useCreateExercise();
  const { data: exercises } = useExercises();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: '',
      exercise_type: undefined,
      muscle_groups: [],
      instructions: '',
      progresses_to: null,
    },
  });

  const selectedMuscleGroups = watch('muscle_groups') ?? [];

  function toggleMuscleGroup(group: string) {
    const current = selectedMuscleGroups;
    if (current.includes(group)) {
      setValue(
        'muscle_groups',
        current.filter((g) => g !== group),
        { shouldValidate: true }
      );
    } else {
      setValue('muscle_groups', [...current, group], { shouldValidate: true });
    }
  }

  async function onSubmit(data: ExerciseFormData) {
    setServerError(null);
    try {
      const result = await createExercise.mutateAsync({
        name: data.name.trim(),
        exercise_type: data.exercise_type,
        muscle_groups:
          data.muscle_groups && data.muscle_groups.length > 0
            ? data.muscle_groups
            : undefined,
        instructions: data.instructions?.trim() || null,
        progresses_to: data.progresses_to || null,
      });
      navigate(`/exercises/${result.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to create exercise. Please try again.');
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
        <Link
          to="/exercises"
          className="text-sm font-medium text-indigo-400 active:text-indigo-300"
        >
          Cancel
        </Link>
        <h1 className="text-lg font-bold text-gray-100">New Exercise</h1>
        <div className="w-12" aria-hidden="true" />
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 space-y-6 px-4 py-6"
        noValidate
      >
        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-red-900/50 border border-red-800 p-3 text-sm text-red-300"
          >
            {serverError}
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-300"
          >
            Exercise Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="off"
            className="mt-1 block h-11 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. Archer Push-Up"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Exercise Type */}
        <div>
          <label
            htmlFor="exercise_type"
            className="block text-sm font-medium text-gray-300"
          >
            Exercise Type <span className="text-red-400">*</span>
          </label>
          <select
            id="exercise_type"
            className="mt-1 block h-11 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-base text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            {...register('exercise_type')}
          >
            <option value="">Select a type...</option>
            {EXERCISE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.exercise_type && (
            <p className="mt-1 text-sm text-red-400">
              {errors.exercise_type.message}
            </p>
          )}
        </div>

        {/* Muscle Groups */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-300">
            Muscle Groups
          </legend>
          <p className="mt-1 text-xs text-gray-500">
            Select all that apply (optional)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((group) => {
              const isSelected = selectedMuscleGroups.includes(group);
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleMuscleGroup(group)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300'
                      : 'border-gray-700 bg-gray-800 text-gray-400 active:bg-gray-700'
                  }`}
                  aria-pressed={isSelected}
                >
                  {group.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Instructions */}
        <div>
          <label
            htmlFor="instructions"
            className="block text-sm font-medium text-gray-300"
          >
            Instructions
          </label>
          <textarea
            id="instructions"
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            placeholder="How to perform this exercise..."
            {...register('instructions')}
          />
        </div>

        {/* Progresses To */}
        <div>
          <label
            htmlFor="progresses_to"
            className="block text-sm font-medium text-gray-300"
          >
            Progresses To
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Select the harder exercise this progresses toward (optional)
          </p>
          <select
            id="progresses_to"
            className="mt-1 block h-11 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-base text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            {...register('progresses_to')}
          >
            <option value="">None</option>
            {exercises?.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-md bg-indigo-600 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 active:bg-indigo-700"
          >
            {isSubmitting ? 'Creating…' : 'Create Exercise'}
          </button>
        </div>
      </form>
    </div>
  );
}
