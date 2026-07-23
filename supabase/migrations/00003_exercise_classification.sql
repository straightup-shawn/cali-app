-- Migration: Add AI classification fields to exercises table
-- Feature: Effective Resistance and Estimated Volume system

-- =============================================================================
-- Add AI classification fields to exercises table
-- =============================================================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS resistance_model text DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_family text DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS bodyweight_fraction numeric(4,3) DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS bodyweight_fraction_min numeric(4,3) DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS bodyweight_fraction_max numeric(4,3) DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS volume_mode text DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS ai_confidence numeric(3,2) DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS ai_rationale text DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS classification_status text DEFAULT 'pending';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS analyzed_at timestamptz DEFAULT NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_overridden boolean DEFAULT false;

-- =============================================================================
-- Add bodyweight snapshot to workouts
-- =============================================================================

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS bodyweight_snapshot_kg numeric(5,2) DEFAULT NULL;
