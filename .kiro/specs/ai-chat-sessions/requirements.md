# Requirements Document

## Introduction

This feature upgrades the existing AI Coach chat interface to support persistent chat sessions with a ChatGPT-style experience. Users can create multiple conversations, revisit previous sessions, and enjoy a context-windowed AI that maintains coherent conversation without sending unbounded message history to the API. Sessions are stored in Supabase and protected by Row-Level Security.

## Glossary

- **Chat_Session**: A conversation between the user and the AI Coach, containing an ordered list of messages and metadata (title, timestamps).
- **Chat_Message**: A single message within a Chat_Session, with a role (user or assistant), content text, and optional structured routine data.
- **Session_List**: A sidebar or drawer UI component displaying all of the authenticated user's Chat_Sessions ordered by most recent activity.
- **Context_Window**: The maximum number of recent Chat_Messages sent to the AI API in a single request to maintain conversation coherence without exceeding token limits.
- **Active_Session**: The Chat_Session currently open and displayed in the chat view.
- **System**: The AI Coach chat interface within the application.
- **Session_Store**: The Supabase database tables and associated RLS policies that persist Chat_Sessions and Chat_Messages.

## Requirements

### Requirement 1: Create Chat Session

**User Story:** As a user, I want to start a new chat session, so that I can begin a fresh conversation with the AI Coach without losing previous conversations.

#### Acceptance Criteria

1. WHEN the user taps the "New Chat" button, THE System SHALL create a new Chat_Session in the Session_Store with the authenticated user's ID, a generated title of "New Chat", and a timestamp of the current time.
2. WHEN a new Chat_Session is created, THE System SHALL set the new session as the Active_Session and display an empty message list.
3. WHEN the user sends the first message in a new Chat_Session, THE System SHALL update the Chat_Session title to a summary derived from the first user message content, truncated to 50 characters.

### Requirement 2: Persist Chat Messages

**User Story:** As a user, I want my chat messages to be saved automatically, so that I can return to any conversation later and see the full history.

#### Acceptance Criteria

1. WHEN a user sends a message, THE System SHALL persist the Chat_Message to the Session_Store with the role "user", the message content, and a timestamp.
2. WHEN the AI returns a response, THE System SHALL persist the Chat_Message to the Session_Store with the role "assistant", the response content, and any parsed routine JSON data.
3. WHEN the user navigates away from the AI Coach page and returns, THE System SHALL restore the Active_Session's messages from the Session_Store.
4. IF a message fails to persist to the Session_Store, THEN THE System SHALL display an inline error indicator on the affected message and retry persistence on the next user action.

### Requirement 3: List and Select Chat Sessions

**User Story:** As a user, I want to see all my previous chat sessions in a list, so that I can easily switch between conversations.

#### Acceptance Criteria

1. THE System SHALL display a Session_List showing all of the authenticated user's Chat_Sessions ordered by most recent activity (updated_at descending).
2. WHEN the user taps a Chat_Session in the Session_List, THE System SHALL load that session's Chat_Messages from the Session_Store and display them as the Active_Session.
3. THE System SHALL display each Chat_Session entry in the Session_List with the session title and a relative time indicator (e.g., "2h ago", "Yesterday").
4. WHEN the Session_List is displayed on the iPhone 13 Pro viewport, THE System SHALL render it as a full-screen drawer that overlays the chat view and can be dismissed by tapping outside or swiping down.

### Requirement 4: Delete Chat Sessions

**User Story:** As a user, I want to delete old chat sessions, so that I can keep my session list clean and remove conversations I no longer need.

#### Acceptance Criteria

1. WHEN the user swipes left on a Chat_Session entry in the Session_List, THE System SHALL reveal a delete action button.
2. WHEN the user confirms deletion of a Chat_Session, THE System SHALL remove the Chat_Session and all associated Chat_Messages from the Session_Store.
3. IF the deleted Chat_Session is the Active_Session, THEN THE System SHALL create a new empty Chat_Session and set it as the Active_Session.

### Requirement 5: Context Window Management

**User Story:** As a user, I want the AI to have a limited context window, so that conversations remain fast and relevant without sending excessive history to the API.

#### Acceptance Criteria

1. WHEN sending a request to the AI API, THE System SHALL include a maximum of 20 most recent Chat_Messages from the Active_Session as conversation context.
2. WHEN the Active_Session contains more than 20 Chat_Messages, THE System SHALL send only the 20 most recent messages (ordered oldest to newest) preceded by the system prompt.
3. THE System SHALL always include the system prompt as the first message in every AI API request regardless of context window contents.
4. WHILE the Context_Window limit is applied, THE System SHALL preserve all Chat_Messages in the Session_Store without deletion, only limiting what is sent to the API.

### Requirement 6: Session Data Security

**User Story:** As a user, I want my chat sessions to be private, so that no other user can access my conversations.

#### Acceptance Criteria

1. THE Session_Store SHALL enforce Row-Level Security policies that restrict Chat_Session read access to the owning user only.
2. THE Session_Store SHALL enforce Row-Level Security policies that restrict Chat_Message read access to messages belonging to Chat_Sessions owned by the authenticated user only.
3. THE Session_Store SHALL enforce Row-Level Security policies that restrict insert, update, and delete operations on Chat_Sessions and Chat_Messages to the owning user only.

### Requirement 7: Session-Aware Routine Saving

**User Story:** As a user, I want routines generated in any chat session to be saveable, so that I can save AI-generated routines regardless of which session I'm viewing.

#### Acceptance Criteria

1. WHEN the AI generates a routine in any Chat_Session, THE System SHALL display the routine card with a "Save Routine" action.
2. WHEN the user saves a routine from a historical Chat_Session, THE System SHALL create the exercises and routine in the database and update the Chat_Message's saved state in the Session_Store.
3. WHEN the user revisits a Chat_Session containing a previously saved routine, THE System SHALL display the routine card in its saved state with the "Start Workout" action.

### Requirement 8: Empty State and Onboarding

**User Story:** As a user opening AI Coach for the first time, I want a clear starting point, so that I understand how to use the chat feature.

#### Acceptance Criteria

1. WHEN the user has zero Chat_Sessions, THE System SHALL automatically create a new Chat_Session and display the welcome message from the AI assistant.
2. WHEN a new Chat_Session is created with the welcome message, THE System SHALL NOT persist the welcome message as a Chat_Message in the Session_Store (the welcome message is client-side only).
