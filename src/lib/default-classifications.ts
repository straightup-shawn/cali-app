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
  muscle_groups: string[];
}

/**
 * Lookup by normalized exercise name (lowercase, trimmed).
 */
const DEFAULTS: Record<string, DefaultClassification> = {
  // Push variants
  'push-up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'push up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'pushup': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'diamond push-up': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['triceps', 'chest', 'shoulders'] },
  'wide push-up': { bodyweight_fraction: 0.64, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'shoulders', 'triceps'] },
  'decline push-up': { bodyweight_fraction: 0.74, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'shoulders', 'triceps'] },
  'incline push-up': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'archer push-up': { bodyweight_fraction: 0.72, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'pike push-up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['shoulders', 'triceps', 'chest'] },
  'pseudo planche push-up': { bodyweight_fraction: 0.76, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'shoulders', 'triceps', 'core'] },
  'hindu push-up': { bodyweight_fraction: 0.68, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'shoulders', 'triceps', 'core'] },

  // Pull variants
  'pull-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['back', 'biceps', 'forearms'] },
  'pull up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['back', 'biceps', 'forearms'] },
  'chin-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['biceps', 'back', 'forearms'] },
  'chin up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['biceps', 'back', 'forearms'] },
  'muscle-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['back', 'chest', 'triceps', 'biceps', 'shoulders'] },
  'muscle up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['back', 'chest', 'triceps', 'biceps', 'shoulders'] },
  'australian pull-up': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_pull', muscle_groups: ['back', 'biceps', 'forearms'] },
  'inverted row': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_pull', muscle_groups: ['back', 'biceps', 'forearms'] },
  'negative pull-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['back', 'biceps', 'forearms'] },

  // Dips
  'dip': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'dips': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['chest', 'triceps', 'shoulders'] },
  'ring dip': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['chest', 'triceps', 'shoulders', 'core'] },
  'bench dip': { bodyweight_fraction: 0.60, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['triceps', 'chest', 'shoulders'] },

  // Squats & legs
  'squat': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'bodyweight squat': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'pistol squat': { bodyweight_fraction: 0.95, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'hamstrings', 'core'] },
  'bulgarian split squat': { bodyweight_fraction: 0.75, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'lunge': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'lunges': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'jump squat': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'calves'] },
  'calf raise': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'other', muscle_groups: ['calves'] },
  'step-up': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'glute bridge': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'hinge', muscle_groups: ['glutes', 'hamstrings'] },
  'hip thrust': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'hinge', muscle_groups: ['glutes', 'hamstrings'] },

  // Core
  'plank': { bodyweight_fraction: 0.55, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['core', 'shoulders'] },
  'side plank': { bodyweight_fraction: 0.45, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['obliques', 'core'] },
  'l-sit': { bodyweight_fraction: 0.60, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['core', 'hip_flexors', 'triceps'] },
  'hollow body hold': { bodyweight_fraction: 0.50, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['core', 'hip_flexors'] },
  'hanging leg raise': { bodyweight_fraction: 0.40, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core', 'hip_flexors', 'forearms'] },
  'leg raise': { bodyweight_fraction: 0.35, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core', 'hip_flexors'] },
  'crunch': { bodyweight_fraction: 0.30, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core'] },
  'sit-up': { bodyweight_fraction: 0.35, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core', 'hip_flexors'] },
  'dragon flag': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core', 'back'] },
  'ab wheel rollout': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core', 'shoulders'] },
  'mountain climber': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['core', 'hip_flexors', 'shoulders'] },

  // Handstand & advanced
  'handstand push-up': { bodyweight_fraction: 0.95, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['shoulders', 'triceps', 'core'] },
  'handstand hold': { bodyweight_fraction: 0.95, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'vertical_push', muscle_groups: ['shoulders', 'core', 'triceps'] },
  'front lever': { bodyweight_fraction: 0.85, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'horizontal_pull', muscle_groups: ['back', 'core', 'shoulders'] },
  'back lever': { bodyweight_fraction: 0.80, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'other', muscle_groups: ['back', 'shoulders', 'biceps', 'core'] },
  'human flag': { bodyweight_fraction: 0.85, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'other', muscle_groups: ['obliques', 'shoulders', 'back', 'core'] },
  'planche': { bodyweight_fraction: 0.95, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'horizontal_push', muscle_groups: ['shoulders', 'chest', 'core', 'biceps'] },

  // Other
  'burpee': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'other', muscle_groups: ['chest', 'quads', 'core', 'shoulders'] },
  'jumping jack': { bodyweight_fraction: 0.30, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'cardio', muscle_groups: ['calves', 'shoulders'] },
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
