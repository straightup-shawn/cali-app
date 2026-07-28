import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useRoutine,
  useCreateRoutine,
  useUpdateRoutine,
} from '@/hooks/useRoutines';
import ExercisePicker from '@/components/ExercisePicker';
import { sendChatMessage, parseRoutineFromResponse } from '@/lib/ai';
import type { ExerciseType } from '@/types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const routineNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Routine name is required')
    .max(100, 'Name must be 100 characters or less'),
});

type RoutineNameFormData = z.infer<typeof routineNameSchema>;

// ---------------------------------------------------------------------------
// Types for local exercise list state
// ---------------------------------------------------------------------------

interface RoutineExerciseItem {
  /** Unique key for React (not the DB id) */
  key: string;
  exercise_id: string;
  name: string;
  exercise_type: ExerciseType;
  target_sets: number;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_duration_seconds: number | null;
  rest_seconds: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function needsReps(type: ExerciseType): boolean {
  return type === 'bodyweight' || type === 'weighted' || type === 'assisted';
}

function needsWeight(type: ExerciseType): boolean {
  return type === 'weighted';
}

function needsDuration(type: ExerciseType): boolean {
  return type === 'duration' || type === 'static_hold';
}

let keyCounter = 0;
function nextKey(): string {
  return `re_${++keyCounter}_${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoutineFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  // Data hooks
  const { data: existingRoutine, isLoading: routineLoading } = useRoutine(id);
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();

  // Form for routine name
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RoutineNameFormData>({
    resolver: zodResolver(routineNameSchema),
    defaultValues: { name: '' },
  });

  // Local state for exercise list
  const [exercises, setExercises] = useState<RoutineExerciseItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // AI generation state
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingRoutine) {
      reset({ name: existingRoutine.name });
      setExercises(
        existingRoutine.routine_exercises.map((re) => ({
          key: nextKey(),
          exercise_id: re.exercise_id,
          name: re.exercises?.name ?? 'Unknown Exercise',
          exercise_type: (re.exercises?.exercise_type ?? 'bodyweight') as ExerciseType,
          target_sets: re.target_sets ?? 3,
          target_reps: re.target_reps,
          target_weight_kg: re.target_weight_kg,
          target_duration_seconds: re.target_duration_seconds,
          rest_seconds: re.rest_seconds,
        }))
      );
    }
  }, [isEditing, existingRoutine, reset]);

  // ------ Exercise list actions ------

  function handleAddExercise(exercise: {
    id: string;
    name: string;
    exercise_type: string;
  }) {
    const type = exercise.exercise_type as ExerciseType;
    setExercises((prev) => [
      ...prev,
      {
        key: nextKey(),
        exercise_id: exercise.id,
        name: exercise.name,
        exercise_type: type,
        target_sets: 3,
        target_reps: needsReps(type) ? 10 : null,
        target_weight_kg: needsWeight(type) ? 0 : null,
        target_duration_seconds: needsDuration(type) ? 30 : null,
        rest_seconds: null,
      },
    ]);
    setPickerOpen(false);
  }

  function handleRemoveExercise(key: string) {
    setExercises((prev) => prev.filter((e) => e.key !== key));
  }

  function handleMoveUp(index: number) {
    if (index <= 0) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleMoveDown(index: number) {
    setExercises((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleExerciseFieldChange(
    key: string,
    field: keyof Pick<
      RoutineExerciseItem,
      'target_sets' | 'target_reps' | 'target_weight_kg' | 'target_duration_seconds' | 'rest_seconds'
    >,
    value: string
  ) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== key) return ex;
        const numVal = value === '' ? null : Number(value);
        return { ...ex, [field]: numVal };
      })
    );
  }

  // ------ AI Generate Routine ------

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await sendChatMessage([
        { role: 'user', content: `Create a calisthenics routine: ${aiPrompt.trim()}` },
      ]);
      const routine = parseRoutineFromResponse(response);
      if (!routine) {
        setAiError('AI could not generate a routine. Try a more specific prompt.');
        return;
      }
      // Set routine name if currently empty
      const currentName = document.querySelector<HTMLInputElement>('#routine-name')?.value;
      if (!currentName?.trim()) {
        reset({ name: routine.routine_name });
      }
      // Convert AI exercises to local format
      const newExercises: RoutineExerciseItem[] = routine.exercises.map((ex) => {
        const type = (ex.exercise_type || 'bodyweight') as ExerciseType;
        return {
          key: nextKey(),
          exercise_id: '', // Will be resolved on save or user can swap
          name: ex.name,
          exercise_type: type,
          target_sets: ex.sets ?? 3,
          target_reps: ex.reps ?? (needsReps(type) ? 10 : null),
          target_weight_kg: needsWeight(type) ? 0 : null,
          target_duration_seconds: ex.duration_seconds ?? (needsDuration(type) ? 30 : null),
          rest_seconds: ex.rest_seconds ?? null,
        };
      });
      setExercises(newExercises);
      setAiPromptOpen(false);
      setAiPrompt('');
    } catch {
      setAiError('Failed to reach AI. Check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  }

  // ------ Submit ------

  async function onSubmit(data: RoutineNameFormData) {
    setServerError(null);
    setIsSaving(true);

    try {
      // Resolve AI-generated exercises that don't have IDs yet
      const resolvedExercises = await Promise.all(
        exercises.map(async (ex) => {
          if (ex.exercise_id) return ex;
          // Try to find existing exercise by name, or create one
          const { supabase } = await import('@/lib/supabase');
          const { data: existing } = await supabase
            .from('exercises')
            .select('id')
            .ilike('name', ex.name)
            .limit(1)
            .single();
          if (existing) {
            return { ...ex, exercise_id: existing.id };
          }
          // Create new exercise
          const { data: created, error } = await supabase
            .from('exercises')
            .insert({
              name: ex.name,
              exercise_type: ex.exercise_type,
              muscle_groups: [],
            })
            .select('id')
            .single();
          if (error || !created) throw new Error(`Failed to create exercise: ${ex.name}`);
          return { ...ex, exercise_id: created.id };
        })
      );

      const exercisePayload = resolvedExercises.map((ex, idx) => ({
        exercise_id: ex.exercise_id,
        position: idx,
        target_sets: ex.target_sets ?? 3,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        target_duration_seconds: ex.target_duration_seconds,
        rest_seconds: ex.rest_seconds,
      }));

      if (isEditing && id) {
        await updateRoutine.mutateAsync({
          id,
          name: data.name.trim(),
          exercises: exercisePayload,
        });
      } else {
        await createRoutine.mutateAsync({
          name: data.name.trim(),
          exercises: exercisePayload,
        });
      }
      navigate('/routines');
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to save routine. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  // ------ Loading state (edit mode) ------

  if (isEditing && routineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between glass-header px-4 py-3">
        <Link
          to="/routines"
          className="text-sm font-medium text-indigo-400 active:text-indigo-300"
        >
          Cancel
        </Link>
        <h1 className="text-lg font-bold text-gray-100">
          {isEditing ? 'Edit Routine' : 'New Routine'}
        </h1>
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

        {/* Routine Name */}
        <div>
          <label
            htmlFor="routine-name"
            className="block text-sm font-medium text-gray-300"
          >
            Routine Name <span className="text-red-400">*</span>
          </label>
          <input
            id="routine-name"
            type="text"
            autoComplete="off"
            className="mt-1 block h-11 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. Push Day"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* AI Generate Section */}
        {!isEditing && (
          <div>
            {!aiPromptOpen ? (
              <button
                type="button"
                onClick={() => setAiPromptOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-950/20 py-3 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-950/40 active:bg-indigo-950/60"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
              </button>
            ) : (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-3">
                <label className="block text-xs font-medium text-indigo-300">
                  Describe what kind of routine you want
                </label>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiGenerate(); } }}
                  placeholder="e.g. Upper body push day, beginner planche progression..."
                  className="block h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  disabled={aiLoading}
                  autoFocus
                />
                {aiError && (
                  <p className="text-xs text-red-400">{aiError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Generating…
                      </>
                    ) : (
                      'Generate'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiPromptOpen(false); setAiError(null); }}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exercises Section */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">Exercises</h2>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-md bg-indigo-900/50 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-900 active:bg-indigo-800"
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="mt-4 rounded-lg border-2 border-dashed border-gray-700 py-8 text-center">
              <p className="text-sm text-gray-400">No exercises added yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Tap "Add Exercise" to get started
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {exercises.map((ex, index) => (
                <ExerciseListItem
                  key={ex.key}
                  item={ex}
                  index={index}
                  total={exercises.length}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onRemove={() => handleRemoveExercise(ex.key)}
                  onFieldChange={(field, value) =>
                    handleExerciseFieldChange(ex.key, field, value)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center rounded-md bg-indigo-600 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 active:bg-indigo-700"
          >
            {isSaving
              ? 'Saving…'
              : isEditing
                ? 'Update Routine'
                : 'Create Routine'}
          </button>
        </div>
      </form>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        excludeIds={exercises.map((e) => e.exercise_id)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExerciseListItem sub-component
// ---------------------------------------------------------------------------

interface ExerciseListItemProps {
  item: RoutineExerciseItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onFieldChange: (
    field: keyof Pick<
      RoutineExerciseItem,
      'target_sets' | 'target_reps' | 'target_weight_kg' | 'target_duration_seconds' | 'rest_seconds'
    >,
    value: string
  ) => void;
}

const TYPE_BADGE_COLORS: Record<ExerciseType, string> = {
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
  cardio: 'bg-cyan-900/50 text-cyan-300',
};

const TYPE_BADGE_LABELS: Record<ExerciseType, string> = {
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
  duration: 'Duration',
  static_hold: 'Static Hold',
  cardio: 'Cardio',
};

function ExerciseListItem({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onFieldChange,
}: ExerciseListItemProps) {
  return (
    <div className="glass-card rounded-2xl p-3">
      {/* Exercise header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-30"
              aria-label="Move up"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-30"
              aria-label="Move down"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-100">
              {item.name}
            </p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLORS[item.exercise_type]}`}
            >
              {TYPE_BADGE_LABELS[item.exercise_type]}
            </span>
          </div>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-950 active:bg-red-900"
          aria-label={`Remove ${item.name}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Target Inputs */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {/* Sets (always shown) */}
        <div>
          <label className="block text-xs text-gray-400">Sets</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={item.target_sets ?? ''}
            onChange={(e) => onFieldChange('target_sets', e.target.value)}
            className="mt-0.5 block h-11 w-full rounded border border-gray-700 bg-gray-800 px-2 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Reps (bodyweight, weighted, assisted) */}
        {needsReps(item.exercise_type) && (
          <div>
            <label className="block text-xs text-gray-400">Reps</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={item.target_reps ?? ''}
              onChange={(e) => onFieldChange('target_reps', e.target.value)}
              className="mt-0.5 block h-11 w-full rounded border border-gray-700 bg-gray-800 px-2 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* Weight (weighted only) */}
        {needsWeight(item.exercise_type) && (
          <div>
            <label className="block text-xs text-gray-400">Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={item.target_weight_kg ?? ''}
              onChange={(e) => onFieldChange('target_weight_kg', e.target.value)}
              className="mt-0.5 block h-11 w-full rounded border border-gray-700 bg-gray-800 px-2 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* Duration (duration, static_hold) */}
        {needsDuration(item.exercise_type) && (
          <div>
            <label className="block text-xs text-gray-400">Duration (s)</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={item.target_duration_seconds ?? ''}
              onChange={(e) =>
                onFieldChange('target_duration_seconds', e.target.value)
              }
              className="mt-0.5 block h-11 w-full rounded border border-gray-700 bg-gray-800 px-2 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* Rest seconds (always shown, optional) */}
        <div>
          <label className="block text-xs text-gray-400">Rest (s)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="default"
            value={item.rest_seconds ?? ''}
            onChange={(e) => onFieldChange('rest_seconds', e.target.value)}
            className="mt-0.5 block h-11 w-full rounded border border-gray-700 bg-gray-800 px-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
