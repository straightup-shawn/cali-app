# Implementation Plan: Calisthenics Log

## Overview

Implementation of a mobile-first calisthenics workout tracking PWA using React, TypeScript, Vite, Tailwind CSS, Supabase, and supporting libraries. The plan is organized into 9 phases, each building incrementally on the previous. Property-based tests validate core logic (unit conversion, PR detection, serialization) while integration tests cover UI flows.

## Tasks

- [x] 1. Project Scaffolding and Supabase Setup
  - [x] 1.1 Initialize Vite + React + TypeScript project with Tailwind CSS
    - Run `npm create vite@latest` with React + TypeScript template
    - Install dependencies: tailwindcss, postcss, autoprefixer, react-router-dom, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers, @supabase/supabase-js, vite-plugin-pwa
    - Configure tailwind.config.ts, postcss.config.js, and base styles
    - Create .env.example with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
    - _Requirements: 14.2, 14.5_

  - [x] 1.2 Configure Vite with PWA plugin and path aliases
    - Set up vite.config.ts with VitePWA plugin, path aliases (@/), and build optimization
    - Configure tsconfig.json path aliases
    - Add render.yaml with static site config and SPA rewrite rule
    - _Requirements: 12.1, 14.1, 14.5_

  - [x] 1.3 Create Supabase database migration files
    - Write SQL migration for all tables: profiles, exercises, routines, routine_exercises, workouts, workout_exercises, exercise_sets, personal_records, bodyweight_entries
    - Include all constraints, indexes, foreign keys, and check constraints
    - Add trigger to create profile on auth.users insert
    - Add updated_at trigger function
    - _Requirements: 14.3_

  - [x] 1.4 Create RLS policies migration
    - Write SQL migration with all Row-Level Security policies as defined in design
    - Enable RLS on all tables
    - _Requirements: 11.3, 14.3_

  - [x] 1.5 Create seed script for default exercises
    - Write SQL seed script with system-default exercises (bodyweight, weighted, assisted, duration, static_hold types)
    - Include progression chain relationships (e.g., knee push-up → push-up → diamond push-up)
    - Include muscle group categorization
    - _Requirements: 3.1, 14.4_

  - [x] 1.6 Set up Supabase client and TypeScript types
    - Create src/lib/supabase.ts with typed client
    - Generate or manually create src/types/database.ts with Database type matching schema
    - Create src/types/index.ts with application-level type exports
    - _Requirements: 14.2_

- [x] 2. Authentication and Onboarding
  - [x] 2.1 Create AuthProvider context and session management
    - Implement AuthContext with Supabase auth state listener
    - Handle session persistence and token refresh
    - Expose user, loading, signIn, signUp, signOut, resetPassword methods
    - _Requirements: 1.2, 1.6, 1.7_

  - [x] 2.2 Implement login page with email/password and Google OAuth
    - Create LoginPage with React Hook Form + Zod validation
    - Add Google OAuth button triggering Supabase OAuth flow
    - Display generic error messages on invalid credentials (same message regardless of email existence)
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Implement registration page
    - Create RegisterPage with email/password form, Zod validation (min 8 chars, valid email)
    - On success, create account and redirect to onboarding
    - _Requirements: 1.1_

  - [x] 2.4 Implement password reset page
    - Create ResetPasswordPage with email input
    - Call Supabase resetPasswordForEmail
    - Show confirmation message
    - _Requirements: 1.5_

  - [x] 2.5 Implement route guards and protected routes
    - Create ProtectedRoute wrapper that redirects unauthenticated users to /login
    - Create PublicRoute wrapper that redirects authenticated users to /dashboard
    - _Requirements: 1.7_

  - [x] 2.6 Implement onboarding flow
    - Create OnboardingPage with unit preference selection (metric/imperial)
    - Store preference in profiles table via useUpdateProfile mutation
    - Set onboarding_complete = true on completion
    - Redirect to dashboard with welcome state
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - Auth and Onboarding
  - Ensure all auth flows work (login, register, OAuth, reset, logout)
  - Verify route protection redirects properly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Exercise Library
  - [x] 4.1 Create exercise data hooks (useExercises, useExercise, useCreateExercise)
    - Implement TanStack Query hooks for fetching exercises with filtering
    - Support search by name (ilike), filter by muscle_group (contains), filter by exercise_type (eq)
    - Implement useCreateExercise mutation with name uniqueness validation
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ]* 4.2 Write property test for exercise search filtering
    - **Property 4: Exercise Search Filter Correctness**
    - Generate random exercise arrays and search queries; verify all results match criteria
    - **Validates: Requirements 3.2**

  - [ ]* 4.3 Write property test for exercise name uniqueness
    - **Property 12: Exercise Name Uniqueness Enforcement**
    - Generate random exercise names; verify duplicate creation is rejected
    - **Validates: Requirements 3.5**

  - [x] 4.4 Implement ExercisesPage with search and filter UI
    - Create ExerciseSearch component with debounced text input
    - Create ExerciseFilterBar with muscle group and type dropdowns
    - Create ExerciseList with ExerciseCard components
    - _Requirements: 3.2_

  - [x] 4.5 Implement ExerciseDetailPage with progression chain
    - Display exercise info: name, type, muscle groups, instructions
    - Show ProgressionChain component with navigable links to easier/harder variants
    - Show PersonalRecordsList for the exercise
    - _Requirements: 3.3, 3.6, 7.5_

  - [x] 4.6 Implement custom exercise creation form
    - Create ExerciseFormPage with React Hook Form + Zod schema
    - Required fields: name, exercise_type
    - Optional: muscle_groups (multi-select), instructions, progresses_to (exercise picker)
    - _Requirements: 3.4, 3.5_

- [x] 5. Unit Conversion System
  - [x] 5.1 Implement unit conversion utilities
    - Create src/lib/units.ts with all conversion functions: displayWeight, inputToKg, kgToDisplay, formatWeight
    - Create useUnitPreference hook that reads from user profile
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 5.2 Write property tests for unit conversion
    - **Property 1: Unit Conversion Round-Trip**
    - Generate random non-negative weights; verify inputToKg → kgToDisplay round-trip within 0.1 tolerance
    - **Property 14: Unit Preference Change Preserves Data**
    - Verify stored kg values remain unchanged when preference switches
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 6. Routine Builder
  - [x] 6.1 Create routine data hooks (useRoutines, useRoutine, useCreateRoutine, useUpdateRoutine, useDeleteRoutine)
    - Implement TanStack Query hooks for CRUD operations on routines
    - Include routine_exercises in routine fetch (joined query)
    - Implement duplicate routine function
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [ ]* 6.2 Write property tests for routine operations
    - **Property 5: Exercise Reorder Consistency**
    - Generate random lists and reorder ops; verify no duplicates/gaps
    - **Property 13: Routine Duplication Integrity**
    - Generate random routines; verify duplicate has same exercises/targets but different ID
    - **Validates: Requirements 4.3, 4.6**

  - [x] 6.3 Implement RoutinesPage with routine list
    - Create RoutineCard component showing name, exercise count, last used date
    - Add create routine FAB button
    - Add swipe-to-delete or long-press menu with delete confirmation
    - _Requirements: 4.5_

  - [x] 6.4 Implement RoutineFormPage (create/edit)
    - Create form with routine name input (Zod required)
    - ExercisePicker component (searchable exercise list modal)
    - SortableExerciseList with drag-to-reorder
    - TargetInputs per exercise (conditional on exercise type: reps, weight, duration)
    - Rest seconds override per exercise
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Checkpoint - Library and Routines
  - Ensure exercise library loads with filters, custom creation works
  - Ensure routine CRUD operations work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Live Workout Logging
  - [x] 8.1 Implement ActiveWorkoutContext and state management
    - Create ActiveWorkoutContext with full state shape (exercises, sets, timers)
    - Implement all actions: startWorkout, addExercise, removeExercise, reorderExercises, addSet, updateSet, completeSet, finishWorkout, discardWorkout, pauseWorkout, resumeWorkout
    - Wire localStorage persistence on every state change
    - _Requirements: 5.1, 5.2, 5.8, 5.9, 5.10, 5.11, 5.12, 10.1_

  - [ ]* 8.2 Write property tests for active workout operations
    - **Property 2: Active Workout Serialization Round-Trip**
    - Generate random ActiveWorkout states; verify JSON serialize/deserialize equivalence
    - **Property 6: Routine to Active Workout Mapping**
    - Generate random routines; verify started workout matches routine exercises and targets
    - **Property 7: RPE and RIR Validation**
    - Generate random numbers; verify only valid ranges accepted
    - **Validates: Requirements 5.1, 5.7, 10.1**

  - [x] 8.3 Implement ActiveWorkoutPage layout
    - Create page with WorkoutTimerBar header (elapsed time display)
    - WorkoutExerciseList showing all exercises with their sets
    - FinishWorkoutButton and discard option in header menu
    - AddExerciseSheet (bottom sheet with exercise picker)
    - _Requirements: 5.1, 5.2, 5.8, 5.11, 5.12_

  - [x] 8.4 Implement SetRow component with type-specific inputs
    - Bodyweight: reps input only
    - Weighted: reps + weight inputs
    - Assisted: reps + assistance weight inputs
    - Duration/Static Hold: duration input (mm:ss format)
    - Complete set checkbox/button
    - Optional RPE/RIR selector (expandable)
    - All inputs use large touch targets (min 44x44px) and numeric input modes
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 13.3_

  - [x] 8.5 Implement workout finish flow with PR detection
    - On finish: calculate duration, save workout to Supabase via useSaveWorkout
    - Run detectPersonalRecords against current records
    - Display PR celebration UI if new records achieved
    - Clear localStorage active workout
    - _Requirements: 5.11, 7.3, 7.4_

  - [ ]* 8.6 Write property tests for PR detection
    - **Property 3: Personal Record Detection**
    - Generate random sets and existing records; verify only strictly-greater values flagged, no duplicates per exercise
    - **Validates: Requirements 7.3, 7.4**

- [x] 9. Timer Systems
  - [x] 9.1 Implement useTimer hook
    - Support countup and countdown modes
    - Use requestAnimationFrame or setInterval with epoch-based reference to prevent drift
    - Expose: seconds, isRunning, start, pause, reset, adjustTime
    - Fire onComplete callback when countdown reaches 0
    - _Requirements: 6.1, 6.7_

  - [x] 9.2 Implement WorkoutTimerBar component
    - Display elapsed time in HH:MM:SS format
    - Start on workout begin, pause/resume with workout
    - Always visible in active workout header
    - _Requirements: 6.1, 6.2_

  - [x] 9.3 Implement RestTimerOverlay component
    - Countdown display with circular progress indicator
    - +15s / -15s adjustment buttons
    - Auto-start option after set completion
    - Vibration API + visual notification on completion
    - Support per-exercise custom rest duration overriding global default
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

  - [x] 9.4 Implement ExerciseDurationTimer for timed sets
    - Inline timer in SetRow for duration/static_hold exercises
    - Count-up mode for static holds, configurable start value for duration exercises
    - _Requirements: 6.7_

  - [ ]* 9.5 Write property tests for timer operations
    - **Property 8: Timer Independence**
    - Simulate concurrent timer operations; verify modifying one does not affect others
    - **Property 9: Rest Timer Adjustment**
    - Generate random timer values and deltas; verify result = max(0, current + delta)
    - **Validates: Requirements 6.5, 6.8**

- [x] 10. Checkpoint - Live Workout and Timers
  - Ensure full workout flow works: start from routine, log sets, timers run, finish saves data
  - Verify PR detection highlights new records
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Workout History and Records
  - [x] 11.1 Create workout history data hooks (useWorkouts, useWorkout, usePersonalRecords)
    - Implement paginated useWorkouts hook with date ordering (descending)
    - Implement useWorkout hook fetching full detail (exercises, sets)
    - Implement usePersonalRecords hook for exercise-specific records
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]* 11.2 Write property test for workout history ordering
    - **Property 10: Workout History Chronological Order**
    - Generate random workout arrays with dates; verify sorted descending by completed_at
    - **Validates: Requirements 7.1**

  - [x] 11.3 Implement HistoryPage with workout list
    - Create WorkoutHistoryList showing date, workout name, duration, exercise count
    - Infinite scroll or load-more pagination
    - _Requirements: 7.1_

  - [x] 11.4 Implement WorkoutDetailPage
    - Display full workout: all exercises with sets, reps, weight, duration, RPE/RIR
    - Highlight sets that achieved PRs with visual indicator
    - _Requirements: 7.2, 7.3_

- [x] 12. Bodyweight Tracking
  - [x] 12.1 Create bodyweight data hooks (useBodyweightEntries, useLogBodyweight, useUpdateBodyweight, useDeleteBodyweight)
    - Implement CRUD hooks for bodyweight_entries
    - Default new entry value to most recent entry's weight
    - _Requirements: 8.1, 8.3, 8.4_

  - [x] 12.2 Implement BodyweightSection in ProfilePage
    - BodyweightForm: weight input with unit-aware display, date picker
    - BodyweightList: chronological entries with edit/delete actions
    - BodyweightChart: simple line chart showing trend over time
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 12.3 Implement ProfilePage with unit preference toggle
    - UnitPreferenceToggle: metric/imperial switch that updates profile
    - On change, all displayed values re-render in new units immediately
    - Display current user email, logout button
    - _Requirements: 9.4, 1.6_

- [x] 13. Offline Persistence and Sync
  - [x] 13.1 Implement workout persistence layer
    - Create src/lib/workout-persistence.ts with persistWorkout, loadPersistedWorkout, clearPersistedWorkout
    - Add beforeunload event listener as safety net
    - On app startup, check for persisted workout and show resume/discard prompt
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 13.2 Implement sync queue and retry logic
    - Create src/lib/sync.ts with syncWithRetry using exponential backoff
    - Queue completed workouts for sync when offline
    - Listen for online event to trigger sync of pending items
    - Show toast notification on persistent sync failures
    - _Requirements: 10.4, 11.1, 11.4_

  - [ ]* 13.3 Write property test for exponential backoff
    - **Property 11: Exponential Backoff Computation**
    - Generate random attempt numbers, base delays, max delays; verify delay = min(base * 2^N, max)
    - **Validates: Requirements 11.4**

- [x] 14. Checkpoint - History, Bodyweight, and Sync
  - Ensure workout history loads correctly with pagination
  - Verify bodyweight tracking CRUD and chart display
  - Test offline → online sync flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. PWA Configuration
  - [x] 15.1 Configure PWA manifest and service worker
    - Finalize vite-plugin-pwa config with manifest fields (name, short_name, icons, theme_color, display)
    - Configure workbox precaching for app shell
    - Add runtime caching strategy for Supabase API (NetworkFirst)
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 15.2 Create PWA icons and install prompt
    - Generate placeholder icons (192x192, 512x512, 512x512 maskable)
    - Implement install prompt handler using beforeinstallprompt event
    - Show install banner/button for eligible users
    - _Requirements: 12.3, 12.5_

- [x] 16. Responsive Mobile-First Interface Polish
  - [x] 16.1 Implement AppShell with bottom navigation
    - Create BottomNavigation component with 5 tabs: Dashboard, Exercises, Routines, History, Profile
    - Show only on mobile viewports (hidden on desktop, replaced with sidebar)
    - Ensure all nav items have 44px+ touch targets
    - _Requirements: 13.2, 13.5_

  - [x] 16.2 Implement DashboardPage
    - QuickStartCard: start empty workout or from recent routine
    - RecentWorkouts: last 3 completed workouts summary
    - WeeklyStats: workouts this week count
    - _Requirements: 2.3_

  - [x] 16.3 Add touch feedback and responsive optimizations
    - Add Tailwind active: states for all interactive elements (< 100ms feedback)
    - Ensure all form inputs in workout logging use inputmode="numeric" or inputmode="decimal"
    - Verify thumb-zone placement of primary actions
    - _Requirements: 13.1, 13.3, 13.4_

- [x] 17. Deployment and Documentation
  - [x] 17.1 Finalize render.yaml and deployment config
    - Verify render.yaml has correct buildCommand, staticPublishPath, and SPA rewrite
    - Ensure environment variables are properly referenced
    - Verify production build succeeds with code splitting and asset hashing
    - _Requirements: 14.1, 14.5_

  - [x] 17.2 Create .env.example and README documentation
    - Document all environment variables with descriptions
    - Add setup instructions (Supabase project creation, migrations, seed)
    - Add development and deployment instructions
    - _Requirements: 14.2_

- [x] 18. Final Checkpoint
  - Run full production build and verify output
  - Verify PWA installability in Chrome DevTools
  - Ensure all tests pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "name": "Wave 1: Foundation",
      "tasks": ["1"],
      "description": "Project scaffolding, Supabase setup, database migrations"
    },
    {
      "name": "Wave 2: Authentication",
      "tasks": ["2"],
      "dependencies": ["1"],
      "description": "Auth flows, route guards, onboarding"
    },
    {
      "name": "Wave 3: Core Data",
      "tasks": ["4", "5"],
      "dependencies": ["2"],
      "description": "Exercise library, unit conversion system"
    },
    {
      "name": "Wave 4: Routine Builder",
      "tasks": ["6"],
      "dependencies": ["4", "5"],
      "description": "Routine CRUD, exercise ordering, duplication"
    },
    {
      "name": "Wave 5: Live Workout",
      "tasks": ["8", "9"],
      "dependencies": ["6"],
      "description": "Active workout logging, timer systems"
    },
    {
      "name": "Wave 6: History & Tracking",
      "tasks": ["11", "12", "13"],
      "dependencies": ["8", "9"],
      "description": "Workout history, bodyweight tracking, offline sync"
    },
    {
      "name": "Wave 7: Polish & Deploy",
      "tasks": ["15", "16", "17"],
      "dependencies": ["11", "12", "13"],
      "description": "PWA config, mobile UI polish, deployment"
    }
  ]
}
```

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- Property tests use fast-check library and validate universal correctness properties
- Unit tests (integrated within implementation tasks) validate specific examples and edge cases
- All weights are stored in kg; unit conversion is display-layer only
- localStorage persistence is the offline safety net; Supabase is the source of truth
