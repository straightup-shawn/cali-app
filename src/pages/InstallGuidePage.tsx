import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

// =============================================================================
// Platform detection
// =============================================================================

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// =============================================================================
// Icons
// =============================================================================

function ShareIcon() {
  return (
    <svg className="inline h-5 w-5 align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="inline h-5 w-5 align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}

// =============================================================================
// InstallGuidePage
// =============================================================================

const DISMISS_KEY = 'isometrix:install-guide-seen';

export function hasSeenInstallGuide(): boolean {
  return localStorage.getItem(DISMISS_KEY) === 'true' || isStandalone();
}

export default function InstallGuidePage() {
  const navigate = useNavigate();
  const [platform] = useState<Platform>(detectPlatform);
  const { canInstall, promptInstall } = useInstallPrompt();

  function handleContinue() {
    localStorage.setItem(DISMISS_KEY, 'true');
    navigate('/register', { replace: true });
  }

  async function handleInstallAndContinue() {
    await promptInstall();
    localStorage.setItem(DISMISS_KEY, 'true');
    navigate('/register', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <img
          src="/branding/wordmark-light.png"
          alt="Isometrix"
          className="mx-auto w-40"
        />

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-white">Add Isometrix to your phone</h1>
          <p className="mt-2 text-sm text-gray-400">
            Isometrix works best as an app. Follow the steps below to add it to your home screen — it takes 10 seconds.
          </p>
        </div>

        {/* Platform-specific instructions */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-5 text-left space-y-4">
          {platform === 'ios' && (
            <>
              <p className="text-sm font-medium text-gray-200">On iPhone / iPad (Safari):</p>
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
                  <span>Tap the <ShareIcon /> Share button at the bottom of Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
                  <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
                  <span>Tap <strong className="text-white">"Add"</strong> in the top right</span>
                </li>
              </ol>
            </>
          )}

          {platform === 'android' && (
            <>
              <p className="text-sm font-medium text-gray-200">On Android (Chrome):</p>
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
                  <span>Tap the <MenuIcon /> three-dot menu in the top right</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
                  <span>Tap <strong className="text-white">"Add to Home screen"</strong> or <strong className="text-white">"Install app"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
                  <span>Tap <strong className="text-white">"Install"</strong> to confirm</span>
                </li>
              </ol>
            </>
          )}

          {platform === 'desktop' && (
            <>
              <p className="text-sm font-medium text-gray-200">On Desktop (Chrome / Edge):</p>
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
                  <span>Click the install icon in the address bar (or three-dot menu)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
                  <span>Click <strong className="text-white">"Install"</strong> to confirm</span>
                </li>
              </ol>
            </>
          )}
        </div>

        {/* Install / Continue buttons */}
        {canInstall ? (
          <button
            type="button"
            onClick={handleInstallAndContinue}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:bg-indigo-700"
          >
            Install App
          </button>
        ) : (
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:bg-indigo-700"
          >
            I've added it — Continue
          </button>
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
