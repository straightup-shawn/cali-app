import { useAuth } from '@/context/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import type { UnitPreference } from '@/lib/units';
import BodyweightSection from '@/components/profile/BodyweightSection';

// =============================================================================
// UnitPreferenceToggle — metric/imperial switch that updates profile
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
      <h2 className="text-sm font-medium text-gray-700">Unit System</h2>
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => handleChange('metric')}
          disabled={updateProfile.isPending}
          aria-pressed={current === 'metric'}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            current === 'metric'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
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
              : 'text-gray-600 hover:text-gray-900'
          } disabled:opacity-50`}
        >
          Imperial (lbs)
        </button>
      </div>
      {updateProfile.isError && (
        <p className="text-sm text-red-600" role="alert">
          Failed to update preference. Please try again.
        </p>
      )}
    </section>
  );
}

// =============================================================================
// ProfilePage — user info, unit toggle, bodyweight section, logout
// =============================================================================

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="mx-auto max-w-lg space-y-8 p-4 pb-24">
      <h1 className="text-xl font-bold text-gray-900">Profile</h1>

      {/* User info section */}
      <section className="space-y-1">
        <h2 className="text-sm font-medium text-gray-700">Account</h2>
        <p className="text-base text-gray-900">{user?.email ?? '—'}</p>
      </section>

      {/* Unit preference toggle */}
      <UnitPreferenceToggle />

      {/* Bodyweight tracking section */}
      <BodyweightSection />

      {/* Logout button */}
      <button
        type="button"
        onClick={() => signOut()}
        className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 active:bg-red-100"
      >
        Log Out
      </button>
    </div>
  );
}
