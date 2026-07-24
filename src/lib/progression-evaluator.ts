// =============================================================================
// Calisthenics Progression System — Pure Evaluator Module
// ZERO side effects, no network calls, no randomness. All functions are pure.
// =============================================================================

import type {
  CompletedSet,
  EvaluationInput,
  EvaluationOutput,
  EvidenceSnapshot,
  MasteryCriteria,
  MomentumConfig,
  MomentumEntry,
  NodeState,
  NodeTransition,
  SkillNode,
  UnlockCriteria,
  WorkoutEvalInput,
} from '@/types/progression';

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_MOMENTUM_CONFIG: MomentumConfig = {
  basePointsPerExercise: 3,
  varietyBonusPerUnique: 2,
  diminishingFactor: 0.5,
  maxPointsPerWorkout: 50,
  minimumCompletedSets: 3,
};

// =============================================================================
// Prerequisites
// =============================================================================

/**
 * Checks if all prerequisite groups for a node are satisfied.
 * Groups are ANDed together. Within a group, logic is 'and' or 'or'.
 * If prerequisites is empty, returns true.
 */
export function arePrerequisitesSatisfied(
  node: SkillNode,
  states: Map<string, NodeState>,
): boolean {
  if (node.prerequisites.length === 0) return true;

  return node.prerequisites.every((group) => {
    if (group.requiredNodeIds.length === 0) return true;

    const isSatisfied = (nodeId: string): boolean => {
      const state = states.get(nodeId);
      return state === 'unlocked' || state === 'mastered';
    };

    if (group.logic === 'and') {
      return group.requiredNodeIds.every(isSatisfied);
    }
    // group.logic === 'or'
    return group.requiredNodeIds.some(isSatisfied);
  });
}

// =============================================================================
// Unlock Criteria
// =============================================================================

/**
 * Evaluates unlock criteria against completed sets.
 * Only counts sets where completed === true.
 */
export function isUnlockCriteriaMet(
  criteria: UnlockCriteria,
  sets: CompletedSet[],
): boolean {
  const completedSets = sets.filter((s) => s.completed === true);

  switch (criteria.type) {
    case 'reps': {
      if (criteria.min_reps == null) return false;
      return completedSets.some(
        (s) => s.reps != null && s.reps >= criteria.min_reps!,
      );
    }
    case 'hold': {
      if (criteria.min_hold_seconds == null) return false;
      return completedSets.some(
        (s) =>
          s.durationSeconds != null &&
          s.durationSeconds >= criteria.min_hold_seconds!,
      );
    }
    case 'sets_at_reps': {
      if (criteria.min_sets == null || criteria.min_reps == null) return false;
      const qualifyingSets = completedSets.filter(
        (s) => s.reps != null && s.reps >= criteria.min_reps!,
      );
      return qualifyingSets.length >= criteria.min_sets;
    }
    default:
      return false;
  }
}

// =============================================================================
// Mastery Criteria
// =============================================================================

/**
 * Evaluates mastery criteria. Same logic as unlock but with mastery thresholds.
 * If criteria is null, returns true (simple mastery — no additional threshold).
 */
export function isMasteryCriteriaMet(
  criteria: MasteryCriteria | null,
  sets: CompletedSet[],
): boolean {
  if (criteria == null) return true;

  const completedSets = sets.filter((s) => s.completed === true);

  switch (criteria.type) {
    case 'reps': {
      if (criteria.min_reps == null) return false;
      return completedSets.some(
        (s) => s.reps != null && s.reps >= criteria.min_reps!,
      );
    }
    case 'hold': {
      if (criteria.min_hold_seconds == null) return false;
      return completedSets.some(
        (s) =>
          s.durationSeconds != null &&
          s.durationSeconds >= criteria.min_hold_seconds!,
      );
    }
    case 'sets_at_reps': {
      if (criteria.min_sets == null || criteria.min_reps == null) return false;
      const qualifyingSets = completedSets.filter(
        (s) => s.reps != null && s.reps >= criteria.min_reps!,
      );
      return qualifyingSets.length >= criteria.min_sets;
    }
    default:
      return false;
  }
}

// =============================================================================
// Momentum Calculation
// =============================================================================

/**
 * Calculates momentum reward for a workout based on exercise variety
 * and session quality. Applies diminishing returns and caps.
 *
 * Algorithm:
 * 1. Count total completed sets across all exercises
 * 2. If total < config.minimumCompletedSets → return 0
 * 3. For each unique exerciseId: add basePointsPerExercise + varietyBonusPerUnique
 * 4. For repeated exercises: each additional occurrence multiplied by
 *    diminishingFactor^(occurrence-1)
 * 5. Cap at maxPointsPerWorkout
 * 6. Return Math.floor(result)
 */
export function calculateWorkoutMomentum(
  workout: WorkoutEvalInput,
  config: MomentumConfig,
): number {
  // Count total completed sets
  let totalCompleted = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.completed) totalCompleted++;
    }
  }

  if (totalCompleted < config.minimumCompletedSets) return 0;

  // Count occurrences of each exercise
  const exerciseCounts = new Map<string, number>();
  for (const exercise of workout.exercises) {
    const hasCompleted = exercise.sets.some((s) => s.completed);
    if (hasCompleted) {
      const count = exerciseCounts.get(exercise.exerciseId) ?? 0;
      exerciseCounts.set(exercise.exerciseId, count + 1);
    }
  }

  let result = 0;

  for (const [, count] of exerciseCounts) {
    // First occurrence: base + variety bonus
    result += config.basePointsPerExercise + config.varietyBonusPerUnique;

    // Additional occurrences with diminishing returns
    for (let i = 1; i < count; i++) {
      result +=
        config.basePointsPerExercise * Math.pow(config.diminishingFactor, i);
    }
  }

  // Cap at max
  result = Math.min(result, config.maxPointsPerWorkout);

  return Math.floor(result);
}

// =============================================================================
// Topological Sort
// =============================================================================

/**
 * Kahn's algorithm for topological sorting of nodes based on prerequisites.
 * If cycles exist, returns nodes in original order (graceful degradation).
 */
export function topologicalSort(nodes: SkillNode[]): SkillNode[] {
  const nodeMap = new Map<string, SkillNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build adjacency list: prerequisite → dependent
  // inDegree counts how many prerequisite nodes must be processed first
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, Set<string>>();

  for (const node of nodes) {
    if (!inDegree.has(node.id)) inDegree.set(node.id, 0);
    if (!dependents.has(node.id)) dependents.set(node.id, new Set());
  }

  for (const node of nodes) {
    // Collect all unique prerequisite node IDs for this node
    const prereqIds = new Set<string>();
    for (const group of node.prerequisites) {
      for (const reqId of group.requiredNodeIds) {
        // Only count prerequisites that are in the current node set
        if (nodeMap.has(reqId)) {
          prereqIds.add(reqId);
        }
      }
    }

    inDegree.set(node.id, prereqIds.size);

    for (const prereqId of prereqIds) {
      if (!dependents.has(prereqId)) dependents.set(prereqId, new Set());
      dependents.get(prereqId)!.add(node.id);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: SkillNode[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodeMap.get(current);
    if (node) sorted.push(node);

    const deps = dependents.get(current);
    if (deps) {
      for (const depId of deps) {
        const newDegree = (inDegree.get(depId) ?? 1) - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) queue.push(depId);
      }
    }
  }

  // If cycle detected (not all nodes processed), return original order
  if (sorted.length !== nodes.length) return nodes;

  return sorted;
}

// =============================================================================
// Main Evaluator
// =============================================================================

const STATE_ORDER: Record<NodeState, number> = {
  locked: 0,
  available: 1,
  in_progress: 2,
  unlocked: 3,
  mastered: 4,
};

/**
 * Main entry point. Evaluates a completed workout against current progression state.
 * Returns state transitions and momentum entries to persist.
 *
 * PURE FUNCTION: No side effects, no network calls, deterministic.
 */
export function evaluateWorkout(input: EvaluationInput): EvaluationOutput {
  const { nodes, currentStates, workout } = input;

  // 1. Build a Map<nodeId, NodeState> from input.currentStates
  const stateMap = new Map<string, NodeState>();
  for (const us of currentStates) {
    stateMap.set(us.nodeId, us.state);
  }

  // Initialize missing nodes as 'locked'
  for (const node of nodes) {
    if (!stateMap.has(node.id)) {
      stateMap.set(node.id, 'locked');
    }
  }

  // Build exercise sets lookup: exerciseId → CompletedSet[]
  const exerciseSetsMap = new Map<string, CompletedSet[]>();
  for (const ex of workout.exercises) {
    const existing = exerciseSetsMap.get(ex.exerciseId) ?? [];
    existing.push(...ex.sets);
    exerciseSetsMap.set(ex.exerciseId, existing);
  }

  // 2. Sort nodes in topological order
  const sortedNodes = topologicalSort(nodes);

  // 3. Evaluate each node
  const transitions: NodeTransition[] = [];
  const momentumEntries: MomentumEntry[] = [];

  for (const node of sortedNodes) {
    const currentState = stateMap.get(node.id) ?? 'locked';
    let newState = currentState;

    const exerciseSets = exerciseSetsMap.get(node.exerciseId) ?? [];

    // Process transitions in order — a node can advance multiple steps in one pass
    if (newState === 'locked') {
      if (arePrerequisitesSatisfied(node, stateMap)) {
        newState = 'available';
      }
    }

    if (newState === 'available') {
      // Check if workout has completed sets for node's exercise
      const hasCompletedSets = exerciseSets.some((s) => s.completed);
      if (hasCompletedSets) {
        newState = 'in_progress';
      }
    }

    if (newState === 'in_progress') {
      if (isUnlockCriteriaMet(node.unlockCriteria, exerciseSets)) {
        newState = 'unlocked';
      }
    }

    if (newState === 'unlocked') {
      if (isMasteryCriteriaMet(node.masteryCriteria, exerciseSets)) {
        newState = 'mastered';
      }
    }

    // Record transition if state changed
    if (newState !== currentState && STATE_ORDER[newState] > STATE_ORDER[currentState]) {
      const transition: NodeTransition = {
        nodeId: node.id,
        fromState: currentState,
        toState: newState,
      };

      // Create evidence for unlock transitions
      if (
        STATE_ORDER[newState] >= STATE_ORDER['unlocked'] &&
        STATE_ORDER[currentState] < STATE_ORDER['unlocked']
      ) {
        const evidence: EvidenceSnapshot = {
          workoutId: workout.workoutId,
          setsData: exerciseSets.filter((s) => s.completed),
          evaluatedAt: workout.completedAt,
        };
        transition.evidence = evidence;
      }

      transitions.push(transition);

      // Create momentum entry for node unlocks
      if (
        STATE_ORDER[newState] >= STATE_ORDER['unlocked'] &&
        STATE_ORDER[currentState] < STATE_ORDER['unlocked']
      ) {
        momentumEntries.push({
          sourceType: 'node_unlock',
          sourceId: node.id,
          points: node.momentumReward,
        });
      }

      // Update the states map for cascading within same evaluation pass
      stateMap.set(node.id, newState);
    }
  }

  // 5. Calculate workout momentum
  const workoutMomentum = calculateWorkoutMomentum(workout, DEFAULT_MOMENTUM_CONFIG);
  if (workoutMomentum > 0) {
    momentumEntries.push({
      sourceType: 'workout',
      sourceId: workout.workoutId,
      points: workoutMomentum,
    });
  }

  return { transitions, momentumEntries };
}
