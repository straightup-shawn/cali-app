# Requirements Document

## Introduction

The Calisthenics Progression System adds gamification and structured progression to the existing workout logging application. It comprises four subsystems: Paths (skill trees with prerequisite-based node unlocking), Trials (deterministic challenge generation), Milestones (permanent achievements derived from workout history), and Momentum (non-competitive XP scoring). The system is designed to be fully deterministic, offline-safe, evidence-based, and non-punitive. It operates behind a feature flag and must not interfere with existing workout logging functionality.

## Glossary

- **Progression_System**: The overarching gamification feature encompassing Paths, Trials, Milestones, and Momentum subsystems
- **Path**: A directed acyclic graph (DAG) of Skill Nodes representing a progression chain for a movement family (e.g., Push, Pull, Squat)
- **Skill_Node**: A single node within a Path, mapped to a canonical exercise, with a state and prerequisite conditions
- **Node_State**: One of five states a Skill Node occupies: locked, available, in_progress, unlocked, or mastered
- **Prerequisite_Group**: A logical grouping (AND or OR) of conditions that must be satisfied before a Skill Node becomes available
- **Unlock_Criteria**: Deterministic, evidence-based conditions (reps, hold duration, sets) required to transition a Skill Node from in_progress to unlocked
- **Evidence_Snapshot**: An immutable record of the workout data that satisfied Unlock Criteria at the moment of evaluation
- **Trial**: A time-bound challenge generated deterministically from a template, offering Momentum rewards upon completion
- **Trial_Template**: A parameterized definition from which Trials are generated, specifying type, conditions, and reward values
- **Milestone**: A permanent achievement awarded when specific historical conditions are met, never revoked
- **Milestone_Family**: A group of tiered Milestones sharing the same measurement dimension (e.g., "Total Pull-ups: 100 / 500 / 1000")
- **Momentum**: A non-competitive, append-only progression score representing cumulative engagement
- **Momentum_Ledger**: An immutable append-only log of all Momentum transactions with source attribution
- **Feature_Flag**: A configuration toggle controlling visibility and activation of the Progression System
- **Evaluator**: The deterministic client-side module that computes node state transitions, trial completion, and milestone satisfaction
- **Sync_Engine**: The mechanism responsible for reconciling local progression state with the remote Supabase database

## Requirements

### Requirement 1: Feature Flag Isolation

**User Story:** As a developer, I want the progression system gated behind a feature flag, so that it can be developed and tested without affecting existing users.

#### Acceptance Criteria

1. THE Progression_System SHALL be hidden from all UI surfaces and inactive when the Feature_Flag is disabled.
2. WHILE the Feature_Flag is disabled, THE Progression_System SHALL not execute any evaluation logic or write any progression-related data.
3. WHEN the Feature_Flag is enabled, THE Progression_System SHALL initialize progression state for the authenticated user without modifying existing workout, exercise, or personal record data.
4. THE Progression_System SHALL store the Feature_Flag value in application configuration accessible at build time and runtime.

---

### Requirement 2: Path Definition and Structure

**User Story:** As a calisthenics practitioner, I want to see structured skill trees for each movement family, so that I understand the progression journey ahead of me.

#### Acceptance Criteria

1. THE Progression_System SHALL define a minimum of 9 Paths covering distinct movement families.
2. THE Progression_System SHALL contain a minimum of 70 Skill Nodes distributed across all Paths.
3. WHEN a Path is defined, THE Progression_System SHALL model the Path as a directed acyclic graph where edges represent prerequisite relationships.
4. THE Progression_System SHALL map each Skill Node to exactly one canonical exercise from the exercises table.
5. THE Progression_System SHALL define each Prerequisite_Group using AND logic (all conditions required) or OR logic (any single condition sufficient).
6. THE Progression_System SHALL support Skill Nodes with multiple Prerequisite_Groups allowing compound prerequisite logic.

---

### Requirement 3: Skill Node State Management

**User Story:** As a user, I want to see which skills I have unlocked and which are available to work toward, so that I can plan my training.

#### Acceptance Criteria

1. THE Progression_System SHALL assign each Skill_Node exactly one Node_State from: locked, available, in_progress, unlocked, or mastered.
2. WHEN all Prerequisite_Groups for a Skill_Node are satisfied, THE Evaluator SHALL transition the Skill_Node from locked to available.
3. WHEN the user logs a completed set for the exercise mapped to an available Skill_Node, THE Evaluator SHALL transition the Skill_Node to in_progress.
4. WHEN the Unlock_Criteria for an in_progress Skill_Node are fully satisfied within a single workout, THE Evaluator SHALL transition the Skill_Node to unlocked.
5. WHEN a user meets the mastery threshold for an unlocked Skill_Node, THE Evaluator SHALL transition the Skill_Node to mastered.
6. THE Evaluator SHALL evaluate Node_State transitions only at workout completion, not on a per-set or per-rep basis during an active workout.
7. THE Evaluator SHALL produce identical state transition results given identical input data regardless of execution environment or timing.

---

### Requirement 4: Evidence-Based Unlock Verification

**User Story:** As a user, I want skill unlocks to reflect genuine capability, so that progression feels meaningful and earned.

#### Acceptance Criteria

1. WHEN a Skill_Node transitions to unlocked, THE Progression_System SHALL create an Evidence_Snapshot containing the workout ID, exercise sets data, and timestamp of evaluation.
2. THE Unlock_Criteria SHALL require performance thresholds (minimum reps, minimum hold duration, or minimum sets at threshold) that demonstrate skill competency rather than volume accumulation.
3. THE Progression_System SHALL not count partial or incomplete sets toward Unlock_Criteria satisfaction.
4. THE Progression_System SHALL evaluate Unlock_Criteria against data from a single workout session, not aggregated across multiple sessions.
5. IF the workout data does not satisfy all conditions in the Unlock_Criteria within one session, THEN THE Evaluator SHALL retain the Skill_Node in the in_progress state without partial credit.

---

### Requirement 5: Trial Generation and Lifecycle

**User Story:** As a user, I want periodic challenges to keep training interesting and earn extra progression, so that I stay motivated between skill unlocks.

#### Acceptance Criteria

1. THE Progression_System SHALL support four Trial types: session trials, weekly trials, path quests, and boss trials.
2. WHEN a Trial is generated, THE Progression_System SHALL produce the Trial deterministically from a Trial_Template using the user's current progression state and a time-based seed.
3. THE Progression_System SHALL allow the user to dismiss an active Trial without penalty.
4. THE Progression_System SHALL allow the user to pause an active weekly Trial, preserving progress toward completion.
5. THE Progression_System SHALL allow the user to reroll a Trial once per generation cycle, producing a new deterministic Trial from the same seed plus a reroll counter.
6. WHEN a Trial is completed, THE Evaluator SHALL verify completion conditions deterministically against logged workout data.
7. WHEN a Trial is completed, THE Progression_System SHALL award the Momentum value specified by the Trial_Template.

---

### Requirement 6: Milestone Definition and Evaluation

**User Story:** As a user, I want permanent achievements that recognize my training history, so that I feel rewarded for long-term consistency and accomplishment.

#### Acceptance Criteria

1. THE Progression_System SHALL define a minimum of 25 Milestones across categories: performance, skill, progress, work capacity, consistency, exploration, and legendary.
2. THE Progression_System SHALL organize related Milestones into Milestone_Families with increasing tier thresholds.
3. WHEN a Milestone condition is satisfied, THE Progression_System SHALL award the Milestone permanently and never revoke the award.
4. WHEN the Progression_System is enabled for the first time, THE Evaluator SHALL perform retroactive backfill by evaluating all existing workout history against Milestone conditions.
5. THE Evaluator SHALL evaluate Milestone conditions after each completed workout and after retroactive backfill.
6. THE Progression_System SHALL not require daily consecutive activity (streaks) as a condition for any Milestone.

---

### Requirement 7: Momentum Scoring

**User Story:** As a user, I want a non-competitive score that grows as I train, so that I have a sense of overall progress without pressure to compete.

#### Acceptance Criteria

1. THE Progression_System SHALL maintain a Momentum_Ledger as an immutable append-only log of all Momentum transactions.
2. WHEN a user completes a workout, THE Progression_System SHALL append a Momentum transaction to the Momentum_Ledger with the workout ID as source.
3. WHEN a user completes a Trial, THE Progression_System SHALL append a Momentum transaction with the Trial ID as source.
4. WHEN a user achieves a new personal record, THE Progression_System SHALL append a Momentum transaction with the personal record ID as source.
5. WHEN a user unlocks a Skill_Node, THE Progression_System SHALL append a Momentum transaction with the Skill_Node ID as source.
6. THE Progression_System SHALL calculate Momentum reward for workouts based on exercise variety and session quality, not on raw repetition count or total volume.
7. THE Progression_System SHALL not deduct or decay Momentum under any circumstances.
8. THE Momentum_Ledger SHALL record the transaction source type, source ID, point value, and timestamp for each entry.

---

### Requirement 8: Anti-Farming Protection

**User Story:** As a product owner, I want to prevent users from gaming the system through repetitive low-effort actions, so that progression represents genuine skill development.

#### Acceptance Criteria

1. THE Progression_System SHALL not grant Skill_Node state transitions based solely on repetition volume without quality thresholds.
2. THE Progression_System SHALL cap Momentum earned per workout to a configurable maximum value regardless of workout duration or volume.
3. THE Progression_System SHALL apply diminishing Momentum returns for repeated identical exercises within a single workout.
4. THE Evaluator SHALL require minimum performance standards (reps-at-threshold or hold-duration-at-threshold) rather than cumulative totals for Unlock_Criteria.
5. THE Progression_System SHALL not reward Momentum for workouts containing fewer than a configurable minimum number of completed sets.

---

### Requirement 9: Offline Safety and Sync

**User Story:** As a user who sometimes trains without internet, I want progression to evaluate locally and sync when connectivity returns, so that my progress is never lost.

#### Acceptance Criteria

1. THE Evaluator SHALL execute all state transition logic on the client without requiring network connectivity.
2. WHEN network connectivity is restored, THE Sync_Engine SHALL reconcile local progression state with the remote database using idempotent operations.
3. IF a sync conflict occurs between local and remote state, THEN THE Sync_Engine SHALL resolve the conflict by accepting the state that grants more progression (last-write-wins favoring advancement).
4. THE Sync_Engine SHALL persist all pending progression state changes in local storage until successful remote sync confirmation.
5. THE Progression_System SHALL generate identical evaluation results regardless of whether the device is online or offline at the time of workout completion.

---

### Requirement 10: Deterministic Evaluation

**User Story:** As a developer, I want all progression evaluations to be deterministic and reproducible, so that the system is testable and predictable.

#### Acceptance Criteria

1. THE Evaluator SHALL produce identical outputs given identical inputs for node state transitions, trial generation, milestone checks, and momentum calculations.
2. THE Evaluator SHALL not use AI inference, random number generation, or network-dependent data during evaluation.
3. WHEN generating Trials, THE Evaluator SHALL use a deterministic seed derived from user ID, current date, and progression state to produce reproducible results.
4. THE Evaluator SHALL execute evaluation as a pure function of workout data and current progression state with no side effects on the input data.

---

### Requirement 11: Data Integrity and Separation

**User Story:** As a developer, I want progression data fully separated from core workout data, so that the feature can be disabled or removed without data loss in the core system.

#### Acceptance Criteria

1. THE Progression_System SHALL store all progression state (node states, trial progress, milestones, momentum ledger) in dedicated tables separate from existing workout tables.
2. THE Progression_System SHALL reference existing tables (workouts, exercises, exercise_sets, personal_records) via foreign keys for read access only.
3. THE Progression_System SHALL not modify any data in the existing workouts, workout_exercises, exercise_sets, exercises, or personal_records tables.
4. WHEN the Feature_Flag is disabled, THE Progression_System SHALL leave all progression data intact in storage for future re-enablement.
5. THE Progression_System SHALL enforce referential integrity between progression records and the workout or exercise records they reference.

---

### Requirement 12: Cosmetic Rewards

**User Story:** As a user, I want visual rewards tied to my progression, so that achievements feel tangible within the app.

#### Acceptance Criteria

1. WHEN a user reaches defined Momentum thresholds, THE Progression_System SHALL unlock cosmetic rewards (profile badges, theme accents, or node visual states).
2. THE Progression_System SHALL use Momentum exclusively for cosmetic unlocks with no gameplay or functional advantage.
3. THE Progression_System SHALL not implement any social, competitive, or comparative features between users.
4. WHEN a Milestone is awarded, THE Progression_System SHALL display a one-time celebration notification to the user.
5. WHEN a Skill_Node is unlocked, THE Progression_System SHALL display a one-time celebration notification to the user.

---

### Requirement 13: Non-Punitive Design

**User Story:** As a user, I want to never feel punished for taking rest days or breaks, so that the system supports healthy training habits.

#### Acceptance Criteria

1. THE Progression_System SHALL not implement any mechanic that decays, reduces, or removes earned progression due to inactivity.
2. THE Progression_System SHALL not implement daily streak mechanics that create loss aversion.
3. THE Progression_System SHALL allow trial dismissal and pause without any negative impact on earned Momentum, Milestones, or Node_States.
4. THE Progression_System SHALL present progression as cumulative achievement without time-pressure mechanics.
