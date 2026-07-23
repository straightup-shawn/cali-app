# Implementation Plan: AI Chat Sessions

## Overview

Convert the existing single-conversation AI Coach into a multi-session chat system with Supabase persistence, a session management drawer, and context windowing. The implementation builds incrementally: database first, then data layer, then UI refactor.

## Tasks

- [x] 1. Database migration and type definitions
  - [x] 1.1 Create Supabase migration for chat_sessions and chat_messages tables
    - Create `supabase/migrations/00004_chat_sessions.sql`
    - Define `chat_sessions` table with id, user_id, title, created_at, updated_at
    - Define `chat_messages` table with id, session_id, role, content, routine_json, routine_saved, saved_routine_id, created_at
    - Add indexes on user_id, updated_at, session_id, created_at
    - Add trigger for auto-updating `updated_at` on chat_sessions
    - Enable RLS with policies for both tables (select, insert, update, delete restricted to owning user)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 Add TypeScript types for chat tables
    - Add `ChatSession` and `ChatMessage` interfaces to a new `src/lib/chat-sessions.ts` file
    - Include `CreateSessionInput` and `CreateMessageInput` types
    - Add the `GeneratedRoutine` import for routine_json typing
    - _Requirements: 2.1, 2.2_

- [x] 2. Data service layer
  - [x] 2.1 Implement Supabase CRUD functions in `src/lib/chat-sessions.ts`
    - `fetchSessions(userId)` — select all sessions ordered by updated_at desc
    - `fetchMessages(sessionId)` — select all messages for a session ordered by created_at asc
    - `createSession(userId, title?)` — insert a new session with default title "New Chat"
    - `deleteSession(sessionId)` — delete a session (messages cascade)
    - `updateSessionTitle(sessionId, title)` — update session title
    - `createMessage(input: CreateMessageInput)` — insert a message
    - `updateMessageRoutineSaved(messageId, routineId)` — mark routine as saved
    - _Requirements: 1.1, 2.1, 2.2, 4.2, 7.2_

  - [x] 2.2 Add context window utility to `src/lib/ai.ts`
    - Implement `buildContextMessages(messages, systemPrompt)` that takes all messages and returns the system prompt + last 20 messages
    - Export `CONTEXT_WINDOW_SIZE = 20` constant
    - Export the `SYSTEM_PROMPT` constant (currently private in ai.ts)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.3 Add `generateSessionTitle` helper to `src/lib/chat-sessions.ts`
    - Truncate first user message to 50 chars (append "..." if truncated)
    - _Requirements: 1.3_

- [x] 3. TanStack Query hooks
  - [x] 3.1 Create `src/hooks/useChatSessions.ts` with session and message hooks
    - `useChatSessions()` — query all user sessions with stale time config
    - `useChatMessages(sessionId)` — query messages for active session, enabled only when sessionId is non-null
    - `useCreateSession()` — mutation to create session, invalidates session list on success
    - `useDeleteSession()` — mutation with optimistic removal from cache, rollback on error
    - `useUpdateSessionTitle()` — mutation to rename a session
    - `useSendMessage()` — mutation that persists user message, calls AI with context window, persists AI response, updates session title on first message
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 4. Checkpoint - Verify data layer
  - Ensure all data functions and hooks compile correctly, ask the user if questions arise.

- [x] 5. UI components
  - [x] 5.1 Create `src/components/chat/ChatBubble.tsx`
    - Extract the message bubble rendering from AICoachPage into a reusable component
    - Accept `message`, `onSaveRoutine`, `onStartWorkout`, `saving`, props
    - Show inline error indicator (red dot) for messages that failed to persist
    - _Requirements: 2.4, 7.1, 7.3_

  - [x] 5.2 Create `src/components/chat/SessionDrawer.tsx`
    - Full-screen overlay drawer that slides up from bottom (CSS transitions, no new deps)
    - Backdrop blur, dismiss on tap-outside or swipe-down
    - "New Chat" button at top
    - Session list items showing title + relative time (e.g., "2h ago", "Yesterday")
    - Swipe-left on session entry reveals red delete button
    - Add a `formatRelativeTime(dateString)` utility (inline or in a small helper)
    - _Requirements: 3.1, 3.3, 3.4, 4.1_

- [x] 6. Refactor AICoachPage
  - [x] 6.1 Refactor `src/pages/AICoachPage.tsx` to use session hooks
    - Replace local `useState` messages with `useChatMessages(activeSessionId)`
    - Add `activeSessionId` state managed by a `useActiveSession` pattern (local state + session creation on first load)
    - On mount: if user has sessions → load most recent; if no sessions → auto-create one
    - Display client-side welcome message (not persisted) for new sessions
    - Wire `useSendMessage` into the send handler
    - Use `buildContextMessages` for AI API calls
    - _Requirements: 1.2, 2.3, 5.1, 5.2, 5.3, 5.4, 8.1, 8.2_

  - [x] 6.2 Add session drawer toggle and session switching to AICoachPage
    - Add hamburger/list icon button in the header to open SessionDrawer
    - On session select: update `activeSessionId`, close drawer
    - On session delete: if active session deleted, create new session
    - On "New Chat": create session, switch to it, close drawer
    - _Requirements: 3.2, 3.4, 4.1, 4.3_

  - [x] 6.3 Wire routine saving to persist state in chat_messages
    - On routine save: call existing save logic + `updateMessageRoutineSaved` to mark the message
    - On revisiting a session: routine cards show saved state from DB (routine_saved + saved_routine_id)
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Final checkpoint - Ensure everything works end-to-end
  - Ensure all components render without errors, data flows correctly, ask the user if questions arise.

## Notes

- No property-based tests included per user preference — focus on getting the feature working
- The NVIDIA NIM API has CORS issues from browsers; the chat structure is still correct and will work once a proxy/edge function is added
- Primary device is iPhone 13 Pro — the session drawer should be tested at that viewport (390×844)
- All messages persist to Supabase, but only the last 20 are sent to the AI API
- The welcome message is client-side only and never persisted

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["5.1", "5.2"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] }
  ]
}
```
