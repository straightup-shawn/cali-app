/**
 * Volume Calculator — Pure functions for computing effective resistance
 * and estimated volume from bodyweight fraction data.
 *
 * No AI calls happen here — all values are pre-computed from classifications.
 */

// =============================================================================
// Types
// =============================================================================

export interface EffectiveResistanceInput {
  bodyweightKg: number;
  bodyweightFraction: number;
  addedResistanceKg: number;
  assistanceKg: number;
  resistanceModel: string;
}

// =============================================================================
// Core Calculations
// =============================================================================

/**
 * Calculates the effective resistance for a single set.
 *
 * For bodyweight exercises: (bodyweight × fraction) + added weight - assistance
 * For external_load_only: just the added weight (e.g. dumbbell curls)
 * For not_quantifiable: returns 0
 */
export function calculateEffectiveResistance(input: EffectiveResistanceInput): number {
  if (input.resistanceModel === 'external_load_only') {
    return input.addedResistanceKg;
  }
  if (input.resistanceModel === 'not_quantifiable') {
    return 0;
  }
  const bodyweightLoad = input.bodyweightKg * input.bodyweightFraction;
  return Math.max(0, bodyweightLoad + input.addedResistanceKg - input.assistanceKg);
}

/**
 * Calculates the volume for a rep-based set.
 * Volume = effective resistance × reps
 */
export function calculateSetVolume(effectiveResistanceKg: number, reps: number): number {
  return effectiveResistanceKg * reps;
}

/**
 * Calculates the isometric load for a duration-based set.
 * Load = effective resistance × duration in seconds (kg·s)
 */
export function calculateIsometricLoad(effectiveResistanceKg: number, durationSeconds: number): number {
  return effectiveResistanceKg * durationSeconds;
}

// =============================================================================
// Formatting
// =============================================================================

/**
 * Formats a volume value (kg·reps) for display.
 * e.g. 1500 → "1.5k kg", 450 → "450 kg"
 */
export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k kg`;
  return `${Math.round(kg)} kg`;
}

/**
 * Formats an isometric load (kg·s) for display.
 * e.g. 65000 → "1.1k kg·min", 2400 → "2.4k kg·s", 800 → "800 kg·s"
 */
export function formatIsometricLoad(kgSeconds: number): string {
  if (kgSeconds >= 60000) return `${(kgSeconds / 60000).toFixed(1)}k kg·min`;
  if (kgSeconds >= 1000) return `${(kgSeconds / 1000).toFixed(1)}k kg·s`;
  return `${Math.round(kgSeconds)} kg·s`;
}
