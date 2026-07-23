export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          unit_preference: string;
          default_rest_seconds: number;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          unit_preference?: string;
          default_rest_seconds?: number;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          unit_preference?: string;
          default_rest_seconds?: number;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          exercise_type: string;
          muscle_groups: string[];
          instructions: string | null;
          progresses_to: string | null;
          is_system: boolean;
          created_at: string;
          resistance_model: string | null;
          movement_family: string | null;
          bodyweight_fraction: number | null;
          bodyweight_fraction_min: number | null;
          bodyweight_fraction_max: number | null;
          volume_mode: string | null;
          ai_confidence: number | null;
          ai_rationale: string | null;
          classification_status: string | null;
          analyzed_at: string | null;
          user_overridden: boolean | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          exercise_type: string;
          muscle_groups?: string[];
          instructions?: string | null;
          progresses_to?: string | null;
          is_system?: boolean;
          created_at?: string;
          resistance_model?: string | null;
          movement_family?: string | null;
          bodyweight_fraction?: number | null;
          bodyweight_fraction_min?: number | null;
          bodyweight_fraction_max?: number | null;
          volume_mode?: string | null;
          ai_confidence?: number | null;
          ai_rationale?: string | null;
          classification_status?: string | null;
          analyzed_at?: string | null;
          user_overridden?: boolean | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          exercise_type?: string;
          muscle_groups?: string[];
          instructions?: string | null;
          progresses_to?: string | null;
          is_system?: boolean;
          created_at?: string;
          resistance_model?: string | null;
          movement_family?: string | null;
          bodyweight_fraction?: number | null;
          bodyweight_fraction_min?: number | null;
          bodyweight_fraction_max?: number | null;
          volume_mode?: string | null;
          ai_confidence?: number | null;
          ai_rationale?: string | null;
          classification_status?: string | null;
          analyzed_at?: string | null;
          user_overridden?: boolean | null;
        };
        Relationships: [];
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          position: number;
          target_sets: number | null;
          target_reps: number | null;
          target_weight_kg: number | null;
          target_duration_seconds: number | null;
          rest_seconds: number | null;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          position: number;
          target_sets?: number | null;
          target_reps?: number | null;
          target_weight_kg?: number | null;
          target_duration_seconds?: number | null;
          rest_seconds?: number | null;
        };
        Update: {
          id?: string;
          routine_id?: string;
          exercise_id?: string;
          position?: number;
          target_sets?: number | null;
          target_reps?: number | null;
          target_weight_kg?: number | null;
          target_duration_seconds?: number | null;
          rest_seconds?: number | null;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          name: string;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          notes: string | null;
          bodyweight_snapshot_kg: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          name: string;
          started_at: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          bodyweight_snapshot_kg?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          routine_id?: string | null;
          name?: string;
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          bodyweight_snapshot_kg?: number | null;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          rest_seconds: number | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          rest_seconds?: number | null;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          position?: number;
          rest_seconds?: number | null;
        };
        Relationships: [];
      };
      exercise_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          duration_seconds: number | null;
          rpe: number | null;
          rir: number | null;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          reps?: number | null;
          weight_kg?: number | null;
          duration_seconds?: number | null;
          rpe?: number | null;
          rir?: number | null;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          reps?: number | null;
          weight_kg?: number | null;
          duration_seconds?: number | null;
          rpe?: number | null;
          rir?: number | null;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          record_type: string;
          value: number;
          workout_id: string | null;
          achieved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          record_type: string;
          value: number;
          workout_id?: string | null;
          achieved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          record_type?: string;
          value?: number;
          workout_id?: string | null;
          achieved_at?: string;
        };
        Relationships: [];
      };
      bodyweight_entries: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          entry_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_kg: number;
          entry_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight_kg?: number;
          entry_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
