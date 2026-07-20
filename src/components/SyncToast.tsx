import { useEffect, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export type SyncToastType = 'success' | 'error' | 'info';

export interface SyncToastMessage {
  id: string;
  type: SyncToastType;
  message: string;
}

// =============================================================================
// Toast State (simple pub/sub for cross-component notifications)
// =============================================================================

type ToastListener = (toast: SyncToastMessage) => void;

const listeners: Set<ToastListener> = new Set();

/**
 * Publishes a toast notification. Can be called from anywhere (hooks, utils).
 */
export function showSyncToast(type: SyncToastType, message: string): void {
  const toast: SyncToastMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    message,
  };
  listeners.forEach((listener) => listener(toast));
}

// =============================================================================
// SyncToast Component
// =============================================================================

const TOAST_DURATION_MS = 4000;

/**
 * Renders sync-related toast notifications.
 * Place this component once at the app root level.
 */
export default function SyncToast() {
  const [toasts, setToasts] = useState<SyncToastMessage[]>([]);

  useEffect(() => {
    const handler: ToastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Auto-dismiss toasts after duration
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${getToastStyles(toast.type)}`}
        >
          <div className="flex items-center gap-2">
            <span>{getToastIcon(toast.type)}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getToastStyles(type: SyncToastType): string {
  switch (type) {
    case 'success':
      return 'bg-green-600 text-white';
    case 'error':
      return 'bg-red-600 text-white';
    case 'info':
      return 'bg-blue-600 text-white';
  }
}

function getToastIcon(type: SyncToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'info':
      return 'ℹ';
  }
}
