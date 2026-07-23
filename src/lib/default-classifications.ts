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
  'push-up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'push up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'pushup': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'diamond push-up': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['triceps', 'chest', 'front_delts'] },
  'wide push-up': { bodyweight_fraction: 0.64, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'front_delts', 'triceps'] },
  'decline push-up': { bodyweight_fraction: 0.74, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['upper_chest', 'front_delts', 'triceps'] },
  'incline push-up': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'archer push-up': { bodyweight_fraction: 0.72, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'pike push-up': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['front_delts', 'side_delts', 'triceps', 'upper_chest'] },
  'pseudo planche push-up': { bodyweight_fraction: 0.76, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'front_delts', 'biceps', 'abs'] },
  'hindu push-up': { bodyweight_fraction: 0.68, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_push', muscle_groups: ['chest', 'front_delts', 'triceps', 'erector_spinae'] },

  // Pull variants
  'pull-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['lats', 'biceps', 'upper_back', 'forearms', 'rear_delts'] },
  'pull up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['lats', 'biceps', 'upper_back', 'forearms', 'rear_delts'] },
  'chin-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['biceps', 'lats', 'forearms', 'upper_back'] },
  'chin up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['biceps', 'lats', 'forearms', 'upper_back'] },
  'muscle-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['lats', 'chest', 'triceps', 'biceps', 'front_delts', 'abs'] },
  'muscle up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['lats', 'chest', 'triceps', 'biceps', 'front_delts', 'abs'] },
  'australian pull-up': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_pull', muscle_groups: ['upper_back', 'lats', 'biceps', 'rear_delts', 'rhomboids'] },
  'inverted row': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'horizontal_pull', muscle_groups: ['upper_back', 'lats', 'biceps', 'rear_delts', 'rhomboids'] },
  'negative pull-up': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_pull', muscle_groups: ['lats', 'biceps', 'forearms', 'upper_back'] },

  // Dips
  'dip': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'dips': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['chest', 'triceps', 'front_delts'] },
  'ring dip': { bodyweight_fraction: 1.0, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['chest', 'triceps', 'front_delts', 'abs'] },
  'bench dip': { bodyweight_fraction: 0.60, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['triceps', 'chest', 'front_delts'] },

  // Squats & legs
  'squat': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'hamstrings', 'adductors'] },
  'bodyweight squat': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'hamstrings', 'adductors'] },
  'pistol squat': { bodyweight_fraction: 0.95, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'hamstrings', 'abs', 'adductors'] },
  'bulgarian split squat': { bodyweight_fraction: 0.75, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings', 'adductors'] },
  'lunge': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'lunges': { bodyweight_fraction: 0.67, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'jump squat': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'squat', muscle_groups: ['quads', 'glutes', 'calves'] },
  'calf raise': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'other', muscle_groups: ['calves'] },
  'step-up': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'lunge', muscle_groups: ['quads', 'glutes', 'hamstrings'] },
  'glute bridge': { bodyweight_fraction: 0.50, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'hinge', muscle_groups: ['glutes', 'hamstrings', 'erector_spinae'] },
  'hip thrust': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'hinge', muscle_groups: ['glutes', 'hamstrings', 'erector_spinae'] },

  // Core
  'plank': { bodyweight_fraction: 0.55, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['abs', 'transverse_abs', 'front_delts', 'erector_spinae'] },
  'side plank': { bodyweight_fraction: 0.45, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['obliques', 'abs', 'abductors'] },
  'l-sit': { bodyweight_fraction: 0.60, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['abs', 'hip_flexors', 'triceps', 'quads'] },
  'hollow body hold': { bodyweight_fraction: 0.50, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'core', muscle_groups: ['abs', 'transverse_abs', 'hip_flexors'] },
  'hanging leg raise': { bodyweight_fraction: 0.40, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs', 'hip_flexors', 'forearms', 'obliques'] },
  'leg raise': { bodyweight_fraction: 0.35, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs', 'hip_flexors'] },
  'crunch': { bodyweight_fraction: 0.30, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs'] },
  'sit-up': { bodyweight_fraction: 0.35, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs', 'hip_flexors'] },
  'dragon flag': { bodyweight_fraction: 0.70, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs', 'lats', 'erector_spinae'] },
  'ab wheel rollout': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs', 'lats', 'front_delts', 'triceps'] },
  'mountain climber': { bodyweight_fraction: 0.55, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'core', muscle_groups: ['abs', 'hip_flexors', 'front_delts', 'quads'] },

  // Handstand & advanced
  'handstand push-up': { bodyweight_fraction: 0.95, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'vertical_push', muscle_groups: ['front_delts', 'side_delts', 'triceps', 'upper_chest', 'traps'] },
  'handstand hold': { bodyweight_fraction: 0.95, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'vertical_push', muscle_groups: ['front_delts', 'side_delts', 'traps', 'abs', 'forearms'] },
  'front lever': { bodyweight_fraction: 0.85, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'horizontal_pull', muscle_groups: ['lats', 'abs', 'rear_delts', 'upper_back', 'biceps'] },
  'back lever': { bodyweight_fraction: 0.80, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'other', muscle_groups: ['front_delts', 'biceps', 'chest', 'abs', 'erector_spinae'] },
  'human flag': { bodyweight_fraction: 0.85, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'other', muscle_groups: ['obliques', 'lats', 'front_delts', 'abs', 'adductors'] },
  'planche': { bodyweight_fraction: 0.95, resistance_model: 'isometric_bodyweight', volume_mode: 'duration', movement_family: 'horizontal_push', muscle_groups: ['front_delts', 'chest', 'biceps', 'abs', 'traps'] },

  // Other
  'burpee': { bodyweight_fraction: 0.65, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'other', muscle_groups: ['chest', 'quads', 'abs', 'front_delts', 'triceps'] },
  'jumping jack': { bodyweight_fraction: 0.30, resistance_model: 'bodyweight', volume_mode: 'repetitions', movement_family: 'cardio', muscle_groups: ['calves', 'side_delts', 'adductors'] },
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
