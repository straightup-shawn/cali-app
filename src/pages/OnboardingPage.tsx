import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfile } from '@/hooks/useProfile';

type UnitOption = 'metric' | 'imperial';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<UnitOption | null>(null);

  async function handleContinue() {
    if (!selected) return;
    await updateProfile.mutateAsync({
      unit_preference: selected,
      onboarding_complete: true,
    });
    navigate('/dashboard', { state: { welcome: true }, replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Welcome header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome to Calisthenics Log
          </h1>
          <p className="mt-3 text-base text-gray-400">
            Choose your preferred unit system. You can change this later in settings.
          </p>
        </div>

        {/* Unit selection cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelected('metric')}
            className={`flex flex-col items-center rounded-xl border-2 p-6 transition-all active:scale-[0.97] ${
              selected === 'metric'
                ? 'border-indigo-500 bg-indigo-950/50 ring-2 ring-indigo-500'
                : 'border-gray-700 bg-gray-900 hover:border-indigo-600 hover:bg-gray-800 active:bg-gray-800'
            }`}
          >
            <span className="text-4xl" aria-hidden="true">🏋️</span>
            <span className="mt-3 text-lg font-semibold text-gray-100">Metric</span>
            <span className="mt-1 text-sm text-gray-400">kg, cm</span>
          </button>

          <button
            type="button"
            onClick={() => setSelected('imperial')}
            className={`flex flex-col items-center rounded-xl border-2 p-6 transition-all active:scale-[0.97] ${
              selected === 'imperial'
                ? 'border-indigo-500 bg-indigo-950/50 ring-2 ring-indigo-500'
                : 'border-gray-700 bg-gray-900 hover:border-indigo-600 hover:bg-gray-800 active:bg-gray-800'
            }`}
          >
            <span className="text-4xl" aria-hidden="true">💪</span>
            <span className="mt-3 text-lg font-semibold text-gray-100">Imperial</span>
            <span className="mt-1 text-sm text-gray-400">lbs, in</span>
          </button>
        </div>

        {/* Continue button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || updateProfile.isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateProfile.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </span>
          ) : (
            'Continue'
          )}
        </button>

        {/* Error display */}
        {updateProfile.isError && (
          <p className="text-center text-sm text-red-400" role="alert">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
