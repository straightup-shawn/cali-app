// =============================================================================
// Enums / Union Types
// =============================================================================

export type ExerciseType = 'bodyweight' | 'weighted' | 'assisted' | 'duration' | 'static_hold';
export type UnitPreference = 'metric' | 'imperial';
export type RecordType = 'max_reps' | 'max_weight' | 'max_volume' | 'longest_hold';

// =============================================================================
// Domain Models
// =============================================================================

export interface Exercise {
  id: string;
  userId: string | null;
  name: string;
  exerciseType: ExerciseType;
  muscleGroups: string[];
  instructions: string | null;
  progressesTo: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  position: number;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseType: ExerciseType;
  position: number;
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: number | null;
  targetDurationSeconds: number | null;
  restSeconds: number | null;
}

export interface Workout {
  id: string;
  userId: string;
  routineId: string | null;
  name: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseType: ExerciseType;
  position: number;
  restSeconds: number | null;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
  completedAt: string | null;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  recordType: RecordType;
  value: number;
  workoutId: string | null;
  achievedAt: string;
}

export interface BodyweightEntry {
  id: string;
  userId: string;
  weightKg: number;
  entryDate: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  unitPreference: UnitPreference;
  defaultRestSeconds: number;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Active Workout Types (in-progress session state)
// =============================================================================

export interface ActiveWorkout {
  id: string;
  routineId: string | null;
  name: string;
  startedAt: string;
  isPaused: boolean;
  elapsedSeconds: number;
  exercises: ActiveWorkoutExercise[];
}

export interface ActiveWorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseType: ExerciseType;
  position: number;
  restSeconds: number | null;
  sets: ActiveSet[];
}

export interface ActiveSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
  completedAt: string | null;
}

// =============================================================================
// Re-export database types
// =============================================================================

export type { Database } from './database';
