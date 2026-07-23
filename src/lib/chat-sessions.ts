import type { GeneratedRoutine } from './ai';
import type { Json } from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  routine_json: GeneratedRoutine | null;
  routine_saved: boolean;
  saved_routine_id: string | null;
  created_at: string;
}

export interface CreateSessionInput {
  title?: string;
}

export interface CreateMessageInput {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  routine_json?: GeneratedRoutine | null;
}

// --- CRUD Functions ---

export async function fetchSessions(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as ChatSession[];
}

export async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ChatMessage[];
}

export async function createSession(userId: string, title?: string): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, title: title ?? 'New Chat' })
    .select()
    .single();

  if (error) throw error;
  return data as ChatSession;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function createMessage(input: CreateMessageInput): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: input.session_id,
      role: input.role,
      content: input.content,
      routine_json: (input.routine_json ?? null) as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessage;
}

export async function updateMessageRoutineSaved(messageId: string, routineId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ routine_saved: true, saved_routine_id: routineId })
    .eq('id', messageId);

  if (error) throw error;
}

/**
 * Generates a session title from the first user message.
 * Truncates to 50 characters with "..." appended if needed.
 */
export function generateSessionTitle(firstMessage: string): string {
  if (firstMessage.length > 50) {
    return firstMessage.slice(0, 47) + '...';
  }
  return firstMessage;
}
