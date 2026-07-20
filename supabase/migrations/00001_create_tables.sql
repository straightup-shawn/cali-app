-- Migration: Create all tables for Calisthenics Log
-- Requirements: 14.3

-- =============================================================================
-- Utility Functions
-- =============================================================================

-- Trigger function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Tables
-- =============================================================================

-- profiles: extends auth.users, created via trigger on signup
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  unit_preference text NOT NULL DEFAULT 'metric'
    CHECK (unit_preference IN ('metric', 'imperial')),
  default_rest_seconds integer NOT NULL DEFAULT 90,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- exercises: system-default and user-created exercises
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  exercise_type text NOT NULL
    CHECK (exercise_type IN ('bodyweight', 'weighted', 'assisted', 'duration', 'static_hold')),
  muscle_groups text[] DEFAULT '{}',
  instructions text,
  progresses_to uuid REFERENCES exercises(id) ON DELETE SET NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exercises_unique_user_name UNIQUE (user_id, name)
);

-- routines: workout templates
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- routine_exercises: exercises within a routine template
CREATE TABLE routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position integer NOT NULL,
  target_sets integer DEFAULT 3,
  target_reps integer,
  target_weight_kg numeric(7,2),
  target_duration_seconds integer,
  rest_seconds integer
);

-- workouts: completed workout sessions
CREATE TABLE workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES routines(id) ON DELETE SET NULL,
  name text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  duration_seconds integer,
  notes text
);

-- workout_exercises: exercises performed within a workout session
CREATE TABLE workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position integer NOT NULL,
  rest_seconds integer
);

-- exercise_sets: individual sets within a workout exercise
CREATE TABLE exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  reps integer,
  weight_kg numeric(7,2),
  duration_seconds integer,
  rpe numeric(3,1) CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  rir integer CHECK (rir IS NULL OR (rir >= 0 AND rir <= 5)),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);

-- personal_records: best performances per exercise per metric
CREATE TABLE personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  record_type text NOT NULL
    CHECK (record_type IN ('max_reps', 'max_weight', 'max_volume', 'longest_hold')),
  value numeric NOT NULL,
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personal_records_unique UNIQUE (user_id, exercise_id, record_type)
);

-- bodyweight_entries: user bodyweight log
CREATE TABLE bodyweight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg numeric(5,2) NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bodyweight_entries_unique UNIQUE (user_id, entry_date)
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- profiles
CREATE INDEX idx_profiles_id ON profiles(id);

-- exercises
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_is_system ON exercises(is_system);
CREATE INDEX idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_progresses_to ON exercises(progresses_to);

-- routines
CREATE INDEX idx_routines_user_id ON routines(user_id);

-- routine_exercises
CREATE INDEX idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);

-- workouts
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_routine_id ON workouts(routine_id);
CREATE INDEX idx_workouts_started_at ON workouts(started_at);
CREATE INDEX idx_workouts_completed_at ON workouts(completed_at);

-- workout_exercises
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);

-- exercise_sets
CREATE INDEX idx_exercise_sets_workout_exercise_id ON exercise_sets(workout_exercise_id);

-- personal_records
CREATE INDEX idx_personal_records_user_id ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise_id ON personal_records(exercise_id);
CREATE INDEX idx_personal_records_workout_id ON personal_records(workout_id);

-- bodyweight_entries
CREATE INDEX idx_bodyweight_entries_user_id ON bodyweight_entries(user_id);
CREATE INDEX idx_bodyweight_entries_entry_date ON bodyweight_entries(entry_date);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-update updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-update updated_at on routines
CREATE TRIGGER routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- Enable Row-Level Security (policies will be added in a separate migration)
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodyweight_entries ENABLE ROW LEVEL SECURITY;
