import { useEffect } from 'react';
import type { ChatSession } from '@/lib/chat-sessions';

interface SessionDrawerProps {
  open: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

/**
 * Formats a date string into a human-readable relative time.
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return 'Yesterday';

  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SessionDrawer({
  open,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: SessionDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close session drawer"
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 inset-x-0 rounded-t-2xl bg-gray-900/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Chat sessions"
      >
        {/* Handle bar */}
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-gray-900/95 backdrop-blur-xl rounded-t-2xl">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="px-4 pb-4">
          {/* New Chat button */}
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>

          {/* Session list */}
          {sessions.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No conversations yet
            </p>
          ) : (
            <ul className="space-y-1" role="list">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <li key={session.id}>
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-3 transition-colors ${
                        isActive
                          ? 'border-l-2 border-indigo-500 bg-indigo-950/30'
                          : 'hover:bg-gray-800/50 active:bg-gray-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(session.id);
                          onClose();
                        }}
                        className="flex-1 min-w-0 text-left"
                        aria-label={`Switch to session: ${session.title}`}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span className="block truncate text-sm font-medium text-gray-100">
                          {session.title}
                        </span>
                      </button>

                      <span className="shrink-0 text-xs text-gray-500">
                        {formatRelativeTime(session.updated_at)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-950/50 active:bg-red-900/50 transition-colors"
                        aria-label={`Delete session: ${session.title}`}
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
