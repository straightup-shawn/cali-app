import { useState } from 'react';
import { useSkillPaths, useNodeProgress, useMomentum } from '@/hooks/useProgression';
import type { SkillNode, UserNodeState, NodeState, UnlockCriteria } from '@/types/progression';

// =============================================================================
// Helper: Format unlock criteria into human-readable text
// =============================================================================

function formatCriteria(criteria: UnlockCriteria): string {
  switch (criteria.type) {
    case 'sets_at_reps':
      return `${criteria.min_sets ?? 3} sets × ${criteria.min_reps ?? 8} reps`;
    case 'hold':
      return `Hold for ${criteria.min_hold_seconds ?? 30} seconds`;
    case 'reps':
      return `Complete ${criteria.min_reps ?? 1} rep${(criteria.min_reps ?? 1) > 1 ? 's' : ''}`;
    default:
      return '';
  }
}

// =============================================================================
// Helper: Get effective node state (defaults to locked/available for tier 1)
// =============================================================================

function getNodeState(
  node: SkillNode,
  nodeStates: Map<string, UserNodeState> | undefined,
): NodeState {
  if (!nodeStates) return node.tier === 1 && node.prerequisites.length === 0 ? 'available' : 'locked';
  const userState = nodeStates.get(node.id);
  if (userState) return userState.state;
  // Tier 1 nodes with no prerequisites default to available
  if (node.tier === 1 && node.prerequisites.length === 0) return 'available';
  return 'locked';
}

// =============================================================================
// SkillNodeCard
// =============================================================================

interface SkillNodeCardProps {
  node: SkillNode;
  state: NodeState;
  isLast: boolean;
  onClick: () => void;
}

function SkillNodeCard({ node, state, isLast, onClick }: SkillNodeCardProps) {
  const stateStyles: Record<NodeState, string> = {
    locked: 'opacity-40 border-gray-700 bg-gray-900/50',
    available: 'border-indigo-500/50 shadow-lg shadow-indigo-500/10 bg-gray-900/80',
    in_progress: 'border-indigo-500 animate-pulse bg-gray-900/80',
    unlocked: 'border-green-500 bg-green-950/30',
    mastered: 'border-amber-400 bg-amber-950/20',
  };

  const stateBadges: Record<NodeState, { label: string; className: string }> = {
    locked: { label: 'Locked', className: 'bg-gray-700 text-gray-400' },
    available: { label: 'Available', className: 'bg-indigo-900/50 text-indigo-300' },
    in_progress: { label: 'In Progress', className: 'bg-indigo-800/50 text-indigo-200' },
    unlocked: { label: 'Unlocked', className: 'bg-green-900/50 text-green-300' },
    mastered: { label: 'Mastered', className: 'bg-amber-900/50 text-amber-300' },
  };

  const tierIndicators = ['', '●', '●●', '●●●', '●●●●', '●●●●●'];
  const badge = stateBadges[state];

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={state === 'locked'}
        className={`w-full rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 active:scale-[0.98] ${stateStyles[state]}`}
        aria-label={`${node.name} - ${badge.label}`}
      >
        <div className="flex items-center gap-3">
          {/* Tier circle */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
              state === 'mastered'
                ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                : state === 'unlocked'
                ? 'border-green-500 bg-green-950/40 text-green-300'
                : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}
          >
            <span className="text-xs font-bold">T{node.tier}</span>
          </div>

          {/* Name and tier dots */}
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-gray-100">{node.name}</p>
            <p className="text-xs text-gray-500">{tierIndicators[node.tier] || ''} Tier {node.tier}</p>
          </div>

          {/* State badge */}
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </button>

      {/* Connecting line to next node */}
      {!isLast && (
        <div className="h-6 w-px bg-gradient-to-b from-gray-600 to-gray-800" />
      )}
    </div>
  );
}

// =============================================================================
// NodeDetailSheet
// =============================================================================

interface NodeDetailSheetProps {
  node: SkillNode;
  state: NodeState;
  onClose: () => void;
}

function NodeDetailSheet({ node, state, onClose }: NodeDetailSheetProps) {
  const stateBadges: Record<NodeState, { label: string; className: string }> = {
    locked: { label: 'Locked', className: 'bg-gray-700 text-gray-400' },
    available: { label: 'Available', className: 'bg-indigo-900/50 text-indigo-300' },
    in_progress: { label: 'In Progress', className: 'bg-indigo-800/50 text-indigo-200' },
    unlocked: { label: 'Unlocked', className: 'bg-green-900/50 text-green-300' },
    mastered: { label: 'Mastered', className: 'bg-amber-900/50 text-amber-300' },
  };

  const badge = stateBadges[state];

  return (
    <div className="fixed inset-0 z-50 transition-opacity duration-300 opacity-100 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close node detail"
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 inset-x-0 rounded-t-2xl bg-gray-900/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto transition-transform duration-300 ease-out translate-y-0 pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-modal="true"
        aria-label={`${node.name} details`}
      >
        {/* Handle bar */}
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-gray-900/95 backdrop-blur-xl rounded-t-2xl">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-100">{node.name}</h2>
              {node.description && (
                <p className="mt-1 text-sm text-gray-400">{node.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 mb-5">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
            <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
              Tier {node.tier}
            </span>
            <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
              ⚡ {node.momentumReward} pts
            </span>
          </div>

          {/* Unlock criteria */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Unlock Criteria
            </h3>
            <p className="text-sm font-medium text-indigo-300">
              {formatCriteria(node.unlockCriteria)}
            </p>
          </div>

          {/* Mastery criteria (if exists) */}
          {node.masteryCriteria && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Mastery Criteria
              </h3>
              <p className="text-sm font-medium text-amber-300">
                {formatCriteria(node.masteryCriteria)}
              </p>
            </div>
          )}

          {/* Progress indicator */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Progress
            </h3>
            {state === 'locked' && (
              <p className="text-sm text-gray-500">Complete prerequisites to unlock this skill.</p>
            )}
            {state === 'available' && (
              <p className="text-sm text-gray-300">Ready to train! Complete a workout with this exercise to start.</p>
            )}
            {state === 'in_progress' && (
              <p className="text-sm text-indigo-300">Keep training — meet the unlock criteria in a single session.</p>
            )}
            {state === 'unlocked' && (
              <p className="text-sm text-green-300">
                {node.masteryCriteria ? 'Unlocked! Push further to achieve mastery.' : 'Skill unlocked! ✓'}
              </p>
            )}
            {state === 'mastered' && (
              <p className="text-sm text-amber-300">Mastered! You've conquered this skill. 🏆</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ProgressPage
// =============================================================================

export default function ProgressPage() {
  const { data: skillData, isLoading: pathsLoading } = useSkillPaths();
  const { data: nodeStates, isLoading: progressLoading } = useNodeProgress();
  const { data: momentum } = useMomentum();

  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const paths = skillData?.paths ?? [];
  const allNodes = skillData?.nodes ?? [];

  // Default to first path if none selected
  const activePathId = selectedPathId ?? paths[0]?.id ?? null;

  // Nodes for the selected path, sorted by sort_order
  const nodesForPath = allNodes
    .filter((n) => n.pathId === activePathId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Stats for the path
  const unlockedCount = nodesForPath.filter((n) => {
    const s = getNodeState(n, nodeStates);
    return s === 'unlocked' || s === 'mastered';
  }).length;

  // Selected node for detail sheet
  const selectedNode = selectedNodeId
    ? allNodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const isLoading = pathsLoading || progressLoading;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header with Momentum */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Progress</h1>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-bold text-indigo-400">{momentum ?? 0}</span>
          </div>
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && paths.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="text-4xl mb-3">🌱</span>
          <p className="text-gray-400 text-sm">No skill paths available yet. Check back soon!</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && paths.length > 0 && (
        <>
          {/* Path selector */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
            {paths.map((path) => {
              const isSelected = path.id === activePathId;
              return (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => setSelectedPathId(path.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                >
                  {path.icon} {path.name}
                </button>
              );
            })}
          </div>

          {/* Skill tree */}
          <div className="flex-1 px-4 py-4 pb-32">
            {/* Path progress text */}
            <p className="mb-4 text-center text-sm text-gray-400">
              {unlockedCount}/{nodesForPath.length} Skills Unlocked
            </p>

            {/* Vertical node list */}
            <div className="flex flex-col items-center gap-0">
              {nodesForPath.map((node, index) => {
                const state = getNodeState(node, nodeStates);
                return (
                  <SkillNodeCard
                    key={node.id}
                    node={node}
                    state={state}
                    isLast={index === nodesForPath.length - 1}
                    onClick={() => setSelectedNodeId(node.id)}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Node detail bottom sheet */}
      {selectedNode && (
        <NodeDetailSheet
          node={selectedNode}
          state={getNodeState(selectedNode, nodeStates)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
