// =============================================================================
// Calisthenics Progression System — Type Definitions
// =============================================================================

// =============================================================================
// Enums / Union Types
// =============================================================================

export type NodeState = 'locked' | 'available' | 'in_progress' | 'unlocked' | 'mastered';

// =============================================================================
// Criteria Types
// =============================================================================

export interface UnlockCriteria {
  type: 'reps' | 'hold' | 'sets_at_reps';
  min_reps?: number;
  min_sets?: number;
  min_hold_seconds?: number;
}

export interface MasteryCriteria {
  type: 'reps' | 'hold' | 'sets_at_reps';
  min_reps?: number;
  min_sets?: number;
  min_hold_seconds?: number;
}

// =============================================================================
// Skill Path & Node Models
// =============================================================================

export interface SkillPath {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  sortOrder: number;
}

export interface SkillNode {
  id: string;
  pathId: string;
  exerciseId: string;
  name: string;
  description: string | null;
  tier: number;
  sortOrder: number;
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

// =============================================================================
// User State
// =============================================================================

export interface UserNodeState {
  nodeId: string;
  state: NodeState;
  unlockedAt: string | null;
  masteredAt: string | null;
}

// =============================================================================
// Workout Data for Evaluation
// =============================================================================

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

// =============================================================================
// Evaluator Input / Output
// =============================================================================

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

// =============================================================================
// Momentum
// =============================================================================

export interface MomentumEntry {
  sourceType: 'workout' | 'node_unlock' | 'personal_record' | 'trial' | 'milestone';
  sourceId: string;
  points: number;
}

export interface MomentumConfig {
  basePointsPerExercise: number;
  varietyBonusPerUnique: number;
  diminishingFactor: number;
  maxPointsPerWorkout: number;
  minimumCompletedSets: number;
}
