/**
 * Default bodyweight fraction estimates for common calisthenics exercises.
 * Used as fallback when AI classification is unavailable (e.g., CORS blocks API).
 *
 * Values based on published biomechanics research:
 * - Push-up variants: 0.55–0.78 depending on elevation
 * - Pull-up/chin-up: ~1.0
 * - Dip: ~1.0
 * - Squat (bodyweight): ~0.67
 * - Plank/hold: ~0.55–0.65
 */

export interface DefaultClassification {
  bodyweight_fraction: number;
  resistance_model: string;
  volume_mode: string;
  movement_family: string;
}

/**
 * Lookup by normalized exercise name (lowercase, trimmed).
 */
const DEFAULTS: Record<string, DefaultClassification> = {
  // Push variants
  'push-up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'push up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'pushup': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'diamond push-up': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'wide push-up': { bodyweight_fraction: 0.64, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'decline push-up': { bodyweight_fraction: 0.74, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'incline push-up': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'archer push-up': { bodyweight_fraction: 0.72, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'pike push-up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push' },
  'pseudo planche push-up': { bodyweight_fraction: 0.76, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },
  'hindu push-up': { bodyweight_fraction: 0.68, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push' },

  // Pull variants
  'pull-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },
  'pull up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },
  'chin-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },
  'chin up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },
  'muscle-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },
  'muscle up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },
  'australian pull-up': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_pull' },
  'inverted row': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_pull' },
  'negative pull-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull' },

  // Dips
  'dip': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push' },
  'dips': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push' },
  'ring dip': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push' },
  'bench dip': { bodyweight_fraction: 0.60, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push' },

  // Squats & legs
  'squat': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat' },
  'bodyweight squat': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat' },
  'pistol squat': { bodyweight_fraction: 0.95, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat' },
  'bulgarian split squat': { bodyweight_fraction: 0.75, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge' },
  'lunge': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge' },
  'lunges': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge' },
  'jump squat': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat' },
  'calf raise': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'other' },
  'step-up': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge' },
  'glute bridge': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'hinge' },
  'hip thrust': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'hinge' },

  // Core
  'plank': { bodyweight_fraction: 0.55, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core' },
  'side plank': { bodyweight_fraction: 0.45, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core' },
  'l-sit': { bodyweight_fraction: 0.60, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core' },
  'hollow body hold': { bodyweight_fraction: 0.50, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core' },
  'hanging leg raise': { bodyweight_fraction: 0.40, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },
  'leg raise': { bodyweight_fraction: 0.35, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },
  'crunch': { bodyweight_fraction: 0.30, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },
  'sit-up': { bodyweight_fraction: 0.35, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },
  'dragon flag': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },
  'ab wheel rollout': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },
  'mountain climber': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core' },

  // Handstand & advanced
  'handstand push-up': { bodyweight_fraction: 0.95, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push' },
  'handstand hold': { bodyweight_fraction: 0.95, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'vertical_push' },
  'front lever': { bodyweight_fraction: 0.85, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'horizontal_pull' },
  'back lever': { bodyweight_fraction: 0.80, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'other' },
  'human flag': { bodyweight_fraction: 0.85, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'other' },
  'planche': { bodyweight_fraction: 0.95, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'horizontal_push' },

  // Other
  'burpee': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'other' },
  'jumping jack': { bodyweight_fraction: 0.30, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'cardio' },
};

/**
 * Get a default classification for an exercise by name.
 * Returns null if no default is available.
 */
export function getDefaultClassification(exerciseName: string): DefaultClassification | null {
  const normalized = exerciseName.toLowerCase().trim();

  // Direct match
  if (DEFAULTS[normalized]) return DEFAULTS[normalized];

  // Partial match — check if any key is contained in the name or vice versa
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

/**
 * Get a default bodyweight fraction based on exercise type alone.
 * Used as a last resort when no name match is found.
 */
export function getDefaultFractionByType(exerciseType: string): number {
  switch (exerciseType) {
    case 'bodyweight': return 0.65;
    case 'weighted': return 0;
    case 'assisted': return 0.65;
    case 'duration': return 0.50;
    case 'static_hold': return 0.55;
    default: return 0;
  }
}
