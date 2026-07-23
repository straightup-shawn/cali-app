import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  useChatSessions,
  useChatMessages,
  useCreateSession,
  useDeleteSession,
  useSendMessage,
} from '@/hooks/useChatSessions';
import { updateMessageRoutineSaved } from '@/lib/chat-sessions';
import type { ChatMessage } from '@/lib/chat-sessions';
import type { GeneratedRoutine } from '@/lib/ai';

import { useCreateExercise } from '@/hooks/useExercises';
import { useCreateRoutine } from '@/hooks/useRoutines';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { supabase } from '@/lib/supabase';

import ChatBubble from '@/components/chat/ChatBubble';
import SessionDrawer from '@/components/chat/SessionDrawer';

// =============================================================================
// Constants
// =============================================================================

const WELCOME_MESSAGE =
  "Hi! I'm your AI Coach. I can help you create workout routines, suggest exercises, or answer fitness questions. What would you like to work on?";

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

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

// =============================================================================
// Typing Indicator
// =============================================================================

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-gray-800/60 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AICoachPage
// =============================================================================

export default function AICoachPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startWorkout, discardWorkout } = useActiveWorkout();
  const createExercise = useCreateExercise();
  const createRoutine = useCreateRoutine();

  // Session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);

  // Hooks
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: messages, isLoading: messagesLoading } = useChatMessages(activeSessionId);
  const createSessionMutation = useCreateSession();
  const deleteSessionMutation = useDeleteSession();
  const sendMessageMutation = useSendMessage();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // ─── Initialize active session on mount ────────────────────────────────────
  useEffect(() => {
    if (initializedRef.current || sessionsLoading) return;
    if (!sessions) return;

    initializedRef.current = true;

    if (sessions.length > 0) {
      // Set most recent session as active
      setActiveSessionId(sessions[0].id);
    } else {
      // No sessions exist — auto-create one
      createSessionMutation.mutateAsync({}).then((newSession) => {
        setActiveSessionId(newSession.id);
      });
    }
  }, [sessions, sessionsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending || !activeSessionId) return;

    setInput('');
    setIsSending(true);

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: activeSessionId,
        content: trimmed,
      });
    } catch {
      // Error handling is already done by TanStack Query
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, activeSessionId, sendMessageMutation]);

  // ─── Session drawer handlers ───────────────────────────────────────────────
  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleNewChat = useCallback(async () => {
    const newSession = await createSessionMutation.mutateAsync({});
    setActiveSessionId(newSession.id);
  }, [createSessionMutation]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const isActive = sessionId === activeSessionId;

    // Delete the session
    deleteSessionMutation.mutate(sessionId);

    if (isActive) {
      // Create a new session to replace the deleted active one
      const newSession = await createSessionMutation.mutateAsync({});
      setActiveSessionId(newSession.id);
    }
  }, [activeSessionId, deleteSessionMutation, createSessionMutation]);

  // ─── Routine saving ────────────────────────────────────────────────────────
  const handleSaveRoutine = useCallback(async (message: ChatMessage) => {
    if (!message.routine_json) return;
    const routine: GeneratedRoutine = message.routine_json;

    setSavingMessageId(message.id);

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
          const newExercise = await createExercise.mutateAsync({
            name: ex.name,
            exercise_type: ex.exercise_type,
            muscle_groups: [],
          });
          exerciseIds.push(newExercise.id);
        }
      }

      // Create the routine
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

      // Persist the saved state to the message
      await updateMessageRoutineSaved(message.id, savedRoutine.id);

      // Invalidate to refresh messages with updated routine_saved state
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    } catch (error) {
      console.error('Failed to save routine:', error);
    } finally {
      setSavingMessageId(null);
    }
  }, [activeSessionId, createExercise, createRoutine, queryClient]);

  // ─── Start workout from saved routine ──────────────────────────────────────
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

  // ─── Enter key handler ─────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ─── Loading: sessions still loading ───────────────────────────────────────
  if (sessionsLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  // ─── Loading: creating first session ───────────────────────────────────────
  if (!activeSessionId) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Starting new conversation...</p>
        </div>
      </div>
    );
  }

  // ─── Build display messages (with welcome if empty) ────────────────────────
  const displayMessages: ChatMessage[] = messages && messages.length > 0
    ? messages
    : [];

  const showWelcome = !messagesLoading && displayMessages.length === 0;

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Open chat sessions"
          >
            <ListIcon />
          </button>

          <h1 className="text-lg font-bold text-gray-100">AI Coach</h1>

          <Link
            to="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Back to dashboard"
          >
            <BackIcon />
          </Link>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="space-y-4">
          {/* Loading messages spinner */}
          {messagesLoading && (
            <div className="flex justify-center py-8">
              <svg className="h-6 w-6 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {/* Welcome message (client-side only, not persisted) */}
          {showWelcome && (
            <ChatBubble
              role="assistant"
              content={WELCOME_MESSAGE}
              routineJson={null}
              routineSaved={false}
            />
          )}

          {/* Persisted messages */}
          {displayMessages.map((msg) => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              routineJson={msg.routine_json}
              routineSaved={msg.routine_saved}
              savingRoutine={savingMessageId === msg.id}
              onSaveRoutine={
                msg.routine_json && !msg.routine_saved
                  ? () => handleSaveRoutine(msg)
                  : undefined
              }
              onStartWorkout={
                msg.routine_saved && msg.saved_routine_id
                  ? () => handleStartWorkout(msg.saved_routine_id!)
                  : undefined
              }
            />
          ))}

          {/* Typing indicator while AI is responding */}
          {isSending && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center gap-2 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI coach..."
            className="flex-1 rounded-full border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            disabled={isSending}
            aria-label="Chat message input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-all active:bg-indigo-700 disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Session Drawer */}
      <SessionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions ?? []}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}
