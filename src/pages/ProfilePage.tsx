import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import BodyweightSection from '@/components/profile/BodyweightSection';
import type { UnitPreference } from '@/lib/units';

// =============================================================================
// Helpers
// =============================================================================

/** Extract a photo URL from a note string containing "📷 http..." */
function extractPhotoUrl(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/📷\s*(https?:\/\/\S+)/);
  return match ? match[1] : null;
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
              ? 'bg-indigo-600 text-white shadow-sm'
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
              ? 'bg-indigo-600 text-white shadow-sm'
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
// PostsTab — Instagram-style 3-column photo grid
// =============================================================================

function PostsTab() {
  // Fetch all workouts and extract those with photos
  const { data: workouts, isLoading } = useWorkouts({ pageSize: 100 });

  const photoWorkouts = useMemo(() => {
    if (!workouts) return [];
    return workouts
      .map((w) => ({ ...w, photoUrl: extractPhotoUrl(w.notes) }))
      .filter((w) => w.photoUrl !== null) as (typeof workouts[0] & { photoUrl: string })[];
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
          Add photos by including 📷 followed by an image URL in workout notes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {photoWorkouts.map((w) => (
        <Link
          key={w.id}
          to={`/history/${w.id}`}
          className="relative aspect-square overflow-hidden bg-gray-800"
          aria-label={`${w.name} — ${formatDate(w.completed_at ?? w.started_at)}`}
        >
          <img
            src={w.photoUrl}
            alt={w.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 active:scale-95"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Overlay gradient on hover/focus */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity active:opacity-100" />
        </Link>
      ))}
    </div>
  );
}

// =============================================================================
// StatsTab — weekly stats, totals, streaks
// =============================================================================

function StatsTab() {
  const { data: workouts, isLoading } = useWorkouts({ pageSize: 200 });

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

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Workouts" value={String(s.total)} />
        <StatCard label="This Week" value={String(s.thisWeek)} />
        <StatCard label="Current Streak" value={`${s.streak}d`} accent="orange" />
        <StatCard label="Avg Duration" value={formatDuration(s.avgDuration)} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'indigo',
}: {
  label: string;
  value: string;
  accent?: 'indigo' | 'orange';
}) {
  const colorClass = accent === 'orange' ? 'text-orange-400' : 'text-indigo-400';
  return (
    <div className="glass-card flex flex-col rounded-2xl p-4 shadow-lg shadow-black/20">
      <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      <span className="mt-0.5 text-xs text-gray-400">{label}</span>
    </div>
  );
}

// =============================================================================
// SettingsTab
// =============================================================================

function SettingsTab() {
  const { signOut } = useAuth();

  return (
    <div className="space-y-6 px-4 py-4">
      <UnitPreferenceToggle />
      <BodyweightSection />
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
          {/* Avatar circle */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-100">{displayName}</p>
            <p className="truncate text-sm text-gray-400">{user?.email}</p>
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
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
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
