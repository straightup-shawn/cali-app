# Requirements Document

## Introduction

This feature unifies the workout editing experience so that editing a past workout (`/history/:id`) reuses the same UI layout, interaction patterns, and components as the active workout session (`/workout/active`). The goal is consistency: users familiar with logging a live workout should feel immediately at home when editing a past one. Key differences from a live session are that timestamps are preserved, there is no live timer, and the finish action becomes a save action.

## Glossary

- **Edit_Mode_Page**: The page rendered at `/history/:id?edit=true` that provides the ActiveWorkoutPage-style editing interface for a completed workout.
- **Active_Workout_Page**: The existing page at `/workout/active` used for logging an in-progress workout session.
- **Workout_Detail_Page**: The existing page at `/history/:id` that displays a read-only summary of a completed workout and currently contains a separate, custom edit mode.
- **Exercise_Card**: A UI component that displays an exercise with its set rows, add set button, remove button, and reorder controls — as used in Active_Workout_Page.
- **Set_Row**: A UI component within an Exercise_Card that displays inputs for reps, weight, duration, and RPE for a single set — as used in Active_Workout_Page.
- **Duration_Display**: A static UI element showing the original workout duration (computed from `started_at` and `completed_at`) in place of the live timer.
- **Save_Changes_Button**: The primary action button in Edit_Mode_Page that persists all edits and navigates back to the read-only Workout_Detail_Page.
- **Discard_Confirmation_Dialog**: A modal dialog that asks the user to confirm discarding unsaved edits before leaving Edit_Mode_Page.

## Requirements

### Requirement 1: Enter Edit Mode

**User Story:** As a user, I want to tap an edit button on the Workout Detail Page, so that I can modify a past workout using the same interface I use during a live session.

#### Acceptance Criteria

1. WHEN the user taps the edit action on Workout_Detail_Page, THE Edit_Mode_Page SHALL render the workout data using the same Exercise_Card and Set_Row components used by Active_Workout_Page.
2. WHEN Edit_Mode_Page loads, THE Edit_Mode_Page SHALL populate all Exercise_Cards with the existing exercises and sets from the saved workout in their original order.
3. WHEN Edit_Mode_Page loads, THE Edit_Mode_Page SHALL display the workout name in an editable text field pre-filled with the current workout name.

### Requirement 2: Preserve Original Timestamps

**User Story:** As a user, I want my original workout timestamps preserved when I edit, so that my history accurately reflects when the workout was actually performed.

#### Acceptance Criteria

1. WHEN the user saves edits on Edit_Mode_Page, THE Edit_Mode_Page SHALL retain the original `started_at` timestamp without modification.
2. WHEN the user saves edits on Edit_Mode_Page, THE Edit_Mode_Page SHALL retain the original `completed_at` timestamp without modification.
3. WHEN the user saves edits on Edit_Mode_Page, THE Edit_Mode_Page SHALL retain the original `duration_seconds` value without modification.

### Requirement 3: Display Static Duration Instead of Live Timer

**User Story:** As a user, I want to see how long the original workout lasted while editing, so that I have context without being confused by a running timer.

#### Acceptance Criteria

1. WHILE Edit_Mode_Page is active, THE Duration_Display SHALL show the original workout duration formatted as `HH:MM:SS` or `MM:SS`.
2. WHILE Edit_Mode_Page is active, THE Duration_Display SHALL remain static and not increment.
3. WHILE Edit_Mode_Page is active, THE Duration_Display SHALL be positioned in the same header location where Active_Workout_Page shows its live timer.

### Requirement 4: Exercise Management in Edit Mode

**User Story:** As a user, I want to add, remove, and reorder exercises while editing a past workout, so that I can correct mistakes using the same flow I know from a live session.

#### Acceptance Criteria

1. WHEN the user taps the add exercise action in Edit_Mode_Page, THE Edit_Mode_Page SHALL open the same ExercisePicker component used by Active_Workout_Page.
2. WHEN the user selects an exercise from ExercisePicker, THE Edit_Mode_Page SHALL append a new Exercise_Card with one empty Set_Row at the bottom of the exercise list.
3. WHEN the user taps the remove action on an Exercise_Card, THE Edit_Mode_Page SHALL remove the exercise and all its sets from the editing state.
4. WHEN the user taps the move-up or move-down action on an Exercise_Card, THE Edit_Mode_Page SHALL reorder the exercise in the list, updating positions accordingly.

### Requirement 5: Set Management in Edit Mode

**User Story:** As a user, I want to add, delete, and modify sets within each exercise while editing, so that I can correct my logged data using the familiar set row interface.

#### Acceptance Criteria

1. WHEN the user taps the add set action on an Exercise_Card, THE Edit_Mode_Page SHALL append a new Set_Row with empty input fields to that exercise.
2. WHEN the user taps the delete action on a Set_Row, THE Edit_Mode_Page SHALL remove that set and renumber the remaining sets sequentially.
3. WHEN the user modifies reps, weight, duration, or RPE in a Set_Row, THE Edit_Mode_Page SHALL update the corresponding value in the editing state immediately.
4. THE Set_Row component in Edit_Mode_Page SHALL display the same input fields (reps, weight/resistance, duration, RPE) appropriate to the exercise type, matching Active_Workout_Page behavior.

### Requirement 6: Save Changes

**User Story:** As a user, I want to save my edits with a single tap, so that my corrected workout data is persisted to the database.

#### Acceptance Criteria

1. THE Edit_Mode_Page SHALL display a Save_Changes_Button in the same position where Active_Workout_Page shows the "Finish Workout" button.
2. WHEN the user taps Save_Changes_Button, THE Edit_Mode_Page SHALL persist all changes (exercise additions, removals, reorders, set additions, deletions, and value updates) to the database.
3. WHEN the save operation completes successfully, THE Edit_Mode_Page SHALL navigate the user back to the read-only Workout_Detail_Page showing the updated data.
4. WHILE the save operation is in progress, THE Save_Changes_Button SHALL display a loading indicator and be disabled to prevent duplicate submissions.
5. IF the save operation fails, THEN THE Edit_Mode_Page SHALL display an error message and keep the user on Edit_Mode_Page with their edits intact.

### Requirement 7: Discard Edits Confirmation

**User Story:** As a user, I want to be warned before accidentally discarding my edits, so that I do not lose changes by navigating away.

#### Acceptance Criteria

1. WHEN the user taps the back/cancel action while unsaved changes exist, THE Edit_Mode_Page SHALL display a Discard_Confirmation_Dialog asking the user to confirm or cancel.
2. WHEN the user confirms discard in the Discard_Confirmation_Dialog, THE Edit_Mode_Page SHALL discard all unsaved edits and navigate back to Workout_Detail_Page.
3. WHEN the user cancels in the Discard_Confirmation_Dialog, THE Edit_Mode_Page SHALL close the dialog and keep the user on Edit_Mode_Page with edits preserved.
4. IF no changes have been made, THEN THE Edit_Mode_Page SHALL navigate back without showing the Discard_Confirmation_Dialog.

### Requirement 8: Visual Consistency with Active Workout

**User Story:** As a user, I want the edit interface to look and feel identical to the active workout interface, so that I have one consistent mental model for workout interaction.

#### Acceptance Criteria

1. THE Edit_Mode_Page SHALL use the same glassmorphism card styling, dark theme colors, and layout structure as Active_Workout_Page.
2. THE Edit_Mode_Page SHALL use the same Set_Row input affordances (tap to edit, numeric keyboards, RPE picker) as Active_Workout_Page.
3. THE Edit_Mode_Page SHALL use the same Exercise_Card layout (exercise name header, type badge, set table, action buttons) as Active_Workout_Page.
4. THE Edit_Mode_Page SHALL render a header bar in the same position and style as the WorkoutTimerBar in Active_Workout_Page, replacing the live timer with Duration_Display.

### Requirement 9: Set Completion State in Edit Mode

**User Story:** As a user, I want all sets in edit mode to be treated as completed, so that I can focus on correcting values rather than re-completing each set.

#### Acceptance Criteria

1. WHEN Edit_Mode_Page loads, THE Edit_Mode_Page SHALL mark all existing sets as completed in the editing state.
2. WHEN the user adds a new set in Edit_Mode_Page, THE Edit_Mode_Page SHALL mark the new set as completed by default.
3. THE Set_Row component in Edit_Mode_Page SHALL display all sets with the completed visual styling (no separate complete/uncomplete toggle needed).
