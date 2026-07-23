import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkout, useUpdateWorkout } from '@/hooks/useWorkouts';
import { useEditWorkoutState } from '@/hooks/useEditWorkoutState';
import ExerciseSection from '@/components/workout/ExerciseSection';
import ExercisePicker from '@/components/ExercisePicker';
import type { ExerciseType } from '@/types';

// =============================================================================
// Helper: format seconds as HH:MM:SS or MM:SS
// =============================================================================

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// =============================================================================
// DiscardConfirmDialog
// =============================================================================

interface DiscardConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DiscardConfirmDialog({ open, onCancel, onConfirm }: DiscardConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm glass-card rounded-2xl p-6 shadow-xl animate-slide-up">
        <h3 className="text-lg font-bold text-gray-100">Discard Changes?</h3>
        <p className="mt-2 text-sm text-gray-400">
          Your unsaved edits will be lost. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-gray-700 active:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-500 active:bg-red-700"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EditWorkoutPage
// =============================================================================

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workout, isLoading: fetchLoading, error: fetchError } = useWorkout(id);
  const updateWorkoutMutation = useUpdateWorkout();

  const {
    editState,
    isDirty,
    isLoading: stateLoading,
    updateWorkoutName,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    deleteSet,
    updateSet,
    computePayload,
  } = useEditWorkoutState(workout);

  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Compute static duration from started_at and completed_at
  const staticDuration = (() => {
    if (!workout?.started_at || !workout?.completed_at) return null;
    const start = new Date(workout.started_at).getTime();
    const end = new Date(workout.completed_at).getTime();
    return Math.max(0, Math.floor((end - start) / 1000));
  })();

  // Back button handler
  const handleBack = useCallback(() => {
    if (isDirty) {
      setDiscardOpen(true);
    } else {
      navigate(`/history/${id}`);
    }
  }, [isDirty, navigate, id]);

  // Discard confirm
  const handleDiscard = useCallback(() => {
    setDiscardOpen(false);
    navigate(`/history/${id}`);
  }, [navigate, id]);

  // Add exercise from picker
  const handleAddExercise = useCallback(
    (exercise: { id: string; name: string; exercise_type: string }) => {
      addExercise({
        id: exercise.id,
        name: exercise.name,
        exerciseType: exercise.exercise_type as ExerciseType,
      });
      setAddExerciseOpen(false);
    },
    [addExercise]
  );

  // Save changes
  const handleSave = useCallback(async () => {
    if (!editState) return;
    setSaving(true);
    setSaveError(null);

    try {
      const payload = computePayload();
      await updateWorkoutMutation.mutateAsync(payload);
      navigate(`/history/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [editState, computePayload, updateWorkoutMutation, navigate, id]);

  // Loading state
  if (fetchLoading || stateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  // Error state
  if (fetchError || !workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
        <p className="text-sm text-red-400">
          {fetchError instanceof Error ? fetchError.message : 'Workout not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Back to History
        </button>
      </div>
    );
  }

  // If edit state hasn't initialized yet
  if (!editState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  const exerciseIds = editState.exercises.map((e) => e.exerciseId);

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-950 pb-24">
      {/* EditWorkoutHeader */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back/X button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 active:bg-gray-700"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Center: editable name */}
          <div className="min-w-0 flex-1 px-3">
            <input
              type="text"
              value={editState.name}
              onChange={(e) => updateWorkoutName(e.target.value)}
              className="w-full truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-center text-lg font-bold text-gray-100 placeholder:text-gray-500 hover:border-gray-700 focus:border-indigo-500 focus:bg-gray-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="Workout name"
            />
            {/* Static duration */}
            {staticDuration !== null && (
              <div className="mt-0.5 text-center">
                <p className="text-sm font-mono text-indigo-400">{formatDuration(staticDuration)}</p>
                <p className="text-[10px] text-gray-500">Original duration</p>
              </div>
            )}
          </div>

          {/* Right spacer */}
          <div className="h-10 w-10" />
        </div>
      </header>

      {/* Exercise list */}
      <div className="flex-1 space-y-4 px-4 pt-4">
        {editState.exercises.length > 0 ? (
          editState.exercises.map((exercise, index) => (
            <ExerciseSection
              key={exercise.id}
              exercise={exercise}
              index={index}
              total={editState.exercises.length}
              mode="edit"
              onUpdate={updateSet}
              onAddSet={addSet}
              onDeleteSet={deleteSet}
              onRemove={removeExercise}
              onMoveUp={() => reorderExercises(index, index - 1)}
              onMoveDown={() => reorderExercises(index, index + 1)}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-600"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-300">No exercises</p>
            <p className="mt-1 text-xs text-gray-500">
              Add exercises to this workout
            </p>
          </div>
        )}

        {/* Add exercise button */}
        <button
          type="button"
          onClick={() => setAddExerciseOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 py-4 text-sm font-medium text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400 active:bg-indigo-950/50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exercise
        </button>
      </div>

      {/* Fixed bottom: Save Changes button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-800 bg-gray-900 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saveError && (
          <p className="mt-2 text-center text-sm text-red-400">{saveError}</p>
        )}
      </div>

      {/* Discard confirm dialog */}
      <DiscardConfirmDialog
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={handleDiscard}
      />

      {/* Exercise picker */}
      <ExercisePicker
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        onSelect={handleAddExercise}
        excludeIds={exerciseIds}
      />
    </div>
  );
}
