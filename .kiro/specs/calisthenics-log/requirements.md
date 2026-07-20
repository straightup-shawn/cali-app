# Requirements Document

## Introduction

Calisthenics Log is a production-quality, mobile-first progressive web application for tracking calisthenics workouts. It provides efficient workout logging with support for bodyweight, weighted, assisted, duration, and static hold exercises. The application features three independent timer systems, progression tracking between exercises, offline persistence, and cloud sync via Supabase. The UI is optimized for quick, one-handed use during active training sessions.

## Glossary

- **App**: The Calisthenics Log progressive web application
- **User**: A registered person who uses the App to log workouts
- **Exercise**: A named physical movement with a defined type and optional progression relationships
- **Exercise_Type**: One of bodyweight, weighted, assisted, duration, or static_hold
- **Exercise_Library**: The collection of all system-default and user-created exercises
- **Custom_Exercise**: An exercise created by a User that is private to their account
- **Progression_Chain**: An ordered sequence of exercises linked by difficulty progression (e.g., knee push-up → push-up → diamond push-up)
- **Routine**: A reusable workout template containing an ordered list of exercises with default set/rep/weight targets
- **Workout**: A single training session logged by a User, containing one or more Exercise_Sets
- **Active_Workout**: A workout currently in progress that has not yet been completed or discarded
- **Exercise_Set**: A single performance of an exercise within a workout, recording reps, weight, duration, RPE, or RIR as applicable
- **RPE**: Rate of Perceived Exertion, a 1–10 scale indicating effort intensity
- **RIR**: Reps in Reserve, indicating how many additional reps could have been performed
- **Personal_Record**: The best performance achieved by a User for a given exercise metric (max reps, max weight, max volume, longest hold)
- **Workout_Timer**: An elapsed timer tracking total workout duration from start to finish
- **Rest_Timer**: A countdown timer used between sets with configurable default duration
- **Exercise_Duration_Timer**: A countdown or count-up timer for timed exercises and static holds
- **Unit_Preference**: The User's chosen measurement system (metric or imperial)
- **Onboarding_Flow**: The guided setup process for new users after registration
- **PWA**: Progressive Web Application, enabling native-like installation and offline capabilities
- **RLS**: Row-Level Security policies in Supabase that restrict data access per user
- **Sync**: The process of persisting local workout data to the Supabase cloud database

## Requirements

### Requirement 1: User Authentication

**User Story:** As a new or returning user, I want to register and log in securely, so that my workout data is protected and accessible across devices.

#### Acceptance Criteria

1. WHEN a user submits a valid email and password on the registration form, THE App SHALL create a new account and redirect to the Onboarding_Flow
2. WHEN a user submits valid credentials on the login form, THE App SHALL authenticate the user and redirect to the dashboard
3. WHEN a user selects Google OAuth login, THE App SHALL initiate the OAuth flow and create or link the account upon successful authentication
4. IF a user submits invalid credentials, THEN THE App SHALL display a descriptive error message without revealing whether the email exists
5. WHEN a user requests a password reset, THE App SHALL send a reset link to the registered email address
6. WHEN an authenticated user selects logout, THE App SHALL clear the local session and redirect to the login screen
7. WHILE a user is not authenticated, THE App SHALL restrict access to all application routes except login, registration, and password reset

### Requirement 2: User Onboarding

**User Story:** As a new user, I want a guided onboarding experience, so that I can configure my preferences and start training quickly.

#### Acceptance Criteria

1. WHEN a new user completes registration, THE Onboarding_Flow SHALL present unit preference selection (metric or imperial)
2. WHEN a new user selects a Unit_Preference, THE Onboarding_Flow SHALL store the preference in the user profile
3. WHEN onboarding is complete, THE App SHALL redirect the user to the main dashboard with a welcome state

### Requirement 3: Exercise Library

**User Story:** As a user, I want access to a comprehensive exercise library with progression information, so that I can find exercises appropriate for my skill level.

#### Acceptance Criteria

1. THE Exercise_Library SHALL contain system-default exercises categorized by muscle group and Exercise_Type
2. WHEN a user searches the Exercise_Library, THE App SHALL filter exercises by name, muscle group, or Exercise_Type in real-time
3. WHEN a user views an exercise detail, THE App SHALL display the exercise name, type, primary muscle groups, instructions, and Progression_Chain position
4. WHEN a user creates a Custom_Exercise, THE App SHALL require a name and Exercise_Type, and optionally accept muscle groups, instructions, and progression links
5. WHEN a user creates a Custom_Exercise, THE App SHALL validate that the exercise name is unique within the user's library
6. THE App SHALL display Progression_Chain relationships as navigable links showing easier and harder exercise variants

### Requirement 4: Routine Builder

**User Story:** As a user, I want to create and manage workout routines, so that I can quickly start pre-planned training sessions.

#### Acceptance Criteria

1. WHEN a user creates a new Routine, THE App SHALL require a routine name and allow adding exercises from the Exercise_Library
2. WHEN a user adds an exercise to a Routine, THE App SHALL allow setting default target sets, reps, weight, or duration based on Exercise_Type
3. WHEN a user reorders exercises within a Routine, THE App SHALL persist the new ordering
4. WHEN a user edits a Routine, THE App SHALL allow modifying the name, exercise list, exercise order, and default targets
5. WHEN a user deletes a Routine, THE App SHALL remove the routine and confirm the action beforehand
6. THE App SHALL allow a user to duplicate an existing Routine as a starting point for a new routine

### Requirement 5: Live Workout Logging

**User Story:** As a user, I want to efficiently log exercises during my workout with minimal taps, so that tracking does not interrupt my training flow.

#### Acceptance Criteria

1. WHEN a user starts a workout from a Routine, THE App SHALL create an Active_Workout pre-populated with the routine's exercises and default targets
2. WHEN a user starts an empty workout, THE App SHALL create an Active_Workout with no pre-populated exercises
3. WHEN a user logs an Exercise_Set for a bodyweight exercise, THE App SHALL record the number of reps completed
4. WHEN a user logs an Exercise_Set for a weighted exercise, THE App SHALL record the number of reps and the weight used
5. WHEN a user logs an Exercise_Set for an assisted exercise, THE App SHALL record the number of reps and the assistance weight used
6. WHEN a user logs an Exercise_Set for a duration or static_hold exercise, THE App SHALL record the time held or performed
7. WHEN a user completes a set, THE App SHALL allow optional RPE (1–10) or RIR (0–5) annotation
8. WHEN a user adds an exercise to an Active_Workout, THE App SHALL allow selecting from the Exercise_Library
9. WHEN a user reorders exercises within an Active_Workout, THE App SHALL update the display order immediately
10. WHEN a user removes an exercise from an Active_Workout, THE App SHALL remove all associated sets and confirm the action
11. WHEN a user finishes a workout, THE App SHALL save the completed workout with all sets, duration, and timestamp data
12. WHEN a user discards an Active_Workout, THE App SHALL confirm the action and delete all unsaved workout data

### Requirement 6: Timer Systems

**User Story:** As a user, I want independent timers for overall workout duration, rest periods, and timed exercises, so that I can manage my training tempo precisely.

#### Acceptance Criteria

1. WHEN an Active_Workout begins, THE Workout_Timer SHALL start counting elapsed time and remain visible throughout the session
2. WHEN a user pauses the Active_Workout, THE Workout_Timer SHALL pause and resume when the workout resumes
3. WHEN a user completes a set, THE Rest_Timer SHALL offer to start a countdown with the configured default rest duration
4. WHEN the Rest_Timer reaches zero, THE App SHALL notify the user with a visual and optional vibration alert
5. WHEN a user adjusts the Rest_Timer during countdown, THE App SHALL allow adding or subtracting time in configurable increments
6. THE App SHALL allow each exercise to have a custom default rest duration that overrides the global default
7. WHEN a user starts a duration or static_hold set, THE Exercise_Duration_Timer SHALL count the exercise time
8. THE Workout_Timer, Rest_Timer, and Exercise_Duration_Timer SHALL operate independently without interfering with each other

### Requirement 7: Workout History and Records

**User Story:** As a user, I want to review my past workouts and see personal records, so that I can track my progress over time.

#### Acceptance Criteria

1. WHEN a user navigates to workout history, THE App SHALL display a chronological list of completed workouts with date, duration, and exercise count
2. WHEN a user selects a completed workout, THE App SHALL display full workout details including all exercises, sets, reps, weights, durations, and RPE/RIR values
3. WHEN a user achieves a new Personal_Record, THE App SHALL identify and display the record with a visual indicator
4. THE App SHALL track Personal_Records for maximum reps, maximum weight, maximum volume (sets × reps × weight), and longest hold per exercise
5. WHEN a user views an exercise detail, THE App SHALL display the Personal_Record history and recent performance for that exercise

### Requirement 8: Bodyweight Tracking

**User Story:** As a user, I want to log my bodyweight over time, so that I can correlate body composition changes with training progress.

#### Acceptance Criteria

1. WHEN a user logs a bodyweight entry, THE App SHALL record the weight value with the date and user's Unit_Preference
2. WHEN a user views bodyweight history, THE App SHALL display entries as a chronological list and optional trend chart
3. THE App SHALL use the most recent bodyweight entry as the default value for new entries
4. WHEN a user edits or deletes a bodyweight entry, THE App SHALL update the history and recalculate any dependent metrics

### Requirement 9: Unit System

**User Story:** As a user, I want to choose between metric and imperial units, so that I see weights and measurements in my preferred format.

#### Acceptance Criteria

1. THE App SHALL store all weight and measurement values in metric (kg, cm) as the canonical format
2. WHEN displaying weight or measurement values, THE App SHALL convert from canonical metric to the user's Unit_Preference
3. WHEN a user inputs weight or measurement values, THE App SHALL convert from the user's Unit_Preference to canonical metric before storage
4. WHEN a user changes their Unit_Preference, THE App SHALL immediately re-render all displayed values in the new unit system without data loss

### Requirement 10: Offline Persistence

**User Story:** As a user, I want my active workout to persist locally, so that I do not lose data if I accidentally close the app or lose connectivity.

#### Acceptance Criteria

1. WHILE an Active_Workout is in progress, THE App SHALL persist the current workout state to localStorage after each set completion or modification
2. WHEN the App is reopened with a persisted Active_Workout, THE App SHALL prompt the user to resume or discard the in-progress workout
3. IF the network connection is lost during an Active_Workout, THEN THE App SHALL continue to function for workout logging using local persistence
4. WHEN network connectivity is restored, THE App SHALL sync any locally persisted completed workouts to Supabase

### Requirement 11: Data Synchronization

**User Story:** As a user, I want my data synced to the cloud, so that I can access my workout history from any device.

#### Acceptance Criteria

1. WHEN a workout is completed, THE App SHALL persist the workout data to Supabase
2. WHEN a user logs in on a new device, THE App SHALL retrieve all historical workout data from Supabase
3. THE App SHALL enforce RLS policies ensuring each user can only access their own data
4. IF a sync operation fails, THEN THE App SHALL retry with exponential backoff and notify the user of persistent failures

### Requirement 12: PWA and Installation

**User Story:** As a user, I want to install the app on my phone's home screen, so that it behaves like a native application.

#### Acceptance Criteria

1. THE App SHALL serve a valid PWA manifest with app name, icons, theme color, and standalone display mode
2. THE App SHALL register a service worker that caches the application shell for offline access
3. WHEN a user meets browser install criteria, THE App SHALL display an install prompt or instructions
4. WHEN installed as a PWA, THE App SHALL launch in standalone mode without browser chrome
5. THE App SHALL provide placeholder icons in required sizes (192x192, 512x512) for home screen installation

### Requirement 13: Responsive Mobile-First Interface

**User Story:** As a user, I want a fast, touch-friendly interface optimized for one-handed phone use during workouts, so that logging is effortless.

#### Acceptance Criteria

1. THE App SHALL use a mobile-first responsive layout that adapts gracefully to tablet and desktop viewports
2. THE App SHALL place primary workout actions within thumb-reach zones on mobile screens
3. WHEN displaying set logging inputs, THE App SHALL use large touch targets (minimum 44x44px) and numeric input modes
4. THE App SHALL provide visual feedback within 100ms for all user interactions during active workout logging
5. THE App SHALL use bottom navigation for primary app sections on mobile viewports

### Requirement 14: Deployment and Configuration

**User Story:** As a developer, I want clear deployment configuration, so that the app can be reliably built and deployed to Render.

#### Acceptance Criteria

1. THE App SHALL include a render.yaml configuration file for Render static site deployment with SPA fallback
2. THE App SHALL include an .env.example file documenting all required environment variables
3. THE App SHALL include Supabase SQL migration files for database schema creation
4. THE App SHALL include a seed script for populating default exercise data
5. THE App SHALL produce an optimized production build via Vite with code splitting and asset hashing
