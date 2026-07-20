-- Migration: Row-Level Security Policies
-- Requirements: 11.3, 14.3

-- =============================================================================
-- Profiles Policies
-- =============================================================================

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (safety net for trigger-based creation)
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================
-- Exercises Policies
-- =============================================================================

-- Users can see system exercises and their own custom exercises
CREATE POLICY "Users read exercises" ON exercises
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

-- Users can manage (insert, update, delete) their own exercises
CREATE POLICY "Users manage own exercises" ON exercises
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Routines Policies
-- =============================================================================

-- Users can manage their own routines
CREATE POLICY "Users manage own routines" ON routines
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Routine Exercises Policies
-- =============================================================================

-- Users can manage routine exercises via routine ownership
CREATE POLICY "Users manage own routine exercises" ON routine_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_id
        AND routines.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Workouts Policies
-- =============================================================================

-- Users can manage their own workouts
CREATE POLICY "Users manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Workout Exercises Policies
-- =============================================================================

-- Users can manage workout exercises via workout ownership
CREATE POLICY "Users manage own workout exercises" ON workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_id
        AND workouts.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Exercise Sets Policies
-- =============================================================================

-- Users can manage exercise sets via workout exercise → workout ownership
CREATE POLICY "Users manage own exercise sets" ON exercise_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id
        AND w.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Personal Records Policies
-- =============================================================================

-- Users can manage their own personal records
CREATE POLICY "Users manage own records" ON personal_records
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Bodyweight Entries Policies
-- =============================================================================

-- Users can manage their own bodyweight entries
CREATE POLICY "Users manage own bodyweight" ON bodyweight_entries
  FOR ALL USING (auth.uid() = user_id);
