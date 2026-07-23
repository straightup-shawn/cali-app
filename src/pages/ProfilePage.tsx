import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useUnitPreference } from '@/hooks/useUnitPreference';
import { useWeeklyVolume } from '@/hooks/useWeeklyVolume';
import { uploadProfilePhoto } from '@/lib/storage';
import { THEMES, getStoredTheme, setStoredTheme } from '@/lib/themes';
import type { ThemeId } from '@/lib/themes';
import { backfillExerciseClassifications } from '@/lib/exercise-backfill';
import type { BackfillProgress } from '@/lib/exercise-backfill';
import BodyweightSection from '@/components/profile/BodyweightSection';
import type { UnitPreference } from '@/lib/units';

// =============================================================================
// Constants
// =============================================================================

const AVATAR_STORAGE_KEY = 'calisthenics-log:avatar-url';

const REST_PRESETS = [30, 60, 90, 120, 180] as const;

// =============================================================================
// Helpers
// =============================================================================

/** Extract ALL photo URLs from a note string containing multiple "📷 http..." lines */
function extractPhotoUrls(notes: string | null): string[] {
  if (!notes) return [];
  const matches = notes.matchAll(/📷\s*(https?:\/\/\S+)/g);
  return Array.from(matches, (m) => m[1]);
}

function getInitials(email: string | undefined): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// =============================================================================
// ProfileAvatar — tappable avatar with upload
// =============================================================================

function ProfileAvatar({ initials }: { initials: string }) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    localStorage.getItem(AVATAR_STORAGE_KEY),
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTap() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user.id, file);
      localStorage.setItem(AVATAR_STORAGE_KEY, url);
      setAvatarUrl(url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      className="relative h-20 w-20 shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
      aria-label="Change profile photo"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile"
          className="h-20 w-20 rounded-full object-cover"
          onError={() => {
            localStorage.removeItem(AVATAR_STORAGE_KEY);
            setAvatarUrl(null);
          }}
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white shadow-lg"
          style={{ boxShadow: '0 10px 15px -3px var(--accent-glow)' }}>
          {initials}
        </div>
      )}
      {/* Camera overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100 active:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white" aria-hidden="true">
          <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.2.32.58.529.984.529h.806a2.25 2.25 0 0 1 2.25 2.25v9.193a2.25 2.25 0 0 1-2.25 2.25H4.401a2.25 2.25 0 0 1-2.25-2.25V8.557a2.25 2.25 0 0 1 2.25-2.25h.806c.404 0 .784-.21.984-.53l.821-1.316a2.06 2.06 0 0 1 2.332-1.39ZM12 10.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
        </svg>
      </div>
      {/* Uploading spinner */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </button>
  );
}

// =============================================================================
// EditableDisplayName — inline editing of display name
// =============================================================================

function EditableDisplayName({ displayName }: { displayName: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    setValue(displayName);
  }, [displayName]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === displayName) {
      setValue(displayName);
      return;
    }
    try {
      await updateProfile.mutateAsync({ display_name: trimmed });
    } catch {
      setValue(displayName);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      save();
    } else if (e.key === 'Escape') {
      setValue(displayName);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full truncate rounded border border-indigo-500 bg-gray-800 px-2 py-1 text-base font-semibold text-gray-100 outline-none"
        maxLength={50}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-left focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
      aria-label="Edit display name"
    >
      <span className="truncate text-base font-semibold text-gray-100">{displayName}</span>
      <svg className="h-3.5 w-3.5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}

// =============================================================================
// UnitPreferenceToggle
// =============================================================================

function UnitPreferenceToggle() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const current: UnitPreference = (profile?.unit_preference as UnitPreference) ?? 'metric';

  async function handleChange(preference: UnitPreference) {
    if (preference === current) return;
    await updateProfile.mutateAsync({ unit_preference: preference });
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-gray-300">Unit System</h2>
      <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-1">
        <button
          type="button"
          onClick={() => handleChange('metric')}
          disabled={updateProfile.isPending}
          aria-pressed={current === 'metric'}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            current === 'metric'
              ? 'btn-accent shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          } disabled:opacity-50`}
        >
          Metric (kg)
        </button>
        <button
          type="button"
          onClick={() => handleChange('imperial')}
          disabled={updateProfile.isPending}
          aria-pressed={current === 'imperial'}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            current === 'imperial'
              ? 'btn-accent shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          } disabled:opacity-50`}
        >
          Imperial (lbs)
        </button>
      </div>
      {updateProfile.isError && (
        <p className="text-sm text-red-400" role="alert">
          Failed to update preference. Please try again.
        </p>
      )}
    </section>
  );
}

// =============================================================================
// DefaultRestDuration — preset buttons for rest timer default
// =============================================================================

function DefaultRestDuration() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const current = profile?.default_rest_seconds ?? 60;

  async function handleSelect(seconds: number) {
    if (seconds === current) return;
    await updateProfile.mutateAsync({ default_rest_seconds: seconds });
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-gray-300">Default Rest Duration</h2>
      <div className="flex flex-wrap gap-2">
        {REST_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSelect(s)}
            disabled={updateProfile.isPending}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
              current === s
                ? 'btn-accent shadow-sm'
                : 'border border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
            } disabled:opacity-50`}
          >
            {s >= 60 ? `${s / 60}m` : `${s}s`}
          </button>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// DisplayNameSetting — text field in settings
// =============================================================================

function DisplayNameSetting() {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? '';
  const [value, setValue] = useState(displayName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(displayName);
  }, [displayName]);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === displayName) return;
    try {
      await updateProfile.mutateAsync({ display_name: trimmed });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setValue(displayName);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-gray-300">Display Name</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          maxLength={50}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Your display name"
        />
        {saved && <span className="self-center text-xs text-green-400">Saved</span>}
      </div>
    </section>
  );
}

// =============================================================================
// PhotoCarousel — horizontal carousel with dots for multi-photo posts
// =============================================================================

function PhotoCarousel({ photoUrls, workoutName }: { photoUrls: string[]; workoutName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newIndex = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(newIndex);
  };

  if (photoUrls.length === 1) {
    return (
      <img
        src={photoUrls[0]}
        alt={workoutName}
        loading="lazy"
        className="w-full object-cover"
        style={{ maxHeight: '500px' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
      >
        {photoUrls.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`${workoutName} photo ${idx + 1}`}
            loading="lazy"
            className="w-full shrink-0 snap-center object-cover"
            style={{ maxHeight: '500px' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ))}
      </div>
      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {photoUrls.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              idx === currentIndex ? 'dot-accent' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
      {/* Counter badge */}
      <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
        {currentIndex + 1}/{photoUrls.length}
      </div>
    </div>
  );
}

// =============================================================================
// PostsTab — Instagram-style stacked feed cards
// =============================================================================

function PostsTab() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: workouts, isLoading } = useWorkouts({ pageSize: 100 });

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const avatarUrl = localStorage.getItem(AVATAR_STORAGE_KEY);

  const photoWorkouts = useMemo(() => {
    if (!workouts) return [];
    return workouts
      .map((w) => ({ ...w, photoUrls: extractPhotoUrls(w.notes) }))
      .filter((w) => w.photoUrls.length > 0);
  }, [workouts]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (photoWorkouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-gray-600" aria-hidden="true">
            <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-400">No workout photos yet</p>
        <p className="mt-1 text-xs text-gray-600">
          Add photos when finishing a workout to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {photoWorkouts.map((w) => {
        const workoutDate = w.completed_at ?? w.started_at;
        const exerciseCount = (w as any).exercise_count ?? 0;
        const duration = w.duration_seconds;

        return (
          <div key={w.id} className="border-b border-gray-800 bg-gray-950">
            {/* Post header — avatar, name, date */}
            <div className="flex items-center gap-3 px-4 py-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {getInitials(user?.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-100">{displayName}</p>
                <p className="text-xs text-gray-500">{formatDate(workoutDate)}</p>
              </div>
            </div>

            {/* Photo(s) — full width with carousel if multiple */}
            <PhotoCarousel photoUrls={w.photoUrls} workoutName={w.name} />

            {/* Post footer — workout info */}
            <div className="px-4 py-3">
              <Link
                to={`/history/${w.id}`}
                className="text-sm font-semibold text-gray-100 hover:text-indigo-400"
              >
                {w.name}
              </Link>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                {exerciseCount > 0 && (
                  <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
                )}
                {duration !== null && duration > 0 && (
                  <span>{formatDuration(duration)}</span>
                )}
              </div>
              {/* Plain text notes (without photo URLs) */}
              {w.notes && (() => {
                const textOnly = w.notes.replace(/📷\s*https?:\/\/\S+/g, '').trim();
                return textOnly ? (
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{textOnly}</p>
                ) : null;
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// StatsTab — weekly stats, totals, streaks
// =============================================================================

function StatsTab() {
  const { data: workouts, isLoading } = useWorkouts({ pageSize: 200 });
  const { preference, weightLabel } = useUnitPreference();
  const { data: weeklyVolumeKg } = useWeeklyVolume();

  const stats = useMemo(() => {
    if (!workouts) return null;

    const completed = workouts.filter((w) => w.completed_at);
    const total = completed.length;

    // This week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = completed.filter((w) => new Date(w.completed_at!) >= weekStart);

    // Streak — count consecutive days back from today with at least one workout
    const uniqueDays = new Set(
      completed.map((w) => new Date(w.completed_at!).toDateString()),
    );

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    // Allow today or yesterday to start the streak
    if (!uniqueDays.has(cursor.toDateString())) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (uniqueDays.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const totalDuration = completed.reduce((sum, w) => sum + (w.duration_seconds ?? 0), 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    return { total, thisWeek: thisWeek.length, streak, avgDuration };
  }, [workouts]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const s = stats ?? { total: 0, thisWeek: 0, streak: 0, avgDuration: 0 };

  const volumeDisplay = weeklyVolumeKg != null && weeklyVolumeKg > 0
    ? (() => {
        const v = preference === 'imperial' ? Math.round(weeklyVolumeKg * 2.20462) : weeklyVolumeKg;
        return v >= 1000 ? `≈${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : `≈${v}`;
      })()
    : '—';

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Workouts" value={String(s.total)} />
        <StatCard label="This Week" value={String(s.thisWeek)} />
        <StatCard label="Current Streak" value={`${s.streak}d`} accent="orange" />
        <StatCard label="Avg Duration" value={formatDuration(s.avgDuration)} />
        <StatCard label={`Week Volume (${weightLabel})`} value={volumeDisplay} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'theme',
}: {
  label: string;
  value: string;
  accent?: 'theme' | 'orange';
}) {
  const colorClass = accent === 'orange' ? 'text-orange-400' : 'text-accent';
  return (
    <div className="glass-card flex flex-col rounded-2xl p-4 shadow-lg shadow-black/20">
      <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      <span className="mt-0.5 text-xs text-gray-400">{label}</span>
    </div>
  );
}

// =============================================================================
// ThemePicker — color theme selector circles
// =============================================================================

function ThemePicker() {
  const [current, setCurrent] = useState<ThemeId>(getStoredTheme());

  function handleSelect(id: ThemeId) {
    setStoredTheme(id);
    setCurrent(id);
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-gray-300">Theme</h2>
      <div className="flex flex-wrap gap-3">
        {Object.values(THEMES).map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleSelect(theme.id as ThemeId)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
              current === theme.id
                ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: theme.accent }}
            aria-label={`${theme.name} theme`}
            aria-pressed={current === theme.id}
          >
            {current === theme.id && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 text-white"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// SettingsTab — expanded with more options
// =============================================================================

// Module-level backfill state (persists across tab switches)
let _backfillRunning = false;
let _backfillProgress: BackfillProgress | null = null;
let _backfillResult: { total: number; succeeded: number; failed: number } | null = null;
const _backfillListeners = new Set<() => void>();

function notifyBackfillListeners() {
  _backfillListeners.forEach((fn) => fn());
}

function useBackfillState() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    _backfillListeners.add(listener);
    return () => { _backfillListeners.delete(listener); };
  }, []);

  return {
    running: _backfillRunning,
    progress: _backfillProgress,
    result: _backfillResult,
  };
}

async function runBackfillAnalysis() {
  if (_backfillRunning) return;
  _backfillRunning = true;
  _backfillResult = null;
  _backfillProgress = null;
  notifyBackfillListeners();

  try {
    const result = await backfillExerciseClassifications((progress) => {
      _backfillProgress = progress;
      notifyBackfillListeners();
    });
    _backfillResult = result;
  } catch {
    _backfillResult = { total: 0, succeeded: 0, failed: -1 };
  } finally {
    _backfillRunning = false;
    _backfillProgress = null;
    notifyBackfillListeners();
  }
}

function SettingsTab() {
  const { signOut } = useAuth();
  const [clearConfirm, setClearConfirm] = useState(false);
  const { running: backfillRunning, progress: backfillProgress, result: backfillResult } = useBackfillState();

  function handleClearLocalData() {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    localStorage.clear();
    setClearConfirm(false);
    window.location.reload();
  }

  return (
    <div className="space-y-6 px-4 py-4">
      <ThemePicker />
      <DisplayNameSetting />
      <DefaultRestDuration />
      <UnitPreferenceToggle />
      <BodyweightSection />

      {/* Exercise AI Analysis */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-300">Exercise Analysis</h2>
        <p className="text-xs text-gray-500">
          Analyze all exercises to estimate bodyweight contributions for accurate volume tracking.
        </p>
        <button
          type="button"
          onClick={runBackfillAnalysis}
          disabled={backfillRunning}
          className="w-full rounded-xl border border-indigo-700 bg-indigo-950/50 px-4 py-2.5 text-sm font-semibold text-indigo-300 transition-all duration-200 hover:bg-indigo-900 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backfillRunning ? 'Analyzing...' : 'Run Analysis'}
        </button>
        {backfillRunning && backfillProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{backfillProgress.current ? `Analyzing: ${backfillProgress.current}` : 'Processing...'}</span>
              <span>{backfillProgress.completed}/{backfillProgress.total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${(backfillProgress.completed / backfillProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        {backfillResult && !backfillRunning && (
          <p className="text-xs text-gray-400">
            {backfillResult.failed === -1
              ? '❌ Analysis failed. Please try again.'
              : backfillResult.total === 0
                ? '✓ All exercises are already analyzed.'
                : `✓ Analyzed ${backfillResult.succeeded}/${backfillResult.total} exercises${backfillResult.failed > 0 ? ` (${backfillResult.failed} failed)` : ''}.`}
          </p>
        )}
      </section>

      {/* About */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-300">About</h2>
        <p className="text-sm text-gray-400">Calisthenics Log v1.0.0</p>
      </section>

      {/* Clear Local Data */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-300">Clear Local Data</h2>
        <button
          type="button"
          onClick={handleClearLocalData}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            clearConfirm
              ? 'border-red-600 bg-red-950 text-red-300 hover:bg-red-900'
              : 'border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          {clearConfirm ? 'Tap again to confirm clear' : 'Clear Local Data'}
        </button>
        <p className="text-xs text-gray-600">Clears cached data from this device. Your account data is safe in the cloud.</p>
      </section>

      {/* Log Out */}
      <button
        type="button"
        onClick={() => signOut()}
        className="w-full rounded-xl border border-red-800 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-950 active:bg-red-900"
      >
        Log Out
      </button>
    </div>
  );
}

// =============================================================================
// ProfilePage
// =============================================================================

type TabId = 'posts' | 'stats' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'stats', label: 'Stats' },
  { id: 'settings', label: 'Settings' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState<TabId>('posts');

  const initials = getInitials(user?.email);
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <h1 className="text-xl font-bold text-gray-100">Profile</h1>
      </header>

      {/* User info section */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          {/* Tappable avatar with upload */}
          <ProfileAvatar initials={initials} />
          <div className="min-w-0 flex-1">
            <EditableDisplayName displayName={displayName} />
            <p className="mt-0.5 truncate text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[52px] z-10 border-b border-gray-800 bg-gray-950">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'posts' && <PostsTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
