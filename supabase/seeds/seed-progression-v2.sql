-- =============================================================================
-- Progression System Seed Data V2 — Comprehensive Calisthenics Tree
-- 22 paths, ~120 nodes covering all major calisthenics progressions
-- Run this AFTER clearing existing data or use ON CONFLICT DO NOTHING
-- =============================================================================

-- Clear existing progression data (safe to re-run)
DELETE FROM node_prerequisites;
DELETE FROM skill_nodes;
DELETE FROM skill_paths;

-- =============================================================================
-- SKILL PATHS (22 paths, organized by category)
-- =============================================================================

INSERT INTO skill_paths (id, slug, name, description, icon, sort_order) VALUES
-- PUSH (1-4)
('b0000001-0000-0000-0000-000000000001', 'push-up', 'Push-Up', 'Push-up progressions from wall to one-arm', '💪', 1),
('b0000001-0000-0000-0000-000000000002', 'dip', 'Dip', 'Dip progressions from bench to ring', '⬇️', 2),
('b0000001-0000-0000-0000-000000000003', 'planche', 'Planche', 'Planche from lean to full hold', '🔥', 3),
('b0000001-0000-0000-0000-000000000004', 'hspu', 'HSPU', 'Handstand push-up progression', '🤸', 4),
-- PULL (5-9)
('b0000001-0000-0000-0000-000000000005', 'pull-up', 'Pull-Up', 'Pull-up from dead hang to one-arm', '🏋️', 5),
('b0000001-0000-0000-0000-000000000006', 'chin-up', 'Chin-Up', 'Chin-up progressions', '💪', 6),
('b0000001-0000-0000-0000-000000000007', 'muscle-up', 'Muscle-Up', 'Bar and ring muscle-up', '⚡', 7),
('b0000001-0000-0000-0000-000000000008', 'front-lever', 'Front Lever', 'Front lever progressions', '🎯', 8),
('b0000001-0000-0000-0000-000000000009', 'back-lever', 'Back Lever', 'Back lever progressions', '🔄', 9),
-- LEGS (10-12)
('b0000001-0000-0000-0000-000000000010', 'squat', 'Squat', 'Squat progressions to pistol', '🦵', 10),
('b0000001-0000-0000-0000-000000000011', 'nordic', 'Nordic Curl', 'Nordic hamstring curl', '🦿', 11),
('b0000001-0000-0000-0000-000000000012', 'calf', 'Calf Raise', 'Calf raise progressions', '🦶', 12),
-- CORE (13-17)
('b0000001-0000-0000-0000-000000000013', 'l-sit', 'L-Sit', 'L-sit to manna', '🎯', 13),
('b0000001-0000-0000-0000-000000000014', 'dragon-flag', 'Dragon Flag', 'Dragon flag progressions', '🐉', 14),
('b0000001-0000-0000-0000-000000000015', 'human-flag', 'Human Flag', 'Human flag hold', '🏴', 15),
('b0000001-0000-0000-0000-000000000016', 'ab-wheel', 'Ab Wheel', 'Ab wheel rollout', '🎡', 16),
('b0000001-0000-0000-0000-000000000017', 'windshield-wiper', 'Windshield Wiper', 'Hanging windshield wipers', '🔄', 17),
-- FLEXIBILITY (18-19)
('b0000001-0000-0000-0000-000000000018', 'bridge', 'Bridge', 'Bridge progressions', '🌉', 18),
('b0000001-0000-0000-0000-000000000019', 'splits', 'Splits', 'Front split progression', '🧘', 19),
-- SKILLS (20-22)
('b0000001-0000-0000-0000-000000000020', 'handstand', 'Handstand', 'Freestanding handstand', '🤸', 20),
('b0000001-0000-0000-0000-000000000021', 'ring-skills', 'Ring Skills', 'Gymnastics rings', '⭕', 21),
('b0000001-0000-0000-0000-000000000022', 'row', 'Row', 'Horizontal pull progressions', '🚣', 22)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SKILL NODES
-- Node ID format: c[path_num]-0000-0000-0000-00000000[tier][position]
-- Exercise IDs are generated UUIDs (will be matched by name at runtime)
-- =============================================================================


-- PATH 1: Push-Up (6 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0010001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'Wall Push-Up', 'Push-up against a wall', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', '{"type":"sets_at_reps","min_sets":3,"min_reps":25}', 5),
('c0010002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'Incline Push-Up', 'Hands elevated on bench', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', 8),
('c0010003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'Standard Push-Up', 'Full range on floor', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', 10),
('c0010004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'Diamond Push-Up', 'Hands together, tricep focus', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 12),
('c0010005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'Archer Push-Up', 'One arm does most work', 5, 5, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 15),
('c0010006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'One-Arm Push-Up', 'Single arm push-up', 6, 6, '{"type":"reps","min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 25)
ON CONFLICT (id) DO NOTHING;

-- PATH 2: Dip (5 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0020001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', NULL, 'Bench Dip', 'Hands on bench behind you', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', 5),
('c0020002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', NULL, 'Parallel Bar Dip', 'Full dip on parallel bars', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 10),
('c0020003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', NULL, 'Weighted Dip', 'Dip with added weight', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 12),
('c0020004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', NULL, 'Ring Dip', 'Dip on gymnastic rings', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 15),
('c0020005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', NULL, 'Korean Dip', 'Behind-the-back bar dip', 5, 5, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 20)
ON CONFLICT (id) DO NOTHING;

-- PATH 3: Planche (6 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0030001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'Planche Lean', 'Lean forward in push-up position', 1, 1, '{"type":"hold","min_hold_seconds":20}', '{"type":"hold","min_hold_seconds":45}', 5),
('c0030002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'Frog Stand', 'Knees on elbows balance', 2, 2, '{"type":"hold","min_hold_seconds":15}', '{"type":"hold","min_hold_seconds":30}', 8),
('c0030003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'Tuck Planche', 'Tucked knees planche hold', 3, 3, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 12),
('c0030004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'Advanced Tuck Planche', 'Back flat, knees tucked', 4, 4, '{"type":"hold","min_hold_seconds":8}', '{"type":"hold","min_hold_seconds":15}', 15),
('c0030005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'Straddle Planche', 'Legs apart planche hold', 5, 5, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":10}', 20),
('c0030006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'Full Planche', 'Legs together horizontal hold', 6, 6, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":8}', 30)
ON CONFLICT (id) DO NOTHING;

-- PATH 4: HSPU (5 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0040001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', NULL, 'Pike Push-Up', 'Elevated hips push-up', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 8),
('c0040002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', NULL, 'Elevated Pike Push-Up', 'Feet on box pike push-up', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 10),
('c0040003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', NULL, 'Wall HSPU', 'Handstand push-up against wall', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', 15),
('c0040004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', NULL, 'Freestanding HSPU', 'Handstand push-up no wall', 4, 4, '{"type":"reps","min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 20),
('c0040005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', NULL, '90-Degree Push-Up', 'Full ROM inverted press', 5, 5, '{"type":"reps","min_reps":1}', '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', 30)
ON CONFLICT (id) DO NOTHING;

-- PATH 5: Pull-Up (6 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0050001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', NULL, 'Dead Hang', 'Passive hang from bar', 1, 1, '{"type":"hold","min_hold_seconds":30}', '{"type":"hold","min_hold_seconds":60}', 5),
('c0050002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', NULL, 'Negative Pull-Up', 'Slow eccentric descent', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 8),
('c0050003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', NULL, 'Pull-Up', 'Full dead hang to chin over bar', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 10),
('c0050004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', NULL, 'Weighted Pull-Up', 'Pull-up with added weight', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 12),
('c0050005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', NULL, 'L-Sit Pull-Up', 'Pull-up with legs at 90°', 5, 5, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 15),
('c0050006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', NULL, 'One-Arm Pull-Up', 'Single arm pull-up', 6, 6, '{"type":"reps","min_reps":1}', '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', 30)
ON CONFLICT (id) DO NOTHING;

-- PATH 6: Chin-Up (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0060001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000006', NULL, 'Negative Chin-Up', 'Slow lower from top', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 5),
('c0060002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000006', NULL, 'Chin-Up', 'Supinated grip pull', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 8),
('c0060003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000006', NULL, 'Weighted Chin-Up', 'Chin-up with added weight', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 12),
('c0060004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000006', NULL, 'Typewriter Chin-Up', 'Side to side at top', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":6}', 18)
ON CONFLICT (id) DO NOTHING;

-- PATH 7: Muscle-Up (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0070001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000007', NULL, 'High Pull-Up', 'Pull to chest or waist height', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 10),
('c0070002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000007', NULL, 'Negative Muscle-Up', 'Slow lower from above bar', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 12),
('c0070003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000007', NULL, 'Bar Muscle-Up', 'Kipping or strict bar MU', 3, 3, '{"type":"reps","min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 20),
('c0070004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000007', NULL, 'Ring Muscle-Up', 'Muscle-up on rings', 4, 4, '{"type":"reps","min_reps":1}', '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', 25)
ON CONFLICT (id) DO NOTHING;

-- PATH 8: Front Lever (5 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0080001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000008', NULL, 'Tuck Front Lever', 'Knees tucked to chest', 1, 1, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 8),
('c0080002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000008', NULL, 'Advanced Tuck FL', 'Back flat, knees bent', 2, 2, '{"type":"hold","min_hold_seconds":8}', '{"type":"hold","min_hold_seconds":15}', 12),
('c0080003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000008', NULL, 'One-Leg Front Lever', 'One leg extended', 3, 3, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":10}', 15),
('c0080004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000008', NULL, 'Straddle Front Lever', 'Legs apart horizontal', 4, 4, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":10}', 20),
('c0080005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000008', NULL, 'Full Front Lever', 'Body straight horizontal', 5, 5, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":8}', 30)
ON CONFLICT (id) DO NOTHING;

-- PATH 9: Back Lever (5 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0090001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000009', NULL, 'German Hang', 'Hang behind the bar', 1, 1, '{"type":"hold","min_hold_seconds":15}', '{"type":"hold","min_hold_seconds":30}', 8),
('c0090002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000009', NULL, 'Tuck Back Lever', 'Knees tucked behind bar', 2, 2, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 10),
('c0090003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000009', NULL, 'Advanced Tuck BL', 'Back flat, knees bent', 3, 3, '{"type":"hold","min_hold_seconds":8}', '{"type":"hold","min_hold_seconds":15}', 12),
('c0090004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000009', NULL, 'Straddle Back Lever', 'Legs apart behind bar', 4, 4, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":10}', 18),
('c0090005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000009', NULL, 'Full Back Lever', 'Body straight behind bar', 5, 5, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":8}', 25)
ON CONFLICT (id) DO NOTHING;

-- PATH 10: Squat (6 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0100001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000010', NULL, 'Assisted Squat', 'Hold support for balance', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', '{"type":"sets_at_reps","min_sets":3,"min_reps":25}', 5),
('c0100002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000010', NULL, 'Bodyweight Squat', 'Full depth squat', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', '{"type":"sets_at_reps","min_sets":3,"min_reps":30}', 5),
('c0100003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000010', NULL, 'Bulgarian Split Squat', 'Rear foot elevated', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 10),
('c0100004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000010', NULL, 'Sissy Squat', 'Knees forward squat', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 12),
('c0100005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000010', NULL, 'Pistol Squat', 'Single leg full squat', 5, 5, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 18),
('c0100006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000010', NULL, 'Shrimp Squat', 'Single leg, rear foot held', 6, 6, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 22)
ON CONFLICT (id) DO NOTHING;

-- PATH 11: Nordic Curl (3 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0110001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000011', NULL, 'Negative Nordic', 'Slow eccentric only', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 8),
('c0110002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000011', NULL, 'Assisted Nordic Curl', 'Band or hand assist', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 12),
('c0110003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000011', NULL, 'Full Nordic Curl', 'Complete concentric + eccentric', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":6}', 20)
ON CONFLICT (id) DO NOTHING;

-- PATH 12: Calf Raise (3 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0120001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000012', NULL, 'Double Calf Raise', 'Both legs, full ROM', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', '{"type":"sets_at_reps","min_sets":3,"min_reps":30}', 5),
('c0120002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000012', NULL, 'Single Leg Calf Raise', 'One leg at a time', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', 8),
('c0120003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000012', NULL, 'Weighted SL Calf Raise', 'Single leg with weight', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 12)
ON CONFLICT (id) DO NOTHING;

-- PATH 13: L-Sit (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0130001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000013', NULL, 'Tuck L-Sit', 'Knees tucked, feet off floor', 1, 1, '{"type":"hold","min_hold_seconds":15}', '{"type":"hold","min_hold_seconds":30}', 8),
('c0130002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000013', NULL, 'L-Sit', 'Legs straight at 90°', 2, 2, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 12),
('c0130003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000013', NULL, 'V-Sit', 'Legs raised above 90°', 3, 3, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":12}', 18),
('c0130004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000013', NULL, 'Manna', 'Legs vertical or beyond', 4, 4, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":8}', 30)
ON CONFLICT (id) DO NOTHING;

-- PATH 14: Dragon Flag (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0140001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000014', NULL, 'Tuck Dragon Flag', 'Knees tucked flag', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 10),
('c0140002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000014', NULL, 'Advanced Tuck DF', 'Back straight, knees bent', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 12),
('c0140003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000014', NULL, 'Single Leg Dragon Flag', 'One leg extended', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":6}', 15),
('c0140004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000014', NULL, 'Full Dragon Flag', 'Body straight, controlled', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 22)
ON CONFLICT (id) DO NOTHING;

-- PATH 15: Human Flag (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0150001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000015', NULL, 'Vertical Flag Hold', 'Vertical body on pole', 1, 1, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 8),
('c0150002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000015', NULL, 'Tuck Human Flag', 'Knees tucked flag', 2, 2, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":12}', 12),
('c0150003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000015', NULL, 'Straddle Human Flag', 'Legs apart flag', 3, 3, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":8}', 18),
('c0150004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000015', NULL, 'Full Human Flag', 'Body horizontal on pole', 4, 4, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":6}', 28)
ON CONFLICT (id) DO NOTHING;

-- PATH 16: Ab Wheel (3 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0160001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000016', NULL, 'Kneeling Ab Wheel', 'Rollout from knees', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 8),
('c0160002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000016', NULL, 'Partial Standing Rollout', 'Standing, partial ROM', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 12),
('c0160003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000016', NULL, 'Standing Ab Wheel', 'Full standing rollout', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":6}', 20)
ON CONFLICT (id) DO NOTHING;

-- PATH 17: Windshield Wiper (3 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0170001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000017', NULL, 'Lying Windshield Wiper', 'On floor, legs side to side', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 8),
('c0170002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000017', NULL, 'Hanging Knee Wiper', 'Hanging, knees bent side to side', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 12),
('c0170003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000017', NULL, 'Hanging Windshield Wiper', 'Straight legs, full ROM', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":6}', 18)
ON CONFLICT (id) DO NOTHING;

-- PATH 18: Bridge (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0180001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000018', NULL, 'Short Bridge', 'Glute bridge on floor', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', '{"type":"sets_at_reps","min_sets":3,"min_reps":25}', 5),
('c0180002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000018', NULL, 'Full Bridge', 'Hands and feet, arch up', 2, 2, '{"type":"hold","min_hold_seconds":15}', '{"type":"hold","min_hold_seconds":30}', 10),
('c0180003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000018', NULL, 'Wall Walk Bridge', 'Walk hands down wall', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 15),
('c0180004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000018', NULL, 'Stand-to-Bridge', 'Standing backbend to bridge', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 20)
ON CONFLICT (id) DO NOTHING;

-- PATH 19: Splits (3 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0190001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000019', NULL, 'Deep Lunge Hold', 'Low lunge, hip flexor stretch', 1, 1, '{"type":"hold","min_hold_seconds":60}', '{"type":"hold","min_hold_seconds":120}', 5),
('c0190002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000019', NULL, 'Half Split', 'Front leg straight, rear knee down', 2, 2, '{"type":"hold","min_hold_seconds":60}', '{"type":"hold","min_hold_seconds":120}', 10),
('c0190003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000019', NULL, 'Full Front Split', 'Flat on ground', 3, 3, '{"type":"hold","min_hold_seconds":30}', '{"type":"hold","min_hold_seconds":60}', 20)
ON CONFLICT (id) DO NOTHING;

-- PATH 20: Handstand (5 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0200001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000020', NULL, 'Wall Handstand Hold', 'Chest to wall hold', 1, 1, '{"type":"hold","min_hold_seconds":30}', '{"type":"hold","min_hold_seconds":60}', 8),
('c0200002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000020', NULL, 'Back-to-Wall HS', 'Back facing wall, kick up', 2, 2, '{"type":"hold","min_hold_seconds":20}', '{"type":"hold","min_hold_seconds":45}', 10),
('c0200003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000020', NULL, 'Freestanding HS 10s', 'No wall, 10 second hold', 3, 3, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 15),
('c0200004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000020', NULL, 'Freestanding HS 30s', 'No wall, 30 second hold', 4, 4, '{"type":"hold","min_hold_seconds":30}', '{"type":"hold","min_hold_seconds":45}', 20),
('c0200005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000020', NULL, 'One-Arm Handstand', 'Single arm handstand', 5, 5, '{"type":"hold","min_hold_seconds":3}', '{"type":"hold","min_hold_seconds":8}', 30)
ON CONFLICT (id) DO NOTHING;

-- PATH 21: Ring Skills (4 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0210001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000021', NULL, 'Ring Support Hold', 'Arms locked on rings', 1, 1, '{"type":"hold","min_hold_seconds":20}', '{"type":"hold","min_hold_seconds":45}', 8),
('c0210002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000021', NULL, 'Ring L-Sit', 'L-sit on rings', 2, 2, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 12),
('c0210003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000021', NULL, 'Ring RTO Support', 'Rings turned out hold', 3, 3, '{"type":"hold","min_hold_seconds":10}', '{"type":"hold","min_hold_seconds":20}', 15),
('c0210004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000021', NULL, 'Iron Cross Prep', 'Partial iron cross with bands', 4, 4, '{"type":"hold","min_hold_seconds":5}', '{"type":"hold","min_hold_seconds":10}', 25)
ON CONFLICT (id) DO NOTHING;

-- PATH 22: Row (5 nodes)
INSERT INTO skill_nodes (id, path_id, exercise_id, name, description, tier, sort_order, unlock_criteria, mastery_criteria, momentum_reward) VALUES
('c0220001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000022', NULL, 'Incline Row', 'Hands high, body angled', 1, 1, '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', '{"type":"sets_at_reps","min_sets":3,"min_reps":20}', 5),
('c0220002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000022', NULL, 'Horizontal Row', 'Body parallel to ground', 2, 2, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":15}', 8),
('c0220003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000022', NULL, 'Feet Elevated Row', 'Feet on box, harder angle', 3, 3, '{"type":"sets_at_reps","min_sets":3,"min_reps":10}', '{"type":"sets_at_reps","min_sets":3,"min_reps":12}', 10),
('c0220004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000022', NULL, 'Archer Row', 'One arm does most work', 4, 4, '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', '{"type":"sets_at_reps","min_sets":3,"min_reps":8}', 15),
('c0220005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000022', NULL, 'Front Lever Row', 'Row in front lever position', 5, 5, '{"type":"sets_at_reps","min_sets":3,"min_reps":3}', '{"type":"sets_at_reps","min_sets":3,"min_reps":5}', 22)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PREREQUISITE EDGES
-- Each node requires the previous node in its path to be unlocked
-- =============================================================================

-- Push-Up chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0010002-0000-0000-0000-000000000001', 'c0010001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0010003-0000-0000-0000-000000000001', 'c0010002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0010004-0000-0000-0000-000000000001', 'c0010003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0010005-0000-0000-0000-000000000001', 'c0010004-0000-0000-0000-000000000001', 'g1', 'and'),
('c0010006-0000-0000-0000-000000000001', 'c0010005-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Dip chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0020002-0000-0000-0000-000000000001', 'c0020001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0020003-0000-0000-0000-000000000001', 'c0020002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0020004-0000-0000-0000-000000000001', 'c0020003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0020005-0000-0000-0000-000000000001', 'c0020004-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Planche chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0030002-0000-0000-0000-000000000001', 'c0030001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0030003-0000-0000-0000-000000000001', 'c0030002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0030004-0000-0000-0000-000000000001', 'c0030003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0030005-0000-0000-0000-000000000001', 'c0030004-0000-0000-0000-000000000001', 'g1', 'and'),
('c0030006-0000-0000-0000-000000000001', 'c0030005-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- HSPU chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0040002-0000-0000-0000-000000000001', 'c0040001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0040003-0000-0000-0000-000000000001', 'c0040002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0040004-0000-0000-0000-000000000001', 'c0040003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0040005-0000-0000-0000-000000000001', 'c0040004-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Pull-Up chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0050002-0000-0000-0000-000000000001', 'c0050001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0050003-0000-0000-0000-000000000001', 'c0050002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0050004-0000-0000-0000-000000000001', 'c0050003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0050005-0000-0000-0000-000000000001', 'c0050004-0000-0000-0000-000000000001', 'g1', 'and'),
('c0050006-0000-0000-0000-000000000001', 'c0050005-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Chin-Up chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0060002-0000-0000-0000-000000000001', 'c0060001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0060003-0000-0000-0000-000000000001', 'c0060002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0060004-0000-0000-0000-000000000001', 'c0060003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Muscle-Up chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0070002-0000-0000-0000-000000000001', 'c0070001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0070003-0000-0000-0000-000000000001', 'c0070002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0070004-0000-0000-0000-000000000001', 'c0070003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Front Lever chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0080002-0000-0000-0000-000000000001', 'c0080001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0080003-0000-0000-0000-000000000001', 'c0080002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0080004-0000-0000-0000-000000000001', 'c0080003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0080005-0000-0000-0000-000000000001', 'c0080004-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Back Lever chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0090002-0000-0000-0000-000000000001', 'c0090001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0090003-0000-0000-0000-000000000001', 'c0090002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0090004-0000-0000-0000-000000000001', 'c0090003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0090005-0000-0000-0000-000000000001', 'c0090004-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Squat chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0100002-0000-0000-0000-000000000001', 'c0100001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0100003-0000-0000-0000-000000000001', 'c0100002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0100004-0000-0000-0000-000000000001', 'c0100003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0100005-0000-0000-0000-000000000001', 'c0100004-0000-0000-0000-000000000001', 'g1', 'and'),
('c0100006-0000-0000-0000-000000000001', 'c0100005-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Nordic chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0110002-0000-0000-0000-000000000001', 'c0110001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0110003-0000-0000-0000-000000000001', 'c0110002-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Calf chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0120002-0000-0000-0000-000000000001', 'c0120001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0120003-0000-0000-0000-000000000001', 'c0120002-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- L-Sit chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0130002-0000-0000-0000-000000000001', 'c0130001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0130003-0000-0000-0000-000000000001', 'c0130002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0130004-0000-0000-0000-000000000001', 'c0130003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Dragon Flag chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0140002-0000-0000-0000-000000000001', 'c0140001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0140003-0000-0000-0000-000000000001', 'c0140002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0140004-0000-0000-0000-000000000001', 'c0140003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Human Flag chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0150002-0000-0000-0000-000000000001', 'c0150001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0150003-0000-0000-0000-000000000001', 'c0150002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0150004-0000-0000-0000-000000000001', 'c0150003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Ab Wheel chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0160002-0000-0000-0000-000000000001', 'c0160001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0160003-0000-0000-0000-000000000001', 'c0160002-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Windshield Wiper chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0170002-0000-0000-0000-000000000001', 'c0170001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0170003-0000-0000-0000-000000000001', 'c0170002-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Bridge chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0180002-0000-0000-0000-000000000001', 'c0180001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0180003-0000-0000-0000-000000000001', 'c0180002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0180004-0000-0000-0000-000000000001', 'c0180003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Splits chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0190002-0000-0000-0000-000000000001', 'c0190001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0190003-0000-0000-0000-000000000001', 'c0190002-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Handstand chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0200002-0000-0000-0000-000000000001', 'c0200001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0200003-0000-0000-0000-000000000001', 'c0200002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0200004-0000-0000-0000-000000000001', 'c0200003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0200005-0000-0000-0000-000000000001', 'c0200004-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Ring Skills chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0210002-0000-0000-0000-000000000001', 'c0210001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0210003-0000-0000-0000-000000000001', 'c0210002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0210004-0000-0000-0000-000000000001', 'c0210003-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;

-- Row chain
INSERT INTO node_prerequisites (node_id, required_node_id, group_id, logic) VALUES
('c0220002-0000-0000-0000-000000000001', 'c0220001-0000-0000-0000-000000000001', 'g1', 'and'),
('c0220003-0000-0000-0000-000000000001', 'c0220002-0000-0000-0000-000000000001', 'g1', 'and'),
('c0220004-0000-0000-0000-000000000001', 'c0220003-0000-0000-0000-000000000001', 'g1', 'and'),
('c0220005-0000-0000-0000-000000000001', 'c0220004-0000-0000-0000-000000000001', 'g1', 'and')
ON CONFLICT DO NOTHING;
