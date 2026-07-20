-- Seed Script: Default System Exercises for Calisthenics Log
-- Requirements: 3.1, 14.4
--
-- All exercises have user_id = NULL and is_system = true.
-- Fixed UUIDs allow progression chain references within a single script.
-- Exercises cover bodyweight, weighted, assisted, duration, and static_hold types.

-- =============================================================================
-- PUSH PROGRESSIONS
-- Wall push-up → Incline push-up → Knee push-up → Push-up → Diamond push-up → Archer push-up → One-arm push-up
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000001-0000-0000-0000-000000000001', NULL, 'Wall Push-up', 'bodyweight', '{chest,triceps,shoulders}',
 'Stand facing a wall at arm''s length. Place palms flat on the wall at shoulder height. Bend elbows to bring chest toward the wall, then push back to start.',
 'a0000001-0000-0000-0000-000000000002', true),

('a0000001-0000-0000-0000-000000000002', NULL, 'Incline Push-up', 'bodyweight', '{chest,triceps,shoulders}',
 'Place hands on an elevated surface (bench or step). Keep body in a straight line. Lower chest to the surface and push back up.',
 'a0000001-0000-0000-0000-000000000003', true),

('a0000001-0000-0000-0000-000000000003', NULL, 'Knee Push-up', 'bodyweight', '{chest,triceps,shoulders}',
 'Start in a plank position with knees on the ground. Lower chest to the floor keeping core tight, then push back up.',
 'a0000001-0000-0000-0000-000000000004', true),

('a0000001-0000-0000-0000-000000000004', NULL, 'Push-up', 'bodyweight', '{chest,triceps,shoulders}',
 'Start in a high plank. Lower your body until chest nearly touches the floor, keeping elbows at 45 degrees. Push back to start.',
 'a0000001-0000-0000-0000-000000000005', true),

('a0000001-0000-0000-0000-000000000005', NULL, 'Diamond Push-up', 'bodyweight', '{chest,triceps,shoulders}',
 'Place hands together under your chest forming a diamond shape with thumbs and index fingers. Perform a push-up keeping elbows close to body.',
 'a0000001-0000-0000-0000-000000000006', true),

('a0000001-0000-0000-0000-000000000006', NULL, 'Archer Push-up', 'bodyweight', '{chest,triceps,shoulders}',
 'Start in a wide push-up position. Lower toward one hand while extending the other arm straight out. Alternate sides.',
 'a0000001-0000-0000-0000-000000000007', true),

('a0000001-0000-0000-0000-000000000007', NULL, 'One-arm Push-up', 'bodyweight', '{chest,triceps,shoulders,core}',
 'Place one hand on the floor under your shoulder with feet wide. Lower chest to the floor using one arm, then push back up.',
 NULL, true);

-- =============================================================================
-- PULL PROGRESSIONS
-- Dead hang → Active hang → Australian row → Chin-up → Pull-up → Archer pull-up → Muscle-up
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000002-0000-0000-0000-000000000001', NULL, 'Dead Hang', 'duration', '{forearms,shoulders,back}',
 'Grip a pull-up bar with both hands at shoulder width. Hang with arms fully extended and shoulders relaxed. Hold for time.',
 'a0000002-0000-0000-0000-000000000002', true),

('a0000002-0000-0000-0000-000000000002', NULL, 'Active Hang', 'duration', '{back,shoulders,forearms}',
 'Hang from a bar with arms straight. Engage shoulders by pulling shoulder blades down and back without bending elbows. Hold for time.',
 'a0000002-0000-0000-0000-000000000003', true),

('a0000002-0000-0000-0000-000000000003', NULL, 'Australian Row', 'bodyweight', '{back,biceps,rear_delts}',
 'Set a bar at waist height. Hang underneath with body straight and heels on the floor. Pull chest to the bar, squeezing shoulder blades together.',
 'a0000002-0000-0000-0000-000000000004', true),

('a0000002-0000-0000-0000-000000000004', NULL, 'Chin-up', 'bodyweight', '{back,biceps,forearms}',
 'Grip a pull-up bar with palms facing you at shoulder width. Pull yourself up until chin clears the bar, then lower with control.',
 'a0000002-0000-0000-0000-000000000005', true),

('a0000002-0000-0000-0000-000000000005', NULL, 'Pull-up', 'bodyweight', '{back,biceps,forearms}',
 'Grip a pull-up bar with palms facing away at shoulder width. Pull yourself up until chin clears the bar. Lower under control.',
 'a0000002-0000-0000-0000-000000000006', true),

('a0000002-0000-0000-0000-000000000006', NULL, 'Archer Pull-up', 'bodyweight', '{back,biceps,forearms}',
 'Grip the bar wide. Pull up toward one hand while keeping the other arm straight. Alternate sides each rep.',
 'a0000002-0000-0000-0000-000000000007', true),

('a0000002-0000-0000-0000-000000000007', NULL, 'Muscle-up', 'bodyweight', '{back,chest,triceps,shoulders}',
 'Perform an explosive pull-up. As chin passes the bar, transition by rolling wrists over and pressing up until arms are straight above the bar.',
 NULL, true);

-- =============================================================================
-- SQUAT / LEG PROGRESSIONS
-- Assisted squat → Bodyweight squat → Split squat → Bulgarian split squat → Pistol squat → Shrimp squat
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000003-0000-0000-0000-000000000001', NULL, 'Assisted Squat', 'assisted', '{quads,glutes,hamstrings}',
 'Hold onto a stable support (door frame or pole). Squat down as low as comfortable, using the support to assist balance and depth.',
 'a0000003-0000-0000-0000-000000000002', true),

('a0000003-0000-0000-0000-000000000002', NULL, 'Bodyweight Squat', 'bodyweight', '{quads,glutes,hamstrings}',
 'Stand with feet shoulder-width apart. Bend knees and hips to lower until thighs are parallel to the floor. Drive through heels to stand.',
 'a0000003-0000-0000-0000-000000000003', true),

('a0000003-0000-0000-0000-000000000003', NULL, 'Split Squat', 'bodyweight', '{quads,glutes,hamstrings}',
 'Stand in a staggered stance with one foot forward. Lower back knee toward the floor while keeping front shin vertical. Push up through front foot.',
 'a0000003-0000-0000-0000-000000000004', true),

('a0000003-0000-0000-0000-000000000004', NULL, 'Bulgarian Split Squat', 'bodyweight', '{quads,glutes,hamstrings}',
 'Place rear foot on an elevated surface behind you. Lower into a single-leg squat on the front leg until thigh is parallel. Push back up.',
 'a0000003-0000-0000-0000-000000000005', true),

('a0000003-0000-0000-0000-000000000005', NULL, 'Pistol Squat', 'bodyweight', '{quads,glutes,hamstrings,core}',
 'Stand on one leg with the other extended forward. Squat all the way down on one leg keeping the extended leg off the floor. Stand back up.',
 'a0000003-0000-0000-0000-000000000006', true),

('a0000003-0000-0000-0000-000000000006', NULL, 'Shrimp Squat', 'bodyweight', '{quads,glutes,hamstrings,core}',
 'Stand on one leg, grab the other foot behind you. Squat down until the back knee touches the floor, then stand back up.',
 NULL, true);

-- =============================================================================
-- CORE PROGRESSIONS
-- Dead bug → Plank → Side plank → Hollow body hold → L-sit → Dragon flag → Front lever
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000004-0000-0000-0000-000000000001', NULL, 'Dead Bug', 'bodyweight', '{core,hip_flexors}',
 'Lie on your back with arms extended toward the ceiling and knees bent at 90 degrees. Slowly extend opposite arm and leg while keeping lower back pressed to the floor.',
 'a0000004-0000-0000-0000-000000000002', true),

('a0000004-0000-0000-0000-000000000002', NULL, 'Plank', 'duration', '{core,shoulders,glutes}',
 'Support your body on forearms and toes with body in a straight line from head to heels. Keep core engaged and hips level. Hold for time.',
 'a0000004-0000-0000-0000-000000000003', true),

('a0000004-0000-0000-0000-000000000003', NULL, 'Side Plank', 'duration', '{obliques,core,shoulders}',
 'Lie on your side. Prop up on one forearm with feet stacked. Lift hips to form a straight line from head to feet. Hold for time.',
 'a0000004-0000-0000-0000-000000000004', true),

('a0000004-0000-0000-0000-000000000004', NULL, 'Hollow Body Hold', 'static_hold', '{core,hip_flexors}',
 'Lie on your back. Lift shoulders and legs off the floor with arms overhead. Press lower back into the floor and hold the hollow position.',
 'a0000004-0000-0000-0000-000000000005', true),

('a0000004-0000-0000-0000-000000000005', NULL, 'L-sit', 'static_hold', '{core,hip_flexors,triceps}',
 'Support yourself on parallel bars or the floor with arms straight. Lift legs to horizontal, forming an L-shape with your body. Hold position.',
 'a0000004-0000-0000-0000-000000000006', true),

('a0000004-0000-0000-0000-000000000006', NULL, 'Dragon Flag', 'bodyweight', '{core,hip_flexors,lower_back}',
 'Lie on a bench gripping behind your head. Lift entire body off the bench keeping it straight. Lower slowly under control without arching.',
 'a0000004-0000-0000-0000-000000000007', true),

('a0000004-0000-0000-0000-000000000007', NULL, 'Front Lever', 'static_hold', '{back,core,shoulders}',
 'Hang from a bar. Raise your body to horizontal with arms straight, forming a straight line parallel to the ground. Hold position.',
 NULL, true);

-- =============================================================================
-- DIP PROGRESSIONS
-- Bench dip → Parallel bar dip → Ring dip → Weighted dip
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000005-0000-0000-0000-000000000001', NULL, 'Bench Dip', 'bodyweight', '{triceps,chest,shoulders}',
 'Place hands on a bench behind you with fingers forward. Extend legs in front. Lower body by bending elbows to 90 degrees, then push up.',
 'a0000005-0000-0000-0000-000000000002', true),

('a0000005-0000-0000-0000-000000000002', NULL, 'Parallel Bar Dip', 'bodyweight', '{chest,triceps,shoulders}',
 'Support yourself on parallel bars with arms straight. Lower body by bending elbows until shoulders are below elbows. Push back to top.',
 'a0000005-0000-0000-0000-000000000003', true),

('a0000005-0000-0000-0000-000000000003', NULL, 'Ring Dip', 'bodyweight', '{chest,triceps,shoulders,core}',
 'Support yourself on gymnastic rings with arms straight and rings turned out. Lower until shoulders are below elbows, then press back up.',
 'a0000005-0000-0000-0000-000000000004', true),

('a0000005-0000-0000-0000-000000000004', NULL, 'Weighted Dip', 'weighted', '{chest,triceps,shoulders}',
 'Attach additional weight via a dip belt or weighted vest. Perform dips on parallel bars with the added resistance.',
 NULL, true);

-- =============================================================================
-- HANDSTAND PROGRESSIONS
-- Wall handstand hold → Handstand hold → Handstand push-up
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000006-0000-0000-0000-000000000001', NULL, 'Wall Handstand Hold', 'static_hold', '{shoulders,triceps,core,traps}',
 'Kick up into a handstand with feet resting against a wall. Keep arms locked, push through shoulders, and hold for time.',
 'a0000006-0000-0000-0000-000000000002', true),

('a0000006-0000-0000-0000-000000000002', NULL, 'Handstand Hold', 'static_hold', '{shoulders,triceps,core,traps}',
 'Kick up into a freestanding handstand. Balance with arms locked, fingers spread, and body in a straight line. Hold for time.',
 'a0000006-0000-0000-0000-000000000003', true),

('a0000006-0000-0000-0000-000000000003', NULL, 'Handstand Push-up', 'bodyweight', '{shoulders,triceps,traps,core}',
 'From a handstand against a wall, lower your head toward the floor by bending elbows. Press back up to full arm extension.',
 NULL, true);

-- =============================================================================
-- ADDITIONAL STATIC HOLDS (not part of other chains)
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000007-0000-0000-0000-000000000001', NULL, 'Back Lever', 'static_hold', '{back,shoulders,biceps,core}',
 'Hang from a bar and rotate body backward until horizontal and face-down with arms straight. Hold the position.',
 NULL, true),

('a0000007-0000-0000-0000-000000000002', NULL, 'Planche', 'static_hold', '{shoulders,chest,core,wrists}',
 'Support your body on straight arms with feet off the ground, body horizontal and face-down. Lean forward and hold.',
 NULL, true);

-- =============================================================================
-- ADDITIONAL WEIGHTED EXERCISES
-- =============================================================================

INSERT INTO exercises (id, user_id, name, exercise_type, muscle_groups, instructions, progresses_to, is_system) VALUES
('a0000008-0000-0000-0000-000000000001', NULL, 'Weighted Pull-up', 'weighted', '{back,biceps,forearms}',
 'Attach additional weight via a dip belt or weighted vest. Perform pull-ups with the added resistance, full range of motion.',
 NULL, true),

('a0000008-0000-0000-0000-000000000002', NULL, 'Weighted Push-up', 'weighted', '{chest,triceps,shoulders}',
 'Place a weight plate on your upper back or wear a weighted vest. Perform push-ups with the added resistance.',
 NULL, true);
