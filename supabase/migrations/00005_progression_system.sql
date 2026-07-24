-- Migration: Calisthenics Progression System (Phase 1)
-- Creates 11 tables for skill trees, challenges, achievements, and momentum scoring.

-- =============================================================================
-- Tables
-- =============================================================================

-- 1. skill_paths: defines progression paths (e.g., Push, Pull, Squat)
CREATE TABLE skill_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. skill_nodes: individual exercises/skills within a path
CREATE TABLE skill_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES skill_paths(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  tier integer NOT NULL CHECK (tier BETWEEN 1 AND 5),
  sort_order integer NOT NULL DEFAULT 0,
  unlock_criteria jsonb NOT NULL,
  mastery_criteria jsonb,
  momentum_reward integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. skill_node_prerequisites: prerequisite edges between nodes
CREATE TABLE skill_node_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  required_node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  group_id integer NOT NULL,
  group_logic text NOT NULL CHECK (group_logic IN ('and', 'or'))
);

-- 4. user_skill_progress: per-user state for each skill node
CREATE TABLE user_skill_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'locked'
    CHECK (state IN ('locked', 'available', 'in_progress', 'unlocked', 'mastered')),
  unlocked_at timestamptz,
  mastered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, node_id)
);

-- 5. skill_evidence: evidence snapshots for node unlocks
CREATE TABLE skill_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE SET NULL,
  sets_data jsonb NOT NULL,
  evaluated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. user_path_targets: user-selected target nodes within paths
CREATE TABLE user_path_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES skill_paths(id) ON DELETE CASCADE,
  target_node_id uuid REFERENCES skill_nodes(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, path_id)
);

-- 7. challenge_templates: system-defined challenge definitions (Phase 2)
CREATE TABLE challenge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('session', 'weekly', 'path_quest', 'boss')),
  name text NOT NULL,
  description_template text NOT NULL,
  conditions jsonb NOT NULL,
  momentum_reward integer NOT NULL,
  min_tier integer NOT NULL DEFAULT 1,
  path_id uuid REFERENCES skill_paths(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. user_challenges: user-specific challenge instances (Phase 2)
CREATE TABLE user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES challenge_templates(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'dismissed', 'expired')),
  progress jsonb NOT NULL DEFAULT '{}',
  seed text NOT NULL,
  reroll_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz
);

-- 9. achievement_definitions: system-defined achievements (Phase 3)
CREATE TABLE achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL
    CHECK (category IN ('performance', 'skill', 'progress', 'work_capacity', 'consistency', 'exploration', 'legendary')),
  family text,
  tier integer NOT NULL DEFAULT 1,
  conditions jsonb NOT NULL,
  momentum_reward integer NOT NULL DEFAULT 5,
  icon text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. user_achievements: per-user awarded achievements (Phase 3)
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  UNIQUE (user_id, achievement_id)
);

-- 11. momentum_ledger: append-only points log
CREATE TABLE momentum_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL
    CHECK (source_type IN ('workout', 'trial', 'personal_record', 'node_unlock', 'milestone', 'backfill')),
  source_id uuid NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-update updated_at on user_skill_progress
CREATE TRIGGER user_skill_progress_updated_at
  BEFORE UPDATE ON user_skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Indexes
-- =============================================================================

-- skill_nodes
CREATE INDEX idx_skill_nodes_path ON skill_nodes(path_id);
CREATE INDEX idx_skill_nodes_exercise ON skill_nodes(exercise_id);

-- skill_node_prerequisites
CREATE INDEX idx_skill_node_prerequisites_node ON skill_node_prerequisites(node_id);
CREATE INDEX idx_skill_node_prerequisites_required ON skill_node_prerequisites(required_node_id);

-- user_skill_progress
CREATE INDEX idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX idx_user_skill_progress_node ON user_skill_progress(node_id);
CREATE INDEX idx_user_skill_progress_user_state ON user_skill_progress(user_id, state);

-- skill_evidence
CREATE INDEX idx_skill_evidence_user_node ON skill_evidence(user_id, node_id);
CREATE INDEX idx_skill_evidence_workout ON skill_evidence(workout_id);

-- user_path_targets
CREATE INDEX idx_user_path_targets_user ON user_path_targets(user_id);

-- user_challenges
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_user_status ON user_challenges(user_id, status);
CREATE INDEX idx_user_challenges_template ON user_challenges(template_id);

-- user_achievements
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);

-- momentum_ledger
CREATE INDEX idx_momentum_ledger_user ON momentum_ledger(user_id);
CREATE INDEX idx_momentum_ledger_user_created ON momentum_ledger(user_id, created_at);
CREATE INDEX idx_momentum_ledger_source ON momentum_ledger(source_type, source_id);

-- =============================================================================
-- Enable Row-Level Security
-- =============================================================================

ALTER TABLE skill_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_node_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE momentum_ledger ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies: System tables (read-only for authenticated users)
-- =============================================================================

-- skill_paths: SELECT only
CREATE POLICY "skill_paths_select" ON skill_paths
  FOR SELECT TO authenticated USING (true);

-- skill_nodes: SELECT only
CREATE POLICY "skill_nodes_select" ON skill_nodes
  FOR SELECT TO authenticated USING (true);

-- skill_node_prerequisites: SELECT only
CREATE POLICY "skill_node_prerequisites_select" ON skill_node_prerequisites
  FOR SELECT TO authenticated USING (true);

-- challenge_templates: SELECT only
CREATE POLICY "challenge_templates_select" ON challenge_templates
  FOR SELECT TO authenticated USING (true);

-- achievement_definitions: SELECT only
CREATE POLICY "achievement_definitions_select" ON achievement_definitions
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- RLS Policies: User tables (full CRUD restricted to own data)
-- =============================================================================

-- user_skill_progress
CREATE POLICY "user_skill_progress_select" ON user_skill_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_skill_progress_insert" ON user_skill_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_skill_progress_update" ON user_skill_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_skill_progress_delete" ON user_skill_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- skill_evidence
CREATE POLICY "skill_evidence_select" ON skill_evidence
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "skill_evidence_insert" ON skill_evidence
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skill_evidence_update" ON skill_evidence
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skill_evidence_delete" ON skill_evidence
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_path_targets
CREATE POLICY "user_path_targets_select" ON user_path_targets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_path_targets_insert" ON user_path_targets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_path_targets_update" ON user_path_targets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_path_targets_delete" ON user_path_targets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_challenges
CREATE POLICY "user_challenges_select" ON user_challenges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_challenges_insert" ON user_challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_challenges_update" ON user_challenges
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_challenges_delete" ON user_challenges
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_achievements
CREATE POLICY "user_achievements_select" ON user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_achievements_insert" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_achievements_update" ON user_achievements
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_achievements_delete" ON user_achievements
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- momentum_ledger
CREATE POLICY "momentum_ledger_select" ON momentum_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "momentum_ledger_insert" ON momentum_ledger
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "momentum_ledger_update" ON momentum_ledger
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "momentum_ledger_delete" ON momentum_ledger
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
