import { useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorkout, useDeleteWorkout, useUpdateWorkout, type WorkoutExerciseWithSets, type UpdateSetPayload, type AddSetPayload, type AddExercisePayload, type ReplaceExercisePayload } from '@/hooks/useWorkouts';
import { useWorkoutPersonalRecords } from '@/hooks/usePersonalRecords';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import { useAuth } from '@/context/AuthContext';
import { uploadWorkoutPhoto } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import ExercisePicker from '@/components/ExercisePicker';
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
  bodyweight: 'bg-green-900/50 text-green-300',
  weighted: 'bg-blue-900/50 text-blue-300',
  assisted: 'bg-purple-900/50 text-purple-300',
  duration: 'bg-orange-900/50 text-orange-300',
  static_hold: 'bg-red-900/50 text-red-300',
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
// DeleteConfirmDialog
// =============================================================================

interface DeleteConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteConfirmDialog({ open, onCancel, onConfirm, isDeleting }: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-100">Delete Workout?</h3>
        <p className="mt-2 text-sm text-gray-400">
          This workout and all its data will be permanently deleted. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 active:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SetRowDisplay (view mode)
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
          ? 'border-amber-700 bg-amber-950/50'
          : 'border-gray-700 bg-gray-800'
      }`}
    >
      {/* Set number */}
      <span className="w-6 text-center text-xs font-semibold text-gray-500">
        {set.set_number}
      </span>

      {/* Set data */}
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {showReps && set.reps !== null && (
          <span className="text-gray-100">
            <span className="font-medium">{set.reps}</span>
            <span className="ml-0.5 text-xs text-gray-400">reps</span>
          </span>
        )}
        {showWeight && set.weight_kg !== null && (
          <span className="text-gray-100">
            <span className="font-medium">{formatWeight(set.weight_kg)}</span>
          </span>
        )}
        {showDuration && set.duration_seconds !== null && (
          <span className="text-gray-100">
            <span className="font-medium">{formatDuration(set.duration_seconds)}</span>
          </span>
        )}
        {set.rpe !== null && (
          <span className="text-gray-400 text-xs">
            RPE {set.rpe}
          </span>
        )}
        {set.rir !== null && (
          <span className="text-gray-400 text-xs">
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
// SetRowEdit (edit mode)
// =============================================================================

interface EditSetValues {
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}

interface SetRowEditProps {
  set: ExerciseSetRow;
  exerciseType: ExerciseType;
  editValues: EditSetValues;
  onUpdate: (setId: string, field: keyof EditSetValues, value: number | null) => void;
  onDelete: (setId: string) => void;
  isDeleted: boolean;
}

function SetRowEdit({ set, exerciseType, editValues, onUpdate, onDelete, isDeleted }: SetRowEditProps) {
  const showReps = ['bodyweight', 'weighted', 'assisted'].includes(exerciseType);
  const showWeight = ['weighted', 'assisted'].includes(exerciseType);
  const showDuration = ['duration', 'static_hold'].includes(exerciseType);

  return (
    <div className={`flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 ${isDeleted ? 'opacity-50' : ''}`}>
      {/* Set number */}
      <span className={`w-6 shrink-0 text-center text-xs font-semibold text-gray-500 ${isDeleted ? 'line-through' : ''}`}>
        {set.set_number}
      </span>

      {/* Editable fields */}
      {showReps && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={editValues.reps ?? ''}
            onChange={(e) =>
              onUpdate(set.id, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
            }
            disabled={isDeleted}
            className={`h-9 w-14 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${isDeleted ? 'line-through' : ''}`}
          />
          <span className="text-xs text-gray-500">reps</span>
        </div>
      )}

      {showWeight && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            placeholder="kg"
            value={editValues.weight_kg ?? ''}
            onChange={(e) =>
              onUpdate(set.id, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
            }
            disabled={isDeleted}
            className={`h-9 w-14 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${isDeleted ? 'line-through' : ''}`}
          />
          <span className="text-xs text-gray-500">kg</span>
        </div>
      )}

      {showDuration && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Sec"
            value={editValues.duration_seconds ?? ''}
            onChange={(e) =>
              onUpdate(set.id, 'duration_seconds', e.target.value ? parseInt(e.target.value, 10) : null)
            }
            disabled={isDeleted}
            className={`h-9 w-16 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${isDeleted ? 'line-through' : ''}`}
          />
          <span className="text-xs text-gray-500">sec</span>
        </div>
      )}

      {/* RPE */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          placeholder="RPE"
          step="0.5"
          min="6"
          max="10"
          value={editValues.rpe ?? ''}
          onChange={(e) =>
            onUpdate(set.id, 'rpe', e.target.value ? parseFloat(e.target.value) : null)
          }
          disabled={isDeleted}
          className={`h-9 w-12 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${isDeleted ? 'line-through' : ''}`}
        />
        <span className="text-xs text-gray-500">RPE</span>
      </div>

      {/* Delete / Undo button */}
      <button
        type="button"
        onClick={() => onDelete(set.id)}
        className={`ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          isDeleted
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-red-900/50 text-red-400 hover:bg-red-800/60 active:bg-red-700/60'
        }`}
        title={isDeleted ? 'Undo delete' : 'Delete set'}
      >
        {isDeleted ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3-7 4 14 3-7h4" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
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
  isEditing: boolean;
  editSets: Record<string, EditSetValues>;
  onUpdateSet: (setId: string, field: keyof EditSetValues, value: number | null) => void;
  onDeleteExercise?: (workoutExerciseId: string) => void;
  onReplaceExercise?: (workoutExerciseId: string) => void;
  isMarkedForDelete?: boolean;
  replacementName?: string | null;
  deletedSetIds?: Set<string>;
  onDeleteSet?: (setId: string) => void;
  onAddSet?: (workoutExerciseId: string) => void;
  newSetsForExercise?: EditSetValues[];
  onUpdateNewSet?: (workoutExerciseId: string, index: number, field: keyof EditSetValues, value: number | null) => void;
  onDeleteNewSet?: (workoutExerciseId: string, index: number) => void;
}

function ExerciseSummarySection({ exercise, prRecords, formatWeight, isEditing, editSets, onUpdateSet, onDeleteExercise, onReplaceExercise, isMarkedForDelete, replacementName, deletedSetIds, onDeleteSet, onAddSet, newSetsForExercise, onUpdateNewSet, onDeleteNewSet }: ExerciseSummarySectionProps) {
  const exerciseName = exercise.exercises?.name ?? 'Unknown Exercise';
  const exerciseType = (exercise.exercises?.exercise_type ?? 'bodyweight') as ExerciseType;

  return (
    <div className={`rounded-xl border bg-gray-900 p-4 ${isMarkedForDelete ? 'border-red-700 opacity-50' : replacementName ? 'border-indigo-700' : 'border-gray-800'}`}>
      {/* Exercise header */}
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100">
          {isMarkedForDelete && <span className="mr-1 text-red-400 line-through">{exerciseName}</span>}
          {!isMarkedForDelete && !replacementName && exerciseName}
          {!isMarkedForDelete && replacementName && (
            <>
              <span className="text-gray-500 line-through">{exerciseName}</span>
              <span className="mx-1 text-gray-600">→</span>
              <span className="text-indigo-300">{replacementName}</span>
            </>
          )}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            TYPE_COLORS[exerciseType]
          }`}
        >
          {TYPE_LABELS[exerciseType]}
        </span>
        {/* Edit mode action buttons */}
        {isEditing && !isMarkedForDelete && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReplaceExercise?.(exercise.id)}
              className="flex h-7 items-center gap-1 rounded-md border border-gray-600 px-2 text-xs font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600"
              title="Replace exercise"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Replace
            </button>
            <button
              type="button"
              onClick={() => onDeleteExercise?.(exercise.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-red-900/50 text-red-400 hover:bg-red-800/60 active:bg-red-700/60"
              title="Remove exercise"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {isEditing && isMarkedForDelete && (
          <button
            type="button"
            onClick={() => onDeleteExercise?.(exercise.id)}
            className="flex h-7 items-center gap-1 rounded-md border border-gray-600 px-2 text-xs font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600"
            title="Undo remove"
          >
            Undo
          </button>
        )}
      </div>

      {/* Sets */}
      {!isMarkedForDelete && (
        <div className="mt-3 space-y-1.5">
          {exercise.exercise_sets.map((set) =>
            isEditing ? (
              <SetRowEdit
                key={set.id}
                set={set}
                exerciseType={exerciseType}
                editValues={editSets[set.id] ?? { reps: set.reps, weight_kg: set.weight_kg, duration_seconds: set.duration_seconds, rpe: set.rpe }}
                onUpdate={onUpdateSet}
                onDelete={onDeleteSet ?? (() => {})}
                isDeleted={deletedSetIds?.has(set.id) ?? false}
              />
            ) : (
              <SetRowDisplay
                key={set.id}
                set={set}
                exerciseType={exerciseType}
                isPR={setHasPR(set, exercise.exercise_id, prRecords)}
                formatWeight={formatWeight}
              />
            )
          )}

          {/* New sets (pending save) */}
          {isEditing && newSetsForExercise && newSetsForExercise.map((newSet, idx) => (
            <div key={`new-set-${idx}`} className="flex items-center gap-2 rounded-lg border border-dashed border-indigo-600 bg-gray-800 px-3 py-2">
              <span className="w-6 shrink-0 text-center text-xs font-semibold text-indigo-400">
                {exercise.exercise_sets.length + idx + 1}
              </span>

              {['bodyweight', 'weighted', 'assisted'].includes(exerciseType) && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={newSet.reps ?? ''}
                    onChange={(e) =>
                      onUpdateNewSet?.(exercise.id, idx, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className="h-9 w-14 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">reps</span>
                </div>
              )}

              {['weighted', 'assisted'].includes(exerciseType) && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    value={newSet.weight_kg ?? ''}
                    onChange={(e) =>
                      onUpdateNewSet?.(exercise.id, idx, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="h-9 w-14 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">kg</span>
                </div>
              )}

              {['duration', 'static_hold'].includes(exerciseType) && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Sec"
                    value={newSet.duration_seconds ?? ''}
                    onChange={(e) =>
                      onUpdateNewSet?.(exercise.id, idx, 'duration_seconds', e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className="h-9 w-16 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">sec</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="RPE"
                  step="0.5"
                  min="6"
                  max="10"
                  value={newSet.rpe ?? ''}
                  onChange={(e) =>
                    onUpdateNewSet?.(exercise.id, idx, 'rpe', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="h-9 w-12 rounded-md border border-gray-700 bg-gray-800 text-center text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-xs text-gray-500">RPE</span>
              </div>

              {/* Remove new set */}
              <button
                type="button"
                onClick={() => onDeleteNewSet?.(exercise.id, idx)}
                className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-900/50 text-red-400 hover:bg-red-800/60 active:bg-red-700/60"
                title="Remove set"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add Set button */}
          {isEditing && (
            <button
              type="button"
              onClick={() => onAddSet?.(exercise.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-600 px-3 py-2 text-xs font-medium text-gray-400 hover:border-indigo-600 hover:text-indigo-400 active:bg-gray-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Set
            </button>
          )}

          {exercise.exercise_sets.length === 0 && (!newSetsForExercise || newSetsForExercise.length === 0) && (
            <p className="py-2 text-center text-xs text-gray-500">No sets recorded</p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// WorkoutDetailPage
// =============================================================================
// NotesPhotoSection — inline editable notes and photo for past workouts
// =============================================================================

interface NotesPhotoSectionProps {
  workoutId: string;
  notes: string | null;
  isEditing: boolean;
}

function NotesPhotoSection({ workoutId, notes }: NotesPhotoSectionProps) {
  const { user } = useAuth();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract photo URL and text from notes
  const photoUrl = notes?.match(/📷 (https?:\/\/\S+)/)?.[1] ?? null;
  const textNotes = notes?.replace(/📷 https?:\/\/\S+/g, '').trim() ?? '';

  const handleStartEditNotes = () => {
    setNotesValue(textNotes);
    setEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const photoPart = photoUrl ? `\n\n📷 ${photoUrl}` : '';
      const finalNotes = notesValue.trim() + photoPart;
      await supabase.from('workouts').update({ notes: finalNotes || null }).eq('id', workoutId);
      setEditingNotes(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeletePhoto = async () => {
    setSaving(true);
    try {
      const newNotes = textNotes || null;
      await supabase.from('workouts').update({ notes: newNotes }).eq('id', workoutId);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setSaving(true);
    try {
      const url = await uploadWorkoutPhoto(workoutId, user.id, file);
      const photoPart = `📷 ${url}`;
      const finalNotes = textNotes ? `${textNotes}\n\n${photoPart}` : photoPart;
      await supabase.from('workouts').update({ notes: finalNotes }).eq('id', workoutId);
      setPhotoPreview(null);
    } catch {
      setPhotoPreview(null);
    }
    setSaving(false);
  };

  const displayPhoto = photoPreview ?? photoUrl;

  return (
    <div className="mx-4 mt-4 space-y-3">
      {/* Photo section */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400 uppercase">Photo</p>
          <div className="flex gap-2">
            {displayPhoto && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={saving}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              {displayPhoto ? 'Replace' : 'Add Photo'}
            </button>
          </div>
        </div>
        {displayPhoto && (
          <img
            src={displayPhoto}
            alt="Workout photo"
            className="mt-2 w-full rounded-lg object-cover max-h-64"
          />
        )}
        {!displayPhoto && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 py-6 text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-400"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Add Photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleAddPhoto}
          className="hidden"
        />
      </div>

      {/* Notes section */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
          {!editingNotes && (
            <button
              type="button"
              onClick={handleStartEditNotes}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {textNotes ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="mt-2">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              placeholder="How did the workout feel?..."
              className="block w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingNotes(false)}
                className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={saving}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
            {textNotes || <span className="text-gray-500 italic">No notes</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workout, isLoading, error } = useWorkout(id);
  const { data: prRecords } = useWorkoutPersonalRecords(id);
  const { formatWeight } = useUnitPreference();

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteWorkout = useDeleteWorkout();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSets, setEditSets] = useState<Record<string, EditSetValues>>({});
  const updateWorkout = useUpdateWorkout();

  // Exercise management state (edit mode)
  const [deletedExerciseIds, setDeletedExerciseIds] = useState<Set<string>>(new Set());
  const [addedExercises, setAddedExercises] = useState<(AddExercisePayload & { _name: string })[]>([]);
  const [replacedExercises, setReplacedExercises] = useState<(ReplaceExercisePayload & { _name: string })[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'add' | 'replace'>('add');
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  // Set-level management state (edit mode)
  const [deletedSetIds, setDeletedSetIds] = useState<Set<string>>(new Set());
  const [newSets, setNewSets] = useState<Record<string, EditSetValues[]>>({});

  const handleStartEdit = useCallback(() => {
    if (!workout) return;
    setEditName(workout.name);
    // Initialize edit values from current set data
    const setsMap: Record<string, EditSetValues> = {};
    for (const exercise of workout.workout_exercises ?? []) {
      for (const set of exercise.exercise_sets) {
        setsMap[set.id] = {
          reps: set.reps,
          weight_kg: set.weight_kg,
          duration_seconds: set.duration_seconds,
          rpe: set.rpe,
        };
      }
    }
    setEditSets(setsMap);
    setDeletedExerciseIds(new Set());
    setAddedExercises([]);
    setReplacedExercises([]);
    setDeletedSetIds(new Set());
    setNewSets({});
    setIsEditing(true);
  }, [workout]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditSets({});
    setEditName('');
    setDeletedExerciseIds(new Set());
    setAddedExercises([]);
    setReplacedExercises([]);
    setDeletedSetIds(new Set());
    setNewSets({});
  }, []);

  const handleUpdateSet = useCallback((setId: string, field: keyof EditSetValues, value: number | null) => {
    setEditSets((prev) => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: value,
      },
    }));
  }, []);

  // Toggle delete for a set
  const handleToggleDeleteSet = useCallback((setId: string) => {
    setDeletedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  }, []);

  // Add a new set to an exercise
  const handleAddSet = useCallback((workoutExerciseId: string) => {
    setNewSets((prev) => ({
      ...prev,
      [workoutExerciseId]: [
        ...(prev[workoutExerciseId] ?? []),
        { reps: null, weight_kg: null, duration_seconds: null, rpe: null },
      ],
    }));
  }, []);

  // Update a new set's field
  const handleUpdateNewSet = useCallback((workoutExerciseId: string, index: number, field: keyof EditSetValues, value: number | null) => {
    setNewSets((prev) => {
      const exerciseSets = [...(prev[workoutExerciseId] ?? [])];
      exerciseSets[index] = { ...exerciseSets[index], [field]: value };
      return { ...prev, [workoutExerciseId]: exerciseSets };
    });
  }, []);

  // Remove a new set (before save)
  const handleDeleteNewSet = useCallback((workoutExerciseId: string, index: number) => {
    setNewSets((prev) => {
      const exerciseSets = (prev[workoutExerciseId] ?? []).filter((_, i) => i !== index);
      return { ...prev, [workoutExerciseId]: exerciseSets };
    });
  }, []);

  // Toggle delete for an exercise
  const handleToggleDeleteExercise = useCallback((workoutExerciseId: string) => {
    setDeletedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(workoutExerciseId)) {
        next.delete(workoutExerciseId);
      } else {
        next.add(workoutExerciseId);
      }
      return next;
    });
  }, []);

  // Open picker for adding a new exercise
  const handleOpenAddExercise = useCallback(() => {
    setPickerMode('add');
    setReplaceTargetId(null);
    setExercisePickerOpen(true);
  }, []);

  // Open picker for replacing an exercise
  const handleOpenReplaceExercise = useCallback((workoutExerciseId: string) => {
    setPickerMode('replace');
    setReplaceTargetId(workoutExerciseId);
    setExercisePickerOpen(true);
  }, []);

  // Handle exercise selected from picker
  const handleExerciseSelected = useCallback((exercise: { id: string; name: string; exercise_type: string }) => {
    if (pickerMode === 'add') {
      const currentExerciseCount = (workout?.workout_exercises?.length ?? 0) + addedExercises.length;
      setAddedExercises((prev) => [
        ...prev,
        {
          exercise_id: exercise.id,
          position: currentExerciseCount,
          sets: [{ reps: null, weight_kg: null, duration_seconds: null, rpe: null }],
          _name: exercise.name,
        },
      ]);
    } else if (pickerMode === 'replace' && replaceTargetId) {
      // Remove any existing replacement for the same target
      setReplacedExercises((prev) => [
        ...prev.filter((r) => r.workout_exercise_id !== replaceTargetId),
        { workout_exercise_id: replaceTargetId, new_exercise_id: exercise.id, _name: exercise.name },
      ]);
    }
    setExercisePickerOpen(false);
  }, [pickerMode, replaceTargetId, workout, addedExercises.length]);

  // Remove a newly added exercise (before save)
  const handleRemoveAddedExercise = useCallback((index: number) => {
    setAddedExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!workout || !id) return;

    // Build the sets payload - only include sets that actually changed
    const changedSets: UpdateSetPayload[] = [];
    for (const exercise of workout.workout_exercises ?? []) {
      // Skip sets of deleted exercises
      if (deletedExerciseIds.has(exercise.id)) continue;
      for (const set of exercise.exercise_sets) {
        const edited = editSets[set.id];
        if (!edited) continue;
        const changes: Partial<UpdateSetPayload> = {};
        if (edited.reps !== set.reps) changes.reps = edited.reps;
        if (edited.weight_kg !== set.weight_kg) changes.weight_kg = edited.weight_kg;
        if (edited.duration_seconds !== set.duration_seconds) changes.duration_seconds = edited.duration_seconds;
        if (edited.rpe !== set.rpe) changes.rpe = edited.rpe;

        if (Object.keys(changes).length > 0) {
          changedSets.push({ id: set.id, ...changes });
        }
      }
    }

    try {
      await updateWorkout.mutateAsync({
        workoutId: id,
        name: editName !== workout.name ? editName : undefined,
        sets: changedSets.length > 0 ? changedSets : undefined,
        deleteSets: deletedSetIds.size > 0 ? Array.from(deletedSetIds) : undefined,
        addSets: (() => {
          const allNewSets: AddSetPayload[] = [];
          for (const exercise of workout.workout_exercises ?? []) {
            const exerciseNewSets = newSets[exercise.id];
            if (!exerciseNewSets || exerciseNewSets.length === 0) continue;
            const existingCount = exercise.exercise_sets.filter((s) => !deletedSetIds.has(s.id)).length;
            for (let i = 0; i < exerciseNewSets.length; i++) {
              allNewSets.push({
                workout_exercise_id: exercise.id,
                set_number: existingCount + i + 1,
                reps: exerciseNewSets[i].reps,
                weight_kg: exerciseNewSets[i].weight_kg,
                duration_seconds: exerciseNewSets[i].duration_seconds,
                rpe: exerciseNewSets[i].rpe,
              });
            }
          }
          return allNewSets.length > 0 ? allNewSets : undefined;
        })(),
        deleteExercises: deletedExerciseIds.size > 0 ? Array.from(deletedExerciseIds) : undefined,
        addExercises: addedExercises.length > 0
          ? addedExercises.map(({ _name, ...rest }) => rest)
          : undefined,
        replaceExercises: replacedExercises.length > 0
          ? replacedExercises.map(({ _name, ...rest }) => rest)
          : undefined,
      });

      setIsEditing(false);
      setDeletedExerciseIds(new Set());
      setAddedExercises([]);
      setReplacedExercises([]);
      setDeletedSetIds(new Set());
      setNewSets({});
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [workout, id, editName, editSets, updateWorkout, deletedExerciseIds, addedExercises, replacedExercises, deletedSetIds, newSets]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!id) return;
    await deleteWorkout.mutateAsync(id);
    navigate('/history');
  }, [id, deleteWorkout, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Workout not found'}
        </p>
        <Link
          to="/history"
          className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Back to History
        </Link>
      </div>
    );
  }

  const records = prRecords ?? [];
  const exercises = workout.workout_exercises ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/history"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
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
            Back
          </Link>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 active:bg-indigo-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 active:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Workout title */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xl font-bold text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        ) : (
          <h1 className="mt-2 text-xl font-bold text-gray-100">{workout.name}</h1>
        )}

        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
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
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
          <p className="text-lg font-bold text-gray-100">{exercises.length}</p>
          <p className="text-xs text-gray-400">Exercises</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
          <p className="text-lg font-bold text-gray-100">
            {exercises.reduce((sum, ex) => sum + ex.exercise_sets.length, 0)}
          </p>
          <p className="text-xs text-gray-400">Total Sets</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{records.length}</p>
          <p className="text-xs text-gray-400">PRs</p>
        </div>
      </div>

      {/* Notes & Photo — editable */}
      <NotesPhotoSection
        workoutId={id!}
        notes={workout.notes}
        isEditing={isEditing}
      />

      {/* Exercise list */}
      <div className="flex-1 space-y-4 px-4 pt-4">
        {exercises.map((exercise) => (
          <ExerciseSummarySection
            key={exercise.id}
            exercise={exercise}
            prRecords={records}
            formatWeight={formatWeight}
            isEditing={isEditing}
            editSets={editSets}
            onUpdateSet={handleUpdateSet}
            onDeleteExercise={handleToggleDeleteExercise}
            onReplaceExercise={handleOpenReplaceExercise}
            isMarkedForDelete={deletedExerciseIds.has(exercise.id)}
            replacementName={replacedExercises.find((r) => r.workout_exercise_id === exercise.id)?._name ?? null}
            deletedSetIds={deletedSetIds}
            onDeleteSet={handleToggleDeleteSet}
            onAddSet={handleAddSet}
            newSetsForExercise={newSets[exercise.id]}
            onUpdateNewSet={handleUpdateNewSet}
            onDeleteNewSet={handleDeleteNewSet}
          />
        ))}

        {/* Newly added exercises (pending save) */}
        {isEditing && addedExercises.length > 0 && (
          <>
            {addedExercises.map((added, index) => (
              <div key={`added-${index}`} className="rounded-xl border border-dashed border-indigo-600 bg-gray-900 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-indigo-400">NEW</span>
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100">
                    {added._name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddedExercise(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-red-900/50 text-red-400 hover:bg-red-800/60 active:bg-red-700/60"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">1 empty set will be added</p>
              </div>
            ))}
          </>
        )}

        {/* Add Exercise button (edit mode) */}
        {isEditing && (
          <button
            type="button"
            onClick={handleOpenAddExercise}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 px-4 py-4 text-sm font-medium text-gray-400 hover:border-indigo-600 hover:text-indigo-400 active:bg-gray-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Exercise
          </button>
        )}

        {exercises.length === 0 && !isEditing && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No exercises in this workout</p>
          </div>
        )}
      </div>

      {/* Exercise picker modal */}
      <ExercisePicker
        open={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        onSelect={handleExerciseSelected}
      />

      {/* Edit mode footer */}
      {isEditing && (
        <div className="sticky bottom-0 border-t border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={updateWorkout.isPending}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateWorkout.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
            >
              {updateWorkout.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteWorkout.isPending}
      />
    </div>
  );
}
