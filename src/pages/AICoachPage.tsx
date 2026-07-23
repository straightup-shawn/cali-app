import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage, parseRoutineFromResponse } from '@/lib/ai';
import type { AIMessage, GeneratedRoutine } from '@/lib/ai';
import { useCreateExercise } from '@/hooks/useExercises';
import { useCreateRoutine } from '@/hooks/useRoutines';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  routine?: GeneratedRoutine | null;
  routineSaved?: boolean;
  savedRoutineId?: string;
}

// =============================================================================
// Icons
// =============================================================================

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? 'h-5 w-5'} aria-hidden="true">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
    </svg>
  );
}

// =============================================================================
// Typing Indicator
// =============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// =============================================================================
// Routine Card
// =============================================================================

function RoutineCard({
  routine,
  onSave,
  saving,
  saved,
  onStartWorkout,
}: {
  routine: GeneratedRoutine;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  onStartWorkout?: () => void;
}) {
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-gray-800/60 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-100">{routine.routine_name}</h3>
      </div>

      <div className="space-y-2">
        {routine.exercises.map((ex, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-gray-900/50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-200">{ex.name}</p>
              <p className="text-xs text-gray-500">{ex.exercise_type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">
                {ex.sets} × {ex.reps != null ? `${ex.reps} reps` : `${ex.duration_seconds}s`}
              </p>
              <p className="text-xs text-gray-500">{ex.rest_seconds}s rest</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {!saved ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Routine'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartWorkout}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:bg-emerald-700"
          >
            Start Workout
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// AICoachPage
// =============================================================================

export default function AICoachPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startWorkout, discardWorkout } = useActiveWorkout();
  const createExercise = useCreateExercise();
  const createRoutine = useCreateRoutine();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I can help you create workout routines. Tell me what you want to train, and I'll build a routine for you.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savingRoutineId, setSavingRoutineId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send message handler
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build message history for the API (exclude welcome message metadata)
      const apiMessages: AIMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: 'user', content: trimmed });

      const response = await sendChatMessage(apiMessages);
      const routine = parseRoutineFromResponse(response);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: routine ? `Here's your **${routine.routine_name}** routine:` : response,
        routine,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  // Save routine handler
  const handleSaveRoutine = useCallback(async (messageId: string, routine: GeneratedRoutine) => {
    if (!user) return;
    setSavingRoutineId(messageId);

    try {
      const exerciseIds: string[] = [];

      for (const ex of routine.exercises) {
        // Check if exercise already exists (case-insensitive)
        const { data: existing } = await supabase
          .from('exercises')
          .select('id')
          .ilike('name', ex.name)
          .limit(1);

        if (existing && existing.length > 0) {
          exerciseIds.push(existing[0].id);
        } else {
          // Create the exercise
          const newExercise = await createExercise.mutateAsync({
            name: ex.name,
            exercise_type: ex.exercise_type,
            muscle_groups: [],
          });
          exerciseIds.push(newExercise.id);
        }
      }

      // Create the routine with all exercises
      const savedRoutine = await createRoutine.mutateAsync({
        name: routine.routine_name,
        exercises: routine.exercises.map((ex, index) => ({
          exercise_id: exerciseIds[index],
          position: index,
          target_sets: ex.sets,
          target_reps: ex.reps,
          target_duration_seconds: ex.duration_seconds,
          rest_seconds: ex.rest_seconds,
        })),
      });

      // Mark message as saved
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, routineSaved: true, savedRoutineId: savedRoutine.id }
            : m
        )
      );

      // Add success message
      const successMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Routine saved! 🎉 You can start a workout with it right away.',
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save routine';
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Couldn't save the routine: ${errorMsg}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSavingRoutineId(null);
    }
  }, [user, createExercise, createRoutine]);

  // Start workout from saved routine
  const handleStartWorkout = useCallback(async (routineId: string) => {
    try {
      const { data: fullRoutine } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises(
            *,
            exercises(id, name, exercise_type, muscle_groups)
          )
        `)
        .eq('id', routineId)
        .single();

      discardWorkout();
      startWorkout(fullRoutine ? (fullRoutine as any) : undefined);
      navigate('/workout/active');
    } catch {
      discardWorkout();
      startWorkout();
      navigate('/workout/active');
    }
  }, [discardWorkout, startWorkout, navigate]);

  // Handle Enter key
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center gap-2">
          <SparkleIcon className="h-5 w-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-gray-100">AI Coach</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'rounded-br-sm bg-indigo-600 text-white'
                    : 'rounded-bl-sm bg-gray-800 text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                {message.routine && (
                  <RoutineCard
                    routine={message.routine}
                    onSave={() => handleSaveRoutine(message.id, message.routine!)}
                    saving={savingRoutineId === message.id}
                    saved={!!message.routineSaved}
                    onStartWorkout={
                      message.savedRoutineId
                        ? () => handleStartWorkout(message.savedRoutineId!)
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-gray-950/80 px-4 pb-safe backdrop-blur-xl"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a routine..."
            className="flex-1 rounded-full border border-white/10 bg-gray-800/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none backdrop-blur-sm transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-all active:bg-indigo-700 disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
