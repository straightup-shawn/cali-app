# Implementation Plan: Calisthenics Progression System (Phase 1)

## Overview

Phase 1 implements the Paths subsystem and basic Momentum scoring. This includes the database schema (11 tables), seed data (9 paths, 70+ nodes), a pure progression evaluator, TanStack Query hooks, post-workout integration, and a Progress page with skill tree visualization. Trials and Milestones are deferred to future phases — their tables are created now but left empty.

## Tasks

- [ ] 1. Database migration and schema setup
  - [ ] 1.1 Create `supabase/migrations/00005_progression_system.sql` with all 11 tables
    - Define tables: `skill_paths`, `skill_nodes`, `skill_node_prerequisites`, `user_skill_progress`, `skill_evidence`, `user_path_targets`, `challenge_templates`, `user_challenges`, `achievement_definitions`, `user_achievements`, `momentum_ledger`
    - Include all columns, constraints, CHECK constraints, and foreign keys as specified in the design document
    - Enable Row-Level Security on all 11 tables
    - Add RLS policies: SELECT-only for seed/system tables (authenticated), full CRUD restricted to `auth.uid() = user_id` for user-scoped tables
    - Create all performance indexes (idx_user_skill_progress_user, idx_skill_nodes_path, idx_momentum_ledger_user, etc.)
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 7.1, 7.8, 11.1, 11.2, 11.5_

- [ ] 2. Seed data for paths and nodes
  - [ ] 2.1 Create `supabase/seeds/progression/paths.json` with 9 path definitions
    - Define all 9 paths: Push, Pull, Squat, Core, Dip, Handstand, Planche, Back Lever, Flexibility
    - Include slug, name, description, icon, and sort_order for each
    - _Requirements: 2.1_

  - [ ] 2.2 Create `supabase/seeds/progression/nodes.json` with 70+ node definitions
    - Define nodes per path with exercise_id references, tier, unlock_criteria (JSONB), mastery_criteria, and momentum_reward
    - Map each node to an existing exercise ID from seed.sql (add new exercises in the migration for Paths 7-9 if needed)
    - Include unlock criteria using types: `reps`, `hold`, `sets_at_reps` with appropriate thresholds
    - _Requirements: 2.2, 2.4, 4.2, 4.4, 8.1, 8.4_

  - [ ] 2.3 Create `supabase/seeds/progression/prerequisites.json` with prerequisite edges
    - Define prerequisite relationships between nodes using group_id and group_logic (and/or)
    - Ensure the graph is a valid DAG (no cycles) for each path
    - _Requirements: 2.3, 2.5, 2.6_

  - [ ] 2.4 Create a seed script `supabase/seeds/progression/seed-progression.sql` that inserts all JSON data
    - Insert paths, nodes, and prerequisites in correct FK order
    - Use ON CONFLICT DO NOTHING for idempotency
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Feature flag module
  - [ ] 3.1 Create `src/lib/feature-flags.ts`
    - Implement `isProgressionEnabled()` checking `VITE_PROGRESSION_ENABLED` env var and localStorage fallback
    - Implement `setProgressionEnabled(enabled: boolean)` for runtime toggling
    - Export the `PROGRESSION_STORAGE_KEY` constant
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 4. Type definitions and progression evaluator
  - [ ] 4.1 Create `src/types/progression.ts` with all type definitions
    - Define: `NodeState`, `UnlockCriteria`, `MasteryCriteria`, `SkillNode`, `PrerequisiteGroup`, `UserNodeState`, `CompletedSet`, `WorkoutExerciseData`, `WorkoutEvalInput`, `EvaluationInput`, `NodeTransition`, `EvidenceSnapshot`, `EvaluationOutput`, `MomentumEntry`, `MomentumConfig`
    - _Requirements: 3.1, 4.1, 7.8_

  - [ ] 4.2 Create `src/lib/progression-evaluator.ts` — core pure functions
    - Implement `arePrerequisitesSatisfied(node, states)`: check AND/OR prerequisite group logic
    - Implement `isUnlockCriteriaMet(criteria, exerciseSets)`: evaluate reps/hold/sets_at_reps against completed sets only
    - Implement `isMasteryCriteriaMet(criteria, exerciseSets)`: same logic with mastery thresholds
    - Implement `calculateWorkoutMomentum(workout, config)`: base + variety bonus with diminishing returns and cap
    - Implement `evaluateWorkout(input)`: topological-order evaluation producing transitions and momentum entries
    - All functions must be pure — no side effects, no network calls, no randomness
    - Filter out incomplete sets (completed === false) before evaluation
    - Process nodes in topological order for cascading unlocks within a single pass
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.3, 4.4, 4.5, 7.2, 7.5, 7.6, 8.2, 8.3, 8.5, 10.1, 10.2, 10.4_

- [ ] 5. Checkpoint — Verify evaluator logic
  - Ensure the build passes (`tsc -b && vite build`), ask the user if questions arise.

- [ ] 6. TanStack Query hooks
  - [ ] 6.1 Create `src/hooks/useSkillPaths.ts`
    - Fetch `skill_paths` joined with `skill_nodes` and `skill_node_prerequisites`
    - Use `staleTime: 24h` since seed data rarely changes
    - Return structured path + node + prerequisite data
    - _Requirements: 2.1, 2.3_

  - [ ] 6.2 Create `src/hooks/useNodeProgress.ts`
    - Fetch `user_skill_progress` for the authenticated user
    - Return a Map of nodeId → UserNodeState
    - _Requirements: 3.1_

  - [ ] 6.3 Create `src/hooks/useMomentum.ts`
    - Query `momentum_ledger` with SUM(points) for the authenticated user
    - Return total momentum score
    - _Requirements: 7.1, 7.8_

  - [ ] 6.4 Create `src/hooks/useProgressionEval.ts`
    - Implement `evaluateAndPersistProgression` mutation function
    - Reads current node states + skill nodes from query cache
    - Calls `evaluateWorkout()` pure function
    - Persists transitions via UPSERT to `user_skill_progress`
    - Inserts evidence to `skill_evidence` for unlocks
    - Appends momentum entries to `momentum_ledger`
    - Invalidates `node-progress` and `momentum` queries on success
    - Queues to localStorage if offline (pending sync)
    - _Requirements: 3.6, 4.1, 7.2, 7.5, 9.1, 9.4_

- [ ] 7. Post-workout integration
  - [ ] 7.1 Integrate progression evaluation into `src/hooks/useFinishWorkout.ts`
    - After existing PR detection step, check `isProgressionEnabled()`
    - If enabled, call `evaluateAndPersistProgression` with the completed workout data
    - Pass node transitions back for celebration UI
    - Short-circuit with no-op if feature flag is disabled
    - _Requirements: 1.1, 1.2, 1.3, 3.6, 11.3_

- [ ] 8. Checkpoint — Verify hooks and integration
  - Ensure the build passes, ask the user if questions arise.

- [ ] 9. UI: Progress page with Paths tab
  - [ ] 9.1 Create `src/pages/ProgressPage.tsx` with tab layout
    - Register route conditionally in `App.tsx` behind `isProgressionEnabled()`
    - Implement tab bar with "Paths" active (Trials and Milestones tabs shown as "Coming Soon" or hidden)
    - Add `MomentumBar` component at the top showing total momentum score
    - Add the route to `BottomNavigation.tsx` with a progression icon (conditionally rendered)
    - _Requirements: 1.1, 7.1_

  - [ ] 9.2 Create `src/components/progression/PathSelector.tsx`
    - Horizontal scrollable list of path icons/names
    - Highlight the currently selected path
    - Use data from `useSkillPaths` hook
    - _Requirements: 2.1_

  - [ ] 9.3 Create `src/components/progression/SkillTreeCanvas.tsx`
    - Render nodes as positioned circles/cards in a vertical layout
    - Style nodes by state: locked=dim, available=glow-border, in_progress=pulse, unlocked=solid, mastered=gold
    - Draw prerequisite edges as connecting lines between nodes
    - Use the existing dark theme + glass-card pattern (`backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl`)
    - _Requirements: 3.1, 2.3_

  - [ ] 9.4 Create `src/components/progression/NodeDetailSheet.tsx`
    - Bottom sheet triggered on node tap
    - Show node name, description, current state, unlock criteria (human-readable), mastery criteria
    - Show evidence snapshot if node is unlocked/mastered
    - Show prerequisite status (which prereqs are met/unmet)
    - _Requirements: 3.1, 4.1, 4.2_

- [ ] 10. UI: Momentum display and celebrations
  - [ ] 10.1 Create `src/components/progression/MomentumBar.tsx`
    - Display total momentum as a header bar element
    - Use indigo/violet accent colors per design system
    - Show momentum gained from last workout as a +N indicator
    - _Requirements: 7.1, 12.1_

  - [ ] 10.2 Add node-unlock celebration to the post-workout flow
    - When `evaluateAndPersistProgression` returns transitions with unlocks, show a celebration notification
    - Reuse the existing `PRCelebration` pattern/animation style
    - _Requirements: 12.5_

- [ ] 11. Final checkpoint — Build verification and feature flag
  - [ ] 11.1 Run full build (`tsc -b && vite build`) and fix any type or import errors
    - Verify all new files compile without errors
    - Verify no regressions in existing components
    - _Requirements: 1.1, 11.3_

  - [ ] 11.2 Enable the feature flag and verify the Progress page renders
    - Set `VITE_PROGRESSION_ENABLED=true` in `.env`
    - Verify route registration, tab rendering, and hook data loading
    - Ensure the feature is fully gated and disabling the flag hides all progression UI
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

## Notes

- Phase 1 scope: Paths + basic Momentum only. Trials (Req 5) and Milestones (Req 6) tables are created but left empty — UI tabs show "Coming Soon".
- Cosmetic rewards (Req 12) are partially addressed via node state styling and celebration notifications.
- Offline sync (Req 9) is handled via localStorage queue in the eval hook; full sync engine extension is deferred.
- No property-based tests in this phase — focus is on getting core functionality working end-to-end.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation via `tsc -b && vite build`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "4.2"] },
    { "id": 2, "tasks": ["2.4", "6.1", "6.2", "6.3"] },
    { "id": 3, "tasks": ["6.4"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["9.1", "10.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "9.4", "10.2"] },
    { "id": 7, "tasks": ["11.1", "11.2"] }
  ]
}
```
