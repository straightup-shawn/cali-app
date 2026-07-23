import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateExercise } from '@/hooks/useExercises';
import { useExercises } from '@/hooks/useExercises';
import { useClassifyExercise } from '@/hooks/useExerciseClassification';
import type { ExerciseType } from '@/types';
import type { ClassificationResult } from '@/lib/exercise-classifier';

const MUSCLE_GROUPS = [
  // Upper body - front
  'chest',
  'upper_chest',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  // Upper body - back
  'lats',
  'upper_back',
  'lower_back',
  'traps',
  'rhomboids',
  // Core
  'abs',
  'obliques',
  'transverse_abs',
  'hip_flexors',
  'erector_spinae',
  // Lower body
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'abductors',
  'calves',
  'tibialis',
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
  const classifyExercise = useClassifyExercise();
  const { data: exercises } = useExercises();
  const [serverError, setServerError] = useState<string | null>(null);
  const [aiStep, setAiStep] = useState<'idle' | 'classifying' | 'done' | 'skipped'>('idle');
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [createdExerciseId, setCreatedExerciseId] = useState<string | null>(null);

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

      setCreatedExerciseId(result.id);

      // Show AI classification step
      setAiStep('classifying');
      try {
        const classification = await classifyExercise.mutateAsync({
          exerciseId: result.id,
          name: data.name.trim(),
          exercise_type: data.exercise_type,
          muscle_groups: data.muscle_groups ?? [],
          instructions: data.instructions?.trim() || null,
        });
        setClassificationResult(classification as ClassificationResult);
        setAiStep('done');
      } catch {
        // If classification fails, just skip it
        setAiStep('skipped');
      }
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to create exercise. Please try again.');
      }
    }
  }

  // AI classification complete screen
  if (aiStep === 'classifying' || aiStep === 'done' || aiStep === 'skipped') {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950">
        <header className="sticky top-0 z-10 glass-header px-4 py-3">
          <h1 className="text-center text-lg font-bold text-gray-100">AI Analysis</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6">
          {aiStep === 'classifying' && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              {/* Sparkle animation */}
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-600/20 animate-ping" />
                <svg className="h-10 w-10 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-100">Analyzing exercise...</p>
              <p className="text-sm text-gray-400 text-center">
                AI is classifying biomechanics, bodyweight fraction, and movement pattern
              </p>
            </div>
          )}

          {aiStep === 'done' && classificationResult && (
            <div className="w-full max-w-sm space-y-5 animate-fade-in">
              {/* Success icon */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                  <svg className="h-7 w-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-100">Exercise Classified</p>
              </div>

              {/* Classification card */}
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Movement</span>
                  <span className="text-sm font-semibold text-gray-100 capitalize">
                    {classificationResult.movement_family.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Resistance Model</span>
                  <span className="text-sm font-semibold text-gray-100 capitalize">
                    {classificationResult.resistance_model.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Bodyweight %</span>
                  <span className="text-sm font-bold text-indigo-400">
                    {Math.round(classificationResult.bodyweight_fraction * 100)}%
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      ({Math.round(classificationResult.bodyweight_fraction_min * 100)}–{Math.round(classificationResult.bodyweight_fraction_max * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Volume Mode</span>
                  <span className="text-sm font-semibold text-gray-100 capitalize">
                    {classificationResult.volume_mode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Confidence</span>
                  <span className="text-sm font-semibold text-gray-100">
                    {Math.round(classificationResult.confidence * 100)}%
                  </span>
                </div>
                {classificationResult.rationale && (
                  <div className="border-t border-gray-700 pt-2">
                    <p className="text-xs text-gray-400 italic">"{classificationResult.rationale}"</p>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-gray-500">
                This data helps calculate accurate volume tracking for your workouts
              </p>

              {/* Continue button */}
              <button
                type="button"
                onClick={() => navigate(`/exercises/${createdExerciseId}`)}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700"
              >
                Done
              </button>
            </div>
          )}

          {aiStep === 'skipped' && (
            <div className="w-full max-w-sm space-y-5 animate-fade-in">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700/50">
                  <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-100">Exercise Created</p>
                <p className="text-sm text-gray-400 text-center">
                  AI classification wasn't available, but your exercise is saved. You can analyze it later from the exercise detail page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/exercises/${createdExerciseId}`)}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between glass-header px-4 py-3">
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

        {/* AI Recommendation Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-indigo-600/30 bg-indigo-950/30 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
            <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-indigo-300">AI Analysis Included</p>
            <p className="mt-0.5 text-xs text-gray-400">
              After creating, AI will classify this exercise's biomechanics for accurate volume tracking.
            </p>
          </div>
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
