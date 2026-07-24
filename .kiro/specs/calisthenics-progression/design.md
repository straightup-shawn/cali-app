# Design Document: Calisthenics Progression System

## Overview

This document defines the architecture for the Calisthenics Progression System — a gamification layer that adds structured skill trees, deterministic challenges, permanent achievements, and non-competitive scoring to the existing calisthenics workout tracker. The design targets Phase 1 (Paths + basic Momentum) as the MVP, with clear extension points for Trials and Milestones.

## Architecture

The system follows a **pure evaluator + reactive UI** pattern:

1. **Progression Evaluator** — A pure-function TypeScript module (`src/lib/progression-evaluator.ts`) that computes all state transitions without side effects or network calls.
2. **Database Layer** — 11 new Supabase tables storing progression state, isolated from existing workout tables via read-only FK references.
3. **Hook Layer** — TanStack Query hooks (`src/hooks/useProgression*.ts`) for data fetching and mutations, following the existing project pattern.
4. **Post-Workout Integration** — A hook into the existing `useFinishWorkout` flow that triggers evaluation after workout completion.
5. **UI Layer** — New `/progress` route with tab-based navigation, skill tree visualization, and glass-card detail sheets.
6. **Feature Flag** — localStorage + `VITE_PROGRESSION_ENABLED` env var controlling all entry points.

```
┌────────────────────────────────────────────────────────────┐
│                        UI Layer                            │
│  /progress route → Paths tab / Trials tab / Milestones tab│
│  Skill tree SVG canvas + Node detail bottom sheet         │
└───────────────────────────┬────────────────────────────────┘
                            │ reads via TanStack Query
┌───────────────────────────▼────────────────────────────────┐
│                     Hook Layer                              │
│  useSkillPaths · useNodeProgress · useMomentum             │
│  useTrials · useMilestones · useProgressionEval            │
└───────────────────────────┬────────────────────────────────┘
                            │ calls pure evaluator
┌───────────────────────────▼────────────────────────────────┐
│              Progression Evaluator (pure)                   │
│  evaluateNodes · evaluateTrials · evaluateMilestones       │
│  calculateMomentum · generateTrial                         │
└───────────────────────────┬────────────────────────────────┘
                            │ reads/writes
┌───────────────────────────▼────────────────────────────────┐
│                   Supabase (11 tables)                      │
│  skill_paths · skill_nodes · skill_node_prerequisites      │
│  user_skill_progress · skill_evidence · user_path_targets  │
│  challenge_templates · user_challenges                     │
│  achievement_definitions · user_achievements               │
│  momentum_ledger                                           │
└────────────────────────────────────────────────────────────┘
```

---

## Feature Flag

### Implementation

```typescript
// src/lib/feature-flags.ts

const PROGRESSION_STORAGE_KEY = 'progression_enabled';

export function isProgressionEnabled(): boolean {
  // Build-time flag takes precedence
  if (import.meta.env.VITE_PROGRESSION_ENABLED === 'true') return true;
  if (import.meta.env.VITE_PROGRESSION_ENABLED === 'false') return false;
  // Runtime toggle via localStorage
  return localStorage.getItem(PROGRESSION_STORAGE_KEY) === 'true';
}

export function setProgressionEnabled(enabled: boolean): void {
  localStorage.setItem(PROGRESSION_STORAGE_KEY, String(enabled));
}
```

### Guard Pattern

All progression entry points (routes, hooks, post-workout evaluation) check `isProgressionEnabled()` before executing. The `/progress` route is conditionally registered in `App.tsx`. The post-workout hook short-circuits if disabled.

---

## Data Models

### Database Tables

#### 1. `skill_paths`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| slug | text | NOT NULL, UNIQUE |
| name | text | NOT NULL |
| description | text | |
| icon | text | NOT NULL |
| sort_order | integer | NOT NULL DEFAULT 0 |
| created_at | timestamptz | NOT NULL DEFAULT now() |

#### 2. `skill_nodes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| path_id | uuid | NOT NULL FK → skill_paths(id) ON DELETE CASCADE |
| exercise_id | uuid | NOT NULL FK → exercises(id) ON DELETE RESTRICT |
| name | text | NOT NULL |
| description | text | |
| tier | integer | NOT NULL (1-5, difficulty tier within path) |
| sort_order | integer | NOT NULL DEFAULT 0 |
| unlock_criteria | jsonb | NOT NULL |
| mastery_criteria | jsonb | |
| momentum_reward | integer | NOT NULL DEFAULT 10 |
| created_at | timestamptz | NOT NULL DEFAULT now() |

`unlock_criteria` JSONB schema:
```json
{
  "type": "reps" | "hold" | "sets_at_reps",
  "min_reps": 8,
  "min_sets": 3,
  "min_hold_seconds": 30
}
```

#### 3. `skill_node_prerequisites`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| node_id | uuid | NOT NULL FK → skill_nodes(id) ON DELETE CASCADE |
| required_node_id | uuid | NOT NULL FK → skill_nodes(id) ON DELETE CASCADE |
| group_id | integer | NOT NULL (groups prerequisites into AND/OR sets) |
| group_logic | text | NOT NULL CHECK (IN ('and', 'or')) |

*Prerequisite semantics*: All prerequisites within the same `group_id` use the group's logic. A node becomes available when **all** groups are satisfied (groups are ANDed together).

#### 4. `user_skill_progress`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL FK → profiles(id) ON DELETE CASCADE |
| node_id | uuid | NOT NULL FK → skill_nodes(id) ON DELETE CASCADE |
| state | text | NOT NULL CHECK (IN ('locked','available','in_progress','unlocked','mastered')) DEFAULT 'locked' |
| unlocked_at | timestamptz | |
| mastered_at | timestamptz | |
| updated_at | timestamptz | NOT NULL DEFAULT now() |
| UNIQUE(user_id, node_id) | | |

#### 5. `skill_evidence`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL FK → profiles(id) ON DELETE CASCADE |
| node_id | uuid | NOT NULL FK → skill_nodes(id) ON DELETE CASCADE |
| workout_id | uuid | NOT NULL FK → workouts(id) ON DELETE SET NULL |
| sets_data | jsonb | NOT NULL |
| evaluated_at | timestamptz | NOT NULL DEFAULT now() |

#### 6. `user_path_targets`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL FK → profiles(id) ON DELETE CASCADE |
| path_id | uuid | NOT NULL FK → skill_paths(id) ON DELETE CASCADE |
| target_node_id | uuid | FK → skill_nodes(id) ON DELETE SET NULL |
| pinned | boolean | NOT NULL DEFAULT false |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| UNIQUE(user_id, path_id) | | |

#### 7. `challenge_templates` (Phase 2)
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| type | text | NOT NULL CHECK (IN ('session','weekly','path_quest','boss')) |
| name | text | NOT NULL |
| description_template | text | NOT NULL |
| conditions | jsonb | NOT NULL |
| momentum_reward | integer | NOT NULL |
| min_tier | integer | NOT NULL DEFAULT 1 |
| path_id | uuid | FK → skill_paths(id) ON DELETE SET NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |

#### 8. `user_challenges` (Phase 2)
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL FK → profiles(id) ON DELETE CASCADE |
| template_id | uuid | NOT NULL FK → challenge_templates(id) ON DELETE CASCADE |
| status | text | NOT NULL CHECK (IN ('active','paused','completed','dismissed','expired')) |
| progress | jsonb | NOT NULL DEFAULT '{}' |
| seed | text | NOT NULL |
| reroll_count | integer | NOT NULL DEFAULT 0 |
| started_at | timestamptz | NOT NULL DEFAULT now() |
| completed_at | timestamptz | |
| expires_at | timestamptz | |

#### 9. `achievement_definitions` (Phase 3)
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| slug | text | NOT NULL, UNIQUE |
| name | text | NOT NULL |
| description | text | NOT NULL |
| category | text | NOT NULL CHECK (IN ('performance','skill','progress','work_capacity','consistency','exploration','legendary')) |
| family | text | |
| tier | integer | NOT NULL DEFAULT 1 |
| conditions | jsonb | NOT NULL |
| momentum_reward | integer | NOT NULL DEFAULT 5 |
| icon | text | NOT NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |

#### 10. `user_achievements` (Phase 3)
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL FK → profiles(id) ON DELETE CASCADE |
| achievement_id | uuid | NOT NULL FK → achievement_definitions(id) ON DELETE CASCADE |
| awarded_at | timestamptz | NOT NULL DEFAULT now() |
| workout_id | uuid | FK → workouts(id) ON DELETE SET NULL |
| UNIQUE(user_id, achievement_id) | | |

#### 11. `momentum_ledger`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL FK → profiles(id) ON DELETE CASCADE |
| source_type | text | NOT NULL CHECK (IN ('workout','trial','personal_record','node_unlock','milestone','backfill')) |
| source_id | uuid | NOT NULL |
| points | integer | NOT NULL CHECK (points > 0) |
| created_at | timestamptz | NOT NULL DEFAULT now() |

*Note*: The `points > 0` constraint enforces append-only positive entries at the database level, preventing deductions.

---

### RLS Policies

All 11 tables enable Row-Level Security. Policies follow the existing app pattern:
- System/seed data tables (`skill_paths`, `skill_nodes`, `skill_node_prerequisites`, `challenge_templates`, `achievement_definitions`): SELECT for all authenticated users; no INSERT/UPDATE/DELETE by clients.
- User-scoped tables (`user_skill_progress`, `skill_evidence`, `user_path_targets`, `user_challenges`, `user_achievements`, `momentum_ledger`): Full CRUD restricted to `auth.uid() = user_id`.

### Indexes

```sql
-- High-frequency lookups
CREATE INDEX idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX idx_user_skill_progress_node ON user_skill_progress(node_id);
CREATE INDEX idx_skill_nodes_path ON skill_nodes(path_id);
CREATE INDEX idx_skill_nodes_exercise ON skill_nodes(exercise_id);
CREATE INDEX idx_skill_node_prerequisites_node ON skill_node_prerequisites(node_id);
CREATE INDEX idx_momentum_ledger_user ON momentum_ledger(user_id);
CREATE INDEX idx_momentum_ledger_created ON momentum_ledger(user_id, created_at);
CREATE INDEX idx_skill_evidence_user_node ON skill_evidence(user_id, node_id);
```

---

## Components and Interfaces

### Progression Evaluator

#### Module: `src/lib/progression-evaluator.ts`

The evaluator is a **pure function module** — no imports from Supabase, no side effects, no randomness. It receives structured input and returns computed output.

### Type Definitions

```typescript
// src/types/progression.ts

export type NodeState = 'locked' | 'available' | 'in_progress' | 'unlocked' | 'mastered';

export interface UnlockCriteria {
  type: 'reps' | 'hold' | 'sets_at_reps';
  min_reps?: number;       // minimum reps per set
  min_sets?: number;       // minimum number of qualifying sets
  min_hold_seconds?: number; // minimum hold duration per set
}

export interface MasteryCriteria {
  type: 'reps' | 'hold' | 'sets_at_reps';
  min_reps?: number;
  min_sets?: number;
  min_hold_seconds?: number;
}

export interface SkillNode {
  id: string;
  pathId: string;
  exerciseId: string;
  name: string;
  tier: number;
  unlockCriteria: UnlockCriteria;
  masteryCriteria: MasteryCriteria | null;
  momentumReward: number;
  prerequisites: PrerequisiteGroup[];
}

export interface PrerequisiteGroup {
  groupId: number;
  logic: 'and' | 'or';
  requiredNodeIds: string[];
}

export interface UserNodeState {
  nodeId: string;
  state: NodeState;
  unlockedAt: string | null;
  masteredAt: string | null;
}

export interface CompletedSet {
  completed: boolean;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
}

export interface WorkoutExerciseData {
  exerciseId: string;
  sets: CompletedSet[];
}

export interface WorkoutEvalInput {
  workoutId: string;
  completedAt: string;
  exercises: WorkoutExerciseData[];
}

export interface EvaluationInput {
  nodes: SkillNode[];
  currentStates: UserNodeState[];
  workout: WorkoutEvalInput;
}

export interface NodeTransition {
  nodeId: string;
  fromState: NodeState;
  toState: NodeState;
  evidence?: EvidenceSnapshot;
}

export interface EvidenceSnapshot {
  workoutId: string;
  setsData: CompletedSet[];
  evaluatedAt: string;
}

export interface EvaluationOutput {
  transitions: NodeTransition[];
  momentumEntries: MomentumEntry[];
}

export interface MomentumEntry {
  sourceType: 'workout' | 'node_unlock' | 'personal_record' | 'trial' | 'milestone';
  sourceId: string;
  points: number;
}
```

### Core Functions

```typescript
// src/lib/progression-evaluator.ts

/**
 * Main entry point. Evaluates a completed workout against current progression state.
 * Returns state transitions and momentum entries to persist.
 * 
 * PURE FUNCTION: No side effects, no network calls, deterministic.
 */
export function evaluateWorkout(input: EvaluationInput): EvaluationOutput;

/**
 * Checks if a node's prerequisite groups are all satisfied
 * given the current user node states.
 */
export function arePrerequisitesSatisfied(
  node: SkillNode,
  states: Map<string, NodeState>
): boolean;

/**
 * Evaluates unlock criteria against workout exercise data.
 * Only counts completed sets. Returns true if ALL criteria thresholds met.
 */
export function isUnlockCriteriaMet(
  criteria: UnlockCriteria,
  exerciseSets: CompletedSet[]
): boolean;

/**
 * Evaluates mastery criteria (same logic as unlock but higher thresholds).
 */
export function isMasteryCriteriaMet(
  criteria: MasteryCriteria,
  exerciseSets: CompletedSet[]
): boolean;

/**
 * Calculates momentum reward for a workout based on exercise variety
 * and session quality. Applies diminishing returns and caps.
 */
export function calculateWorkoutMomentum(
  workout: WorkoutEvalInput,
  config: MomentumConfig
): number;
```

### Momentum Calculation Algorithm

```typescript
export interface MomentumConfig {
  basePointsPerExercise: number;     // default: 3
  varietyBonusPerUnique: number;     // default: 2
  diminishingFactor: number;         // default: 0.5 (halves each repeat)
  maxPointsPerWorkout: number;       // default: 50
  minimumCompletedSets: number;      // default: 3
}

/**
 * Algorithm:
 * 1. Filter to completed sets only
 * 2. If total completed sets < minimumCompletedSets → return 0
 * 3. For each unique exercise: base points + variety bonus
 * 4. For repeated exercises: apply diminishing factor per occurrence
 *    (2nd occurrence = base * 0.5, 3rd = base * 0.25, etc.)
 * 5. Cap total at maxPointsPerWorkout
 */
```

### State Machine

Node state transitions follow a strict forward-only machine:

```
locked → available → in_progress → unlocked → mastered
```

Transition rules (evaluated in order at workout completion):
1. **locked → available**: `arePrerequisitesSatisfied(node, currentStates)` returns true
2. **available → in_progress**: Workout contains ≥1 completed set for the node's mapped exercise
3. **in_progress → unlocked**: `isUnlockCriteriaMet(node.unlockCriteria, exerciseSets)` returns true
4. **unlocked → mastered**: `isMasteryCriteriaMet(node.masteryCriteria, exerciseSets)` returns true

Nodes at tier 1 with no prerequisites start as `available`. The evaluator processes all nodes in topological order (prerequisites before dependents) to handle cascading unlocks within a single evaluation pass.

---

## Seed Data

### Structure

Seed data lives in `supabase/seeds/progression/` as versioned JSON files:

```
supabase/seeds/progression/
├── paths.json          # 9 path definitions
├── nodes.json          # 70+ node definitions with unlock_criteria
├── prerequisites.json  # prerequisite edges
└── version.json        # schema version for migration compatibility
```

### Path Definitions (Phase 1 — 9 Paths)

| # | Path | Nodes | Key Exercises |
|---|------|-------|---------------|
| 1 | Push | 7 | Wall push-up → One-arm push-up |
| 2 | Pull | 7 | Dead hang → Muscle-up |
| 3 | Squat | 6 | Assisted squat → Shrimp squat |
| 4 | Core | 7 | Dead bug → Front lever |
| 5 | Dip | 4 | Bench dip → Weighted dip |
| 6 | Handstand | 5 | Wall HS hold → HS push-up (with pike progressions) |
| 7 | Planche | 5 | Plank lean → Full planche |
| 8 | Back Lever | 5 | Tuck BL → Full back lever |
| 9 | Flexibility | 8+ | Pancake, pike, bridge progressions |

Nodes map 1:1 to existing exercise IDs from `seed.sql` where available. New exercises required for Paths 7-9 are added in a separate migration.

### Unlock Criteria Examples

| Node | Criteria Type | Threshold |
|------|--------------|-----------|
| Push-up | sets_at_reps | 3 sets × 8 reps |
| Diamond Push-up | sets_at_reps | 3 sets × 6 reps |
| Pull-up | sets_at_reps | 3 sets × 5 reps |
| Plank | hold | 60 seconds |
| L-sit | hold | 15 seconds |
| Pistol Squat | sets_at_reps | 2 sets × 3 reps per leg |

---

## Integration Points

### Post-Workout Evaluation Hook

The existing `useFinishWorkout` hook is extended with a progression evaluation step:

```typescript
// In useFinishWorkout.ts — after PR detection (Step 3)

// Step 4: Progression evaluation (if enabled)
if (isProgressionEnabled()) {
  const evalResult = await evaluateAndPersistProgression(result.workoutId, workoutData);
  // evalResult contains transitions and momentum entries
  // Trigger celebration UI for any node unlocks
}
```

The `evaluateAndPersistProgression` function:
1. Fetches current user node states + skill nodes from local cache (TanStack Query)
2. Calls `evaluateWorkout()` (pure function)
3. Persists transitions to `user_skill_progress` and `skill_evidence`
4. Appends momentum entries to `momentum_ledger`
5. Returns results for UI celebration

### Offline Flow

When offline, progression evaluation still runs (pure function). Results are stored in localStorage alongside the pending workout sync. When connectivity returns, the existing `useSyncManager` reconciles both workout data and progression state.

---

## UI Architecture

### Route Registration

```typescript
// In App.tsx — inside AppShell routes
const ProgressPage = lazy(() => import('@/pages/ProgressPage'));

// Conditionally rendered based on feature flag
{isProgressionEnabled() && (
  <Route path="/progress" element={<ProgressPage />} />
)}
```

### Tab Structure

| Tab | Phase | Content |
|-----|-------|---------|
| Paths | 1 (MVP) | Skill tree visualization per path, node states, momentum bar |
| Trials | 2 | Active challenges, trial cards, progress indicators |
| Milestones | 3 | Achievement grid, milestone families, celebration history |

### Skill Tree Visualization

Each path renders as a vertical DAG using positioned divs or SVG:
- Nodes display as circles with state-based styling (glass card aesthetic)
- Edges show prerequisite connections as lines/arrows
- Node colors: locked=dim, available=glow-border, in_progress=pulse, unlocked=solid, mastered=gold
- Tapping a node opens a bottom sheet with details, criteria, evidence

### Component Hierarchy

```
ProgressPage
├── MomentumBar (total score + level indicator)
├── TabBar (Paths | Trials | Milestones)
├── PathsTab
│   ├── PathSelector (horizontal scroll of path icons)
│   └── SkillTreeCanvas
│       ├── SkillNodeCircle × N
│       ├── PrerequisiteEdge × N
│       └── NodeDetailSheet (bottom sheet on tap)
├── TrialsTab (Phase 2)
│   ├── ActiveTrialCard
│   └── TrialHistoryList
└── MilestonesTab (Phase 3)
    ├── MilestoneCategoryGrid
    └── MilestoneDetailSheet
```

### Design System Integration

All components use the existing dark theme and glass-card pattern:
- `backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl`
- Indigo/violet accent colors for progression highlights
- Gold accent for mastered state
- Existing animation patterns (pulse, glow) for state feedback

---

## Data Flow: Workout Completion

```
User finishes workout
       │
       ▼
useFinishWorkout (existing)
       │
       ├── Save workout to Supabase
       ├── Detect personal records
       │
       ▼ (if progression enabled)
evaluateAndPersistProgression()
       │
       ├── Read: skill_nodes (cached), user_skill_progress, workout exercises
       │
       ▼
evaluateWorkout() ← PURE FUNCTION
       │
       ├── Compute node transitions (topological order)
       ├── Compute workout momentum (variety + diminishing returns)
       ├── Generate evidence snapshots for unlocks
       │
       ▼
Persist results
       │
       ├── UPSERT user_skill_progress (state transitions)
       ├── INSERT skill_evidence (for unlocks)
       ├── INSERT momentum_ledger entries
       │
       ▼
Return to UI → trigger celebration animations
```

---

## Sync Strategy

### Conflict Resolution

The sync engine uses **advancement-wins** strategy:

```typescript
function resolveConflict(local: UserNodeState, remote: UserNodeState): UserNodeState {
  const stateOrder: Record<NodeState, number> = {
    locked: 0, available: 1, in_progress: 2, unlocked: 3, mastered: 4
  };
  return stateOrder[local.state] >= stateOrder[remote.state] ? local : remote;
}
```

For the momentum ledger, idempotent inserts use `(user_id, source_type, source_id)` as a natural deduplication key with `ON CONFLICT DO NOTHING`.

### Local Storage Schema

```typescript
interface PendingProgressionSync {
  transitions: NodeTransition[];
  momentumEntries: MomentumEntry[];
  timestamp: string;
}
// Stored at key: `progression_pending_sync_${userId}`
```

---

## Hook Layer

Following the existing project's TanStack Query pattern:

```typescript
// src/hooks/useSkillPaths.ts
export function useSkillPaths() {
  return useQuery({
    queryKey: ['skill-paths'],
    queryFn: async () => { /* fetch skill_paths + skill_nodes + prerequisites */ },
    staleTime: 24 * 60 * 60 * 1000, // seed data rarely changes
  });
}

// src/hooks/useNodeProgress.ts
export function useNodeProgress(userId: string) {
  return useQuery({
    queryKey: ['node-progress', userId],
    queryFn: async () => { /* fetch user_skill_progress for user */ },
  });
}

// src/hooks/useMomentum.ts
export function useMomentum(userId: string) {
  return useQuery({
    queryKey: ['momentum', userId],
    queryFn: async () => {
      // SUM(points) from momentum_ledger where user_id = userId
    },
  });
}

// src/hooks/useProgressionEval.ts
export function useProgressionEval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: evaluateAndPersistProgression,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['node-progress'] });
      queryClient.invalidateQueries({ queryKey: ['momentum'] });
    },
  });
}
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Evaluator receives malformed input | Type validation via Zod schemas; throw if invalid |
| DB write fails during persist | Queue to local pending sync; retry on next connectivity |
| Sync conflict | Advancement-wins resolution (higher state wins) |
| Seed data references missing exercise | Migration validation catches FK violations at deploy time |
| Feature flag toggled mid-session | Guard checks on each hook/evaluation entry point |

---

## Extension Points

### Phase 2: Trials
- Add `challenge_templates` seed data
- Implement `generateTrial()` pure function using deterministic seeding
- Add `TrialsTab` component with active trial cards
- Hook into post-workout to check trial completion conditions

### Phase 3: Milestones
- Add `achievement_definitions` seed data (25+ definitions)
- Implement `evaluateMilestones()` pure function
- Retroactive backfill on first enable
- Add `MilestonesTab` component with achievement grid

### Phase 4: Cosmetic Rewards
- Define momentum thresholds for unlockable cosmetics
- Add profile badge display and theme accent options

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Evaluator Determinism (Idempotence)

*For any* valid `EvaluationInput` (skill nodes, current states, and workout data), calling `evaluateWorkout` multiple times with identical input SHALL produce byte-identical `EvaluationOutput` — the same transitions, same momentum entries, same evidence snapshots.

**Validates: Requirements 3.7, 9.5, 10.1, 10.4**

### Property 2: Node State Validity Invariant

*For any* evaluation output, every node referenced in transitions SHALL have exactly one state from the set `{locked, available, in_progress, unlocked, mastered}`, and the `toState` SHALL always be strictly forward from `fromState` in the state machine ordering (locked=0 < available=1 < in_progress=2 < unlocked=3 < mastered=4).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Prerequisite Gate Correctness

*For any* skill node with prerequisites and *for any* map of current node states, `arePrerequisitesSatisfied` SHALL return `true` if and only if every prerequisite group is satisfied — where a group with AND logic requires all referenced nodes to be `unlocked` or `mastered`, and a group with OR logic requires at least one.

**Validates: Requirements 2.5, 2.6, 3.2**

### Property 4: Incomplete Sets Exclusion

*For any* workout data containing a mix of completed and incomplete sets, `isUnlockCriteriaMet` SHALL evaluate unlock conditions using only sets where `completed === true`. Incomplete sets SHALL have zero influence on the boolean result.

**Validates: Requirements 4.3, 4.5**

### Property 5: Single-Session Unlock (No Partial Credit)

*For any* in_progress node whose unlock criteria are NOT fully satisfied by the completed sets of a single workout, the evaluator SHALL produce no transition for that node — its state remains `in_progress`.

**Validates: Requirements 4.4, 4.5**

### Property 6: Evidence Snapshot Completeness

*For any* node transition from `in_progress` to `unlocked`, the evaluator output SHALL include an `EvidenceSnapshot` containing the workout ID, the qualifying sets data (non-empty), and an evaluation timestamp.

**Validates: Requirements 4.1**

### Property 7: Progression Monotonicity (No Decay)

*For any* sequence of evaluation calls, the total momentum (sum of all ledger entries) SHALL be monotonically non-decreasing. No operation SHALL produce a negative `points` value or remove existing ledger entries.

**Validates: Requirements 7.7, 13.1**

### Property 8: Momentum Transaction Completeness

*For any* momentum-producing event (workout completion, node unlock, trial completion, or PR achievement), the resulting ledger entry SHALL contain a valid `sourceType`, the corresponding `sourceId`, a positive integer `points` value, and a timestamp.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.8**

### Property 9: Momentum Cap Enforcement

*For any* workout regardless of duration, exercise count, or volume, `calculateWorkoutMomentum` SHALL return a value between 0 and `config.maxPointsPerWorkout` inclusive.

**Validates: Requirements 8.2**

### Property 10: Diminishing Returns for Repeated Exercises

*For any* workout containing N occurrences of the same exercise (N ≥ 2), the momentum contribution of the k-th occurrence SHALL be strictly less than the (k-1)-th occurrence.

**Validates: Requirements 8.3**

### Property 11: Minimum Sets Threshold

*For any* workout containing fewer than `config.minimumCompletedSets` total completed sets across all exercises, `calculateWorkoutMomentum` SHALL return exactly 0.

**Validates: Requirements 8.5**

### Property 12: Variety Rewards Quality Over Volume

*For any* two workouts A and B where A has more unique exercises but the same total completed sets as B (which repeats fewer exercises), `calculateWorkoutMomentum(A)` SHALL be greater than or equal to `calculateWorkoutMomentum(B)`.

**Validates: Requirements 7.6**

### Property 13: DAG Acyclicity Validation

*For any* set of prerequisite edges defining a path's node relationships, the path validator SHALL reject the graph if and only if a cycle exists. Valid paths SHALL form a directed acyclic graph.

**Validates: Requirements 2.3**

### Property 14: Feature Flag Isolation

*For any* workout evaluation input, when the feature flag is disabled, the evaluator integration layer SHALL return an empty result (zero transitions, zero momentum entries) without modifying any state.

**Validates: Requirements 1.1, 1.2**

### Property 15: Trial Dismissal Safety

*For any* active trial in any state of progress, dismissing the trial SHALL produce zero changes to the user's momentum total, node states, or milestone awards.

**Validates: Requirements 5.3, 13.3**

### Property 16: Sync Conflict Resolution Favors Advancement

*For any* pair of conflicting local and remote node states for the same node, `resolveConflict` SHALL return the state with the higher position in the state machine ordering (locked < available < in_progress < unlocked < mastered).

**Validates: Requirements 9.3**

### Property 17: Milestone Family Threshold Ordering

*For any* milestone family, the tier thresholds SHALL be strictly monotonically increasing — tier N+1 threshold is always strictly greater than tier N threshold.

**Validates: Requirements 6.2**

### Property 18: Milestone Permanence

*For any* sequence of evaluations where a milestone has been awarded, subsequent evaluations SHALL never remove that milestone from the user's awarded set regardless of changes to workout history or progression state.

**Validates: Requirements 6.3, 13.1**

### Property 19: Trial Generation Determinism

*For any* user ID, date, progression state, and reroll counter, calling `generateTrial` multiple times with identical parameters SHALL produce identical trial output. Different reroll counters with the same base seed SHALL produce different trials.

**Validates: Requirements 5.2, 5.5, 10.3**

### Property 20: Pure Function Input Immutability

*For any* input object passed to `evaluateWorkout`, the function SHALL not mutate any property of the input. A deep equality check between the input before and after evaluation SHALL pass.

**Validates: Requirements 10.4**


---

## Testing Strategy

### Unit Tests (Example-Based)

- Feature flag guard behavior (enabled/disabled)
- Seed data validation (9 paths, 70+ nodes, valid FKs, no cycles)
- Specific state transition examples with known inputs
- Milestone definitions: no streak conditions, valid families
- UI component rendering (node states, celebrations)

### Property-Based Tests

All 20 correctness properties above are implemented as property-based tests with:
- Minimum 100 iterations per property
- Custom generators for `EvaluationInput`, `WorkoutEvalInput`, `MomentumConfig`, prerequisite graphs
- Shrinking enabled for minimal failing examples

Key generator strategies:
- **Workout generator**: Random exercise count (1-10), random sets per exercise (1-8), random completed/incomplete mix
- **Node graph generator**: Random DAG with 3-15 nodes per path, random prerequisite edges (validated acyclic)
- **State generator**: Random assignment of valid states to nodes respecting state machine ordering

### Integration Tests

- Post-workout evaluation hook fires correctly
- Momentum ledger persistence and deduplication
- Offline sync reconciliation with conflict scenarios
- Retroactive milestone backfill on first enable
