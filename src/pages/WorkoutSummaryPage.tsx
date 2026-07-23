import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { uploadWorkoutPhoto } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import type { SaveWorkoutResult } from '@/hooks/useSaveWorkout';
import type { PRCheck } from '@/lib/personal-records';
import type { RecordType } from '@/types';

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

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PR_TYPE_LABELS: Record<RecordType, string> = {
  max_reps: 'Max Reps',
  max_weight: 'Max Weight',
  max_volume: 'Max Volume',
  longest_hold: 'Longest Hold',
};

function formatPRValue(pr: PRCheck): string {
  switch (pr.recordType) {
    case 'max_reps':
      return `${pr.newValue} reps`;
    case 'max_weight':
      return `${pr.newValue} kg`;
    case 'max_volume':
      return `${pr.newValue} kg`;
    case 'longest_hold':
      return `${pr.newValue}s`;
    default:
      return `${pr.newValue}`;
  }
}

// =============================================================================
// WorkoutSummaryPage
// =============================================================================

export default function WorkoutSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const summaryData = location.state as SaveWorkoutResult | null;
  const { preference, weightLabel } = useUnitPreference();

  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If no summary data, redirect to dashboard
  if (!summaryData) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const { workoutId, workoutName, startedAt, durationSeconds, exerciseCount, totalSets, totalReps, totalVolume, newPRs } = summaryData;

  // Convert volume from kg to user's preferred unit
  const displayVolume = preference === 'imperial'
    ? Math.round(totalVolume * 2.20462)
    : Math.round(totalVolume);
  const volumeLabel = displayVolume >= 1000
    ? `${(displayVolume / 1000).toFixed(1).replace(/\.0$/, '')}k ${weightLabel}`
    : `${displayVolume.toLocaleString()} ${weightLabel}`;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDone = async () => {
    setSaving(true);
    try {
      let photoUrl: string | null = null;

      // Upload photo if one was selected
      if (photoFile && user) {
        try {
          photoUrl = await uploadWorkoutPhoto(workoutId, user.id, photoFile);
        } catch {
          // Photo upload failed — non-critical, continue
        }
      }

      // Build notes content (include photo URL if uploaded)
      let finalNotes = notes.trim();
      if (photoUrl) {
        finalNotes = `${finalNotes}${finalNotes ? '\n\n' : ''}📷 ${photoUrl}`;
      }

      // Save notes to workout
      if (finalNotes) {
        await supabase
          .from('workouts')
          .update({ notes: finalNotes })
          .eq('id', workoutId);
      }
    } catch {
      // Non-critical: don't block navigation
    } finally {
      setSaving(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 px-4 py-6 pb-28">
      {/* Celebration header */}
      <div className="text-center">
        <div className="text-5xl">💪</div>
        <h1 className="mt-3 text-2xl font-bold text-white">Workout Complete!</h1>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(startedAt)} at {formatTime(startedAt)}
        </p>
      </div>

      {/* Workout name */}
      <div className="mt-6 text-center">
        <h2 className="text-lg font-semibold text-gray-200">{workoutName}</h2>
      </div>

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Duration" value={formatDuration(durationSeconds)} icon="⏱️" />
        <StatCard label="Exercises" value={String(exerciseCount)} icon="🏋️" />
        <StatCard label="Sets" value={String(totalSets)} icon="📋" />
        <StatCard label="Reps" value={String(totalReps)} icon="🔁" />
        {totalVolume > 0 && (
          <StatCard
            label="Volume"
            value={volumeLabel}
            icon="📊"
            className="col-span-2"
          />
        )}
      </div>

      {/* Personal Records */}
      {newPRs.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h3 className="text-sm font-bold text-amber-300">
              {newPRs.length} Personal Record{newPRs.length > 1 ? 's' : ''}!
            </h3>
          </div>
          <div className="mt-3 space-y-2">
            {newPRs.map((pr, i) => (
              <div
                key={`${pr.exerciseId}-${pr.recordType}-${i}`}
                className="flex items-center justify-between rounded-lg bg-amber-900/30 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-amber-100">
                    {pr.exerciseName}
                  </p>
                  <p className="text-xs text-amber-300/70">
                    {PR_TYPE_LABELS[pr.recordType]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-200">
                    {formatPRValue(pr)}
                  </p>
                  {pr.previousValue !== null && (
                    <p className="text-xs text-amber-400/60">
                      was {pr.previousValue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo upload area */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-300">Progress Photo</label>
        <div className="mt-2">
          {photoPreview ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-700">
              <img
                src={photoPreview}
                alt="Workout progress"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Remove photo"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 py-8 text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Add Photo</span>
              <span className="text-xs text-gray-500">Optional — tap to take or choose a photo</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Notes textarea */}
      <div className="mt-6">
        <label htmlFor="workout-notes" className="text-sm font-medium text-gray-300">
          Notes
        </label>
        <textarea
          id="workout-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did the workout feel? Any observations..."
          rows={3}
          className="mt-2 block w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Done button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-800 bg-gray-900 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// StatCard Component
// =============================================================================

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  className?: string;
}

function StatCard({ label, value, icon, className = '' }: StatCardProps) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
