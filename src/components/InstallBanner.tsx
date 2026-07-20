import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallBanner() {
  const { canInstall, isDismissed, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall || isDismissed) return null;

  return (
    <div className="mx-4 my-3 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install Calisthenics Log</p>
          <p className="mt-0.5 text-xs text-white/80">
            Add to your home screen for quick access and offline use.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-white/70 hover:text-white active:scale-95 transition-transform"
          aria-label="Dismiss install prompt"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <button
        onClick={promptInstall}
        className="mt-3 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm active:scale-[0.98] transition-transform"
      >
        Install App
      </button>
    </div>
  );
}
