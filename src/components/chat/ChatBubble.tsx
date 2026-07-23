import type { GeneratedRoutine } from '@/lib/ai';

// =============================================================================
// Types
// =============================================================================

export interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  routineJson: GeneratedRoutine | null;
  routineSaved: boolean;
  onSaveRoutine?: () => void;
  onStartWorkout?: () => void;
  savingRoutine?: boolean;
  persistFailed?: boolean;
}

// =============================================================================
// Icons
// =============================================================================

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? 'h-5 w-5'} aria-hidden="true">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// =============================================================================
// Routine Card (internal)
// =============================================================================

function RoutineCard({
  routine,
  saved,
  saving,
  onSave,
  onStartWorkout,
}: {
  routine: GeneratedRoutine;
  saved: boolean;
  saving: boolean;
  onSave?: () => void;
  onStartWorkout?: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-gray-800/60 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-100">{routine.routine_name}</h3>
      </div>

      <div className="space-y-2">
        {routine.exercises.map((ex, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-gray-900/50 px-3 py-2">
            <p className="text-sm font-medium text-gray-200">{ex.name}</p>
            <p className="text-sm text-gray-300">
              {ex.sets} × {ex.reps != null ? ex.reps : `${ex.duration_seconds}s`}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        {saving ? (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white opacity-70"
          >
            <Spinner />
            Saving…
          </button>
        ) : !saved ? (
          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:bg-indigo-700"
          >
            Save Routine
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartWorkout}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:bg-green-700"
          >
            Start Workout
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ChatBubble Component
// =============================================================================

export default function ChatBubble({
  role,
  content,
  routineJson,
  routineSaved,
  onSaveRoutine,
  onStartWorkout,
  savingRoutine,
  persistFailed,
}: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'rounded-br-md bg-indigo-600 text-white'
              : 'rounded-bl-md border border-white/10 bg-gray-800/60 text-gray-100 backdrop-blur-sm'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{content}</p>

          {routineJson && (
            <RoutineCard
              routine={routineJson}
              saved={routineSaved}
              saving={!!savingRoutine}
              onSave={onSaveRoutine}
              onStartWorkout={onStartWorkout}
            />
          )}
        </div>

        {/* Persist failure indicator */}
        {persistFailed && (
          <span
            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500"
            title="Failed to save"
            aria-label="Message failed to save"
          />
        )}
      </div>
    </div>
  );
}
