import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSessions,
  fetchMessages,
  createSession,
  deleteSession,
  updateSessionTitle,
  createMessage,
  generateSessionTitle,
  type ChatSession,
  type ChatMessage,
} from '@/lib/chat-sessions';
import {
  sendChatMessage,
  parseRoutineFromResponse,
  buildContextMessages,
  SYSTEM_PROMPT,
} from '@/lib/ai';

/**
 * Fetches all chat sessions for the current user, ordered by updated_at desc.
 * Enabled only when user is authenticated.
 */
export function useChatSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => fetchSessions(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

/**
 * Fetches all messages for a given session.
 * Enabled only when sessionId is non-null.
 */
export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => fetchMessages(sessionId!),
    enabled: sessionId !== null,
  });
}

/**
 * Creates a new session. On success, invalidates the session list.
 */
export function useCreateSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { title?: string }) => {
      if (!user) throw new Error('No authenticated user');
      return createSession(user.id, input.title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

/**
 * Deletes a session. Optimistically removes it from the cache,
 * rolling back on error.
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onMutate: async (sessionId: string) => {
      await queryClient.cancelQueries({ queryKey: ['chat-sessions'] });

      const previousSessions = queryClient.getQueryData<ChatSession[]>(['chat-sessions']);

      queryClient.setQueryData<ChatSession[]>(['chat-sessions'], (old) =>
        old ? old.filter((s) => s.id !== sessionId) : []
      );

      return { previousSessions };
    },
    onError: (_err, _sessionId, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(['chat-sessions'], context.previousSessions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

/**
 * Updates a session's title. Invalidates session list on success.
 */
export function useUpdateSessionTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateSessionTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

/**
 * Sends a user message:
 * 1. Persists user message
 * 2. Builds context from last 20 messages
 * 3. Calls AI with context
 * 4. Parses routine from response
 * 5. Persists assistant response
 * 6. Updates session title on first user message
 * 7. Invalidates relevant queries
 * Returns the assistant ChatMessage.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }): Promise<ChatMessage> => {
      // 1. Persist the user message
      await createMessage({
        session_id: sessionId,
        role: 'user',
        content,
      });

      // 2. Get existing messages from cache or re-fetch
      let messages =
        queryClient.getQueryData<ChatMessage[]>(['chat-messages', sessionId]) ?? [];

      // If cache was empty, re-fetch
      if (messages.length === 0) {
        messages = await fetchMessages(sessionId);
      }

      // 3. Build context with system prompt and last 20 messages
      const contextMessages = buildContextMessages(messages, SYSTEM_PROMPT);

      // 4. Call AI with context (cast to AIMessage format)
      const aiResponse = await sendChatMessage(
        contextMessages.slice(1).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      );

      // 5. Parse routine JSON from response
      const routineJson = parseRoutineFromResponse(aiResponse);

      // 6. Persist assistant response
      const assistantMessage = await createMessage({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        routine_json: routineJson,
      });

      // 7. If first user message in session, update session title
      const userMessages = messages.filter((m) => m.role === 'user');
      if (userMessages.length <= 1) {
        const title = generateSessionTitle(content);
        await updateSessionTitle(sessionId, title);
      }

      return assistantMessage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}
