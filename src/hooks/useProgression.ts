import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isProgressionEnabled } from '@/lib/feature-flags';
import { evaluateWorkout, DEFAULT_MOMENTUM_CONFIG } from '@/lib/progression-evaluator';
import type {
  SkillPath,
  SkillNode,
  PrerequisiteGroup,
  UserNodeState,
  WorkoutEvalInput,
  EvaluationOutput,
} from '@/types/progression';

// =============================================================================
// Query Keys
// =============================================================================

const QUERY_KEYS = {
  skillPaths: ['skill-paths'] as const,
  nodeProgress: (userId: string) => ['node-progress', userId] as const,
  momentum: (userId: string) => ['momentum', userId] as const,
};

// =============================================================================
// Database Row Types
// =============================================================================

interface SkillPathRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  sort_order: number;
}

interface SkillNodeRow {
  id: string;
  path_id: string;
  exercise_id: string;
  name: string;
  description: string | null;
  tier: number;
  sort_order: number;
  unlock_criteria: { type: string; min_reps?: number; min_sets?: number; min_hold_seconds?: number };
  mastery_criteria: { type: string; min_reps?: number; min_sets?: number; min_hold_seconds?: number } | null;
  momentum_reward: number;
}

interface PrerequisiteRow {
  id: string;
  node_id: string;
  required_node_id: string;
  group_id: number;
  group_logic: string;
}

interface UserProgressRow {
  node_id: string;
  state: string;
  unlocked_at: string | null;
  mastered_at: string | null;
}

// =============================================================================
// Transformers
// =============================================================================

function transformPath(row: SkillPathRow): SkillPath {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

function transformNodes(
  nodeRows: SkillNodeRow[],
  prereqRows: PrerequisiteRow[],
): SkillNode[] {
  // Group prerequisites by node_id
  const prereqsByNode = new Map<string, PrerequisiteRow[]>();
  for (const row of prereqRows) {
    const existing = prereqsByNode.get(row.node_id) ?? [];
    existing.push(row);
    prereqsByNode.set(row.node_id, existing);
  }

  return nodeRows.map((row) => {
    const nodePrereqs = prereqsByNode.get(row.id) ?? [];

    // Group by group_id
    const groupMap = new Map<number, { logic: 'and' | 'or'; nodeIds: string[] }>();
    for (const pr of nodePrereqs) {
      const group = groupMap.get(pr.group_id) ?? {
        logic: pr.group_logic as 'and' | 'or',
        nodeIds: [],
      };
      group.nodeIds.push(pr.required_node_id);
      groupMap.set(pr.group_id, group);
    }

    const prerequisites: PrerequisiteGroup[] = [];
    for (const [groupId, group] of groupMap) {
      prerequisites.push({
        groupId,
        logic: group.logic,
        requiredNodeIds: group.nodeIds,
      });
    }

    return {
      id: row.id,
      pathId: row.path_id,
      exerciseId: row.exercise_id,
      name: row.name,
      description: row.description,
      tier: row.tier,
      sortOrder: row.sort_order,
      unlockCriteria: row.unlock_criteria as SkillNode['unlockCriteria'],
      masteryCriteria: row.mastery_criteria as SkillNode['masteryCriteria'],
      momentumReward: row.momentum_reward,
      prerequisites,
    };
  });
}

// =============================================================================
// Hook: useSkillPaths
// =============================================================================

export interface SkillPathsData {
  paths: SkillPath[];
  nodes: SkillNode[];
}

/**
 * Fetches skill paths, nodes, and prerequisites.
 * Transforms into typed SkillPath[] and SkillNode[] with prerequisites built.
 * staleTime: 24 hours (seed data rarely changes).
 * Only enabled when progression feature flag is on.
 */
export function useSkillPaths() {
  return useQuery<SkillPathsData>({
    queryKey: QUERY_KEYS.skillPaths,
    queryFn: async () => {
      const [pathsResult, nodesResult, prereqsResult] = await Promise.all([
        supabase
          .from('skill_paths')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('skill_nodes')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('skill_node_prerequisites')
          .select('*'),
      ]);

      if (pathsResult.error) throw pathsResult.error;
      if (nodesResult.error) throw nodesResult.error;
      if (prereqsResult.error) throw prereqsResult.error;

      const paths = (pathsResult.data as SkillPathRow[]).map(transformPath);
      const nodes = transformNodes(
        nodesResult.data as SkillNodeRow[],
        prereqsResult.data as PrerequisiteRow[],
      );

      return { paths, nodes };
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: isProgressionEnabled(),
  });
}

// =============================================================================
// Hook: useNodeProgress
// =============================================================================

/**
 * Fetches user_skill_progress for the authenticated user.
 * Returns Map<nodeId, UserNodeState>.
 */
export function useNodeProgress() {
  const { user } = useAuth();

  return useQuery<Map<string, UserNodeState>>({
    queryKey: QUERY_KEYS.nodeProgress(user?.id ?? ''),
    queryFn: async () => {
      if (!user) return new Map();

      const { data, error } = await supabase
        .from('user_skill_progress')
        .select('node_id, state, unlocked_at, mastered_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const map = new Map<string, UserNodeState>();
      for (const row of data as UserProgressRow[]) {
        map.set(row.node_id, {
          nodeId: row.node_id,
          state: row.state as UserNodeState['state'],
          unlockedAt: row.unlocked_at,
          masteredAt: row.mastered_at,
        });
      }
      return map;
    },
    enabled: isProgressionEnabled() && !!user,
  });
}

// =============================================================================
// Hook: useMomentum
// =============================================================================

/**
 * Fetches total momentum points for the authenticated user.
 * Returns a number (SUM of all ledger entries).
 */
export function useMomentum() {
  const { user } = useAuth();

  return useQuery<number>({
    queryKey: QUERY_KEYS.momentum(user?.id ?? ''),
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('momentum_ledger' as never)
        .select('points')
        .eq('user_id', user.id) as { data: { points: number }[] | null; error: Error | null };

      if (error) throw error;

      let total = 0;
      for (const row of data ?? []) {
        total += row.points;
      }
      return total;
    },
    enabled: isProgressionEnabled() && !!user,
  });
}

// =============================================================================
// Hook: useProgressionEval
// =============================================================================

/**
 * Mutation that evaluates a completed workout for progression:
 * 1. Reads skill nodes from query cache
 * 2. Reads user node states from query cache
 * 3. Calls evaluateWorkout() (pure function)
 * 4. Persists transitions (UPSERT user_skill_progress)
 * 5. Inserts evidence for unlocks
 * 6. Appends momentum_ledger entries
 * 7. Invalidates queries on success
 */
export function useProgressionEval() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<EvaluationOutput, Error, WorkoutEvalInput>({
    mutationFn: async (workoutInput: WorkoutEvalInput): Promise<EvaluationOutput> => {
      if (!user) throw new Error('No authenticated user');

      // Read nodes from cache or fetch
      const cachedPaths = queryClient.getQueryData<SkillPathsData>(QUERY_KEYS.skillPaths);
      let nodes: SkillNode[];

      if (cachedPaths) {
        nodes = cachedPaths.nodes;
      } else {
        // Fallback: fetch fresh
        const [nodesResult, prereqsResult] = await Promise.all([
          supabase.from('skill_nodes').select('*'),
          supabase.from('skill_node_prerequisites').select('*'),
        ]);
        if (nodesResult.error) throw nodesResult.error;
        if (prereqsResult.error) throw prereqsResult.error;
        nodes = transformNodes(
          nodesResult.data as SkillNodeRow[],
          prereqsResult.data as PrerequisiteRow[],
        );
      }

      // Read user states from cache or fetch
      const cachedStates = queryClient.getQueryData<Map<string, UserNodeState>>(
        QUERY_KEYS.nodeProgress(user.id),
      );
      let currentStates: UserNodeState[];

      if (cachedStates) {
        currentStates = Array.from(cachedStates.values());
      } else {
        const { data, error } = await supabase
          .from('user_skill_progress')
          .select('node_id, state, unlocked_at, mastered_at')
          .eq('user_id', user.id);
        if (error) throw error;
        currentStates = (data as UserProgressRow[]).map((row) => ({
          nodeId: row.node_id,
          state: row.state as UserNodeState['state'],
          unlockedAt: row.unlocked_at,
          masteredAt: row.mastered_at,
        }));
      }

      // Evaluate (pure function)
      const result = evaluateWorkout({
        nodes,
        currentStates,
        workout: workoutInput,
      });

      // Persist transitions
      if (result.transitions.length > 0) {
        const now = new Date().toISOString();
        const upsertRows = result.transitions.map((t) => ({
          user_id: user.id,
          node_id: t.nodeId,
          state: t.toState,
          unlocked_at: t.toState === 'unlocked' || t.toState === 'mastered' ? now : null,
          mastered_at: t.toState === 'mastered' ? now : null,
          updated_at: now,
        }));

        const { error: upsertError } = await (supabase
          .from('user_skill_progress' as never)
          .upsert(upsertRows as never[], { onConflict: 'user_id,node_id' }) as unknown as Promise<{ error: Error | null }>);

        if (upsertError) throw upsertError;

        // Insert evidence for unlock transitions
        const evidenceRows = result.transitions
          .filter((t) => t.evidence)
          .map((t) => ({
            user_id: user.id,
            node_id: t.nodeId,
            workout_id: t.evidence!.workoutId,
            sets_data: t.evidence!.setsData,
            evaluated_at: t.evidence!.evaluatedAt,
          }));

        if (evidenceRows.length > 0) {
          const { error: evidenceError } = await (supabase
            .from('skill_evidence' as never)
            .insert(evidenceRows as never[]) as unknown as Promise<{ error: Error | null }>);

          if (evidenceError) throw evidenceError;
        }
      }

      // Append momentum ledger entries
      if (result.momentumEntries.length > 0) {
        const ledgerRows = result.momentumEntries.map((entry) => ({
          user_id: user.id,
          source_type: entry.sourceType,
          source_id: entry.sourceId,
          points: entry.points,
        }));

        const { error: ledgerError } = await (supabase
          .from('momentum_ledger' as never)
          .insert(ledgerRows as never[]) as unknown as Promise<{ error: Error | null }>);

        if (ledgerError) throw ledgerError;
      }

      return result;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeProgress(user.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.momentum(user.id) });
      }
    },
  });
}

// Re-export for convenience
export { DEFAULT_MOMENTUM_CONFIG };
