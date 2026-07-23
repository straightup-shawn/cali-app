# Implementation Plan: Unified Workout Edit

## Overview

Reuse the ActiveWorkoutPage UI for editing past workouts by extracting shared components (`ExerciseSection`), creating a `useEditWorkoutState` hook, and building an `EditWorkoutPage` that renders the same layout with a static duration header and "Save Changes" action. The existing `useUpdateWorkout` mutation handles all DB operations.

## Tasks

- [x] 1. Extract shared ExerciseSection component from ActiveWorkoutPage
  - [x] 1.1 Extract the inline `ExerciseSection` from `src/pages/ActiveWorkoutPage.tsx` into `src/components/workout/ExerciseSection.tsx`
    - Move the `ExerciseSection` component (including `TYPE_LABELS`, `TYPE_COLORS` constants) to its own file
    - Add a `mode: 'active' | 'edit'` prop to the interface
    - In `edit` mode: hide the complete/uncomplete toggle button on each set, hide the rest timer duration picker, and always render sets with the completed styling
    - In `active` mode: keep existing behavior unchanged (complete/uncomplete toggle visible, rest picker visible)
    - Make `onComplete`, `onUncomplete`, and `onRestDurationChange` optional props (only required in `active` mode)
    - Update `ActiveWorkoutPage.tsx` to import from the new shared location
    - Verify ActiveWorkoutPage still works identically after extraction
    - _Requirements: 1.1, 8.2, 8.3, 9.3_

  - [x] 1.2 Consolidate the inline `SetRow` in `ActiveWorkoutPage.tsx` with the existing `src/components/workout/SetRow.tsx`
    - The inline `SetRow` in ActiveWorkoutPage has a `previousSet` prop and specific layout — merge any missing features into the shared `SetRow.tsx`
    - Add a `mode: 'active' | 'edit'` prop to `SetRow`
    - In `edit` mode: hide the complete/uncomplete toggle button and always show the completed background styling
    - Make `onCompleteSet` and `onUncompleteSet` optional (not needed in edit mode)
    - Update `ActiveWorkoutPage.tsx` to use the shared `SetRow` from `src/components/workout/SetRow.tsx`
    - _Requirements: 1.1, 5.4, 8.2, 9.3_

- [x] 2. Create the `useEditWorkoutState` hook
  - [x] 2.1 Create `src/hooks/useEditWorkoutState.ts`
    - Accept a `WorkoutWithExercises` object (from `useWorkout`) and convert it to `ActiveWorkout` shape on initialization
    - Initialize all existing sets with `completed: true`
    - Track the original snapshot for dirty-checking (`isDirty` computed by comparing editState to original)
    - Expose mutations: `updateWorkoutName`, `addExercise`, `removeExercise`, `reorderExercises` (move up/down), `addSet`, `deleteSet`, `updateSet`
    - New sets added via `addSet` must default to `completed: true`
    - `deleteSet` must renumber remaining sets sequentially (1, 2, 3...)
    - Implement `computePayload()` that diffs editState vs. original and returns an `UpdateWorkoutPayload` object compatible with `useUpdateWorkout`
    - Payload must never include `started_at`, `completed_at`, or `duration_seconds` fields (timestamps are preserved)
    - If no changes exist, `computePayload()` returns a payload with only `workoutId` and no operation fields
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 4.3, 4.4, 5.1, 5.2, 5.3, 9.1, 9.2_

- [x] 3. Checkpoint - Ensure hook logic is correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build the EditWorkoutPage
  - [x] 4.1 Create `src/pages/EditWorkoutPage.tsx` with the page shell and routing
    - Add a lazy import in `App.tsx`: `const EditWorkoutPage = lazy(() => import('@/pages/EditWorkoutPage'))`
    - Add route `<Route path="/history/:id/edit" element={<EditWorkoutPage />} />` inside the AppShell protected routes (next to the existing `/history/:id` route)
    - The page fetches the workout via `useWorkout(id)` and passes it to `useEditWorkoutState`
    - Show a loading spinner while fetching; show an error state with retry if fetch fails
    - _Requirements: 1.1, 1.2_

  - [x] 4.2 Implement the `EditWorkoutHeader` section inline in `EditWorkoutPage`
    - Mirror the `WorkoutTimerBar` layout from ActiveWorkoutPage (same position, same glassmorphism card style)
    - Display the workout name in an editable text input (pre-filled from the original workout name)
    - Show a static `Duration_Display` formatted as `HH:MM:SS` or `MM:SS` (computed from `started_at` and `completed_at`), not incrementing
    - Include a back/cancel button that triggers the discard confirmation flow
    - _Requirements: 3.1, 3.2, 3.3, 1.3, 8.4_

  - [x] 4.3 Render exercise list using the shared `ExerciseSection` in `edit` mode
    - Map over `editState.exercises` and render `<ExerciseSection mode="edit" ... />` for each
    - Wire up `onUpdate`, `onAddSet`, `onDeleteSet`, `onRemove`, `onMoveUp`, `onMoveDown` to the `useEditWorkoutState` mutations
    - Include an "Add Exercise" button at the bottom that opens the existing `ExercisePicker` component
    - When an exercise is selected from ExercisePicker, call `addExercise` which appends an ExerciseCard with one empty completed set
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 8.1, 8.3_

  - [x] 4.4 Implement the `SaveChangesButton` and save flow
    - Render a "Save Changes" button in the same fixed-bottom position as the "Finish Workout" button in ActiveWorkoutPage
    - On tap: call `computePayload()` then call `useUpdateWorkout.mutate(payload)`
    - While saving: show a loading spinner on the button and disable it to prevent double-tap
    - On success: navigate to `/history/:id` (read-only WorkoutDetailPage)
    - On error: show an error message (inline toast or banner), keep user on the edit page with edits intact
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.5 Implement the `DiscardConfirmDialog` and unsaved-changes guard
    - When back/cancel is tapped and `isDirty` is true, show a confirmation dialog ("Discard changes?")
    - On confirm: discard edits and navigate back to `/history/:id`
    - On cancel: close the dialog and stay on EditWorkoutPage
    - If `isDirty` is false, navigate back immediately without showing the dialog
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 5. Checkpoint - Verify full edit flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Wire up navigation from WorkoutDetailPage
  - [x] 6.1 Update `WorkoutDetailPage` to navigate to `/history/:id/edit` instead of toggling inline edit mode
    - Change the "Edit" button/action to use `navigate(\`/history/${id}/edit\`)` instead of toggling local edit state
    - Remove or disable the old inline edit mode UI if it causes conflicts (can be a follow-up cleanup)
    - _Requirements: 1.1_

- [x] 7. Final checkpoint - Full integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The design uses TypeScript + React throughout, matching the existing codebase conventions
- No property-based tests are included per user request — focus is on getting it working
- The existing `useUpdateWorkout` hook already handles all DB operations (name updates, set CRUD, exercise CRUD) so no backend changes needed
- `ExerciseSection` extraction is the critical first step since both ActiveWorkoutPage and EditWorkoutPage depend on it
- The inline `SetRow` in ActiveWorkoutPage differs from the shared one — consolidation ensures a single source of truth
- Timestamps (`started_at`, `completed_at`, `duration_seconds`) are never mutated or sent in the update payload

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5"] },
    { "id": 6, "tasks": ["6.1"] }
  ]
}
```
