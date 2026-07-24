/**
 * Exercise Classification Backfill
 *
 * Finds all exercises where classification_status is null or 'pending',
 * batches them, classifies each using AI (with local fallback), and saves results.
 */

import { supabase } from '@/lib/supabase';
import { classifyExercise } from '@/lib/exercise-classifier';
import { getDefaultClassification, getDefaultFractionByType } from '@/lib/default-classifications';
import type { ExerciseInput } from '@/lib/exercise-classifier';

// =============================================================================
// Types
// =============================================================================

export interface BackfillProgress {
  total: number;
  completed: number;
  failed: number;
  current: string | null;
}

export type ProgressCallback = (progress: BackfillProgress) => void;

// =============================================================================
// Backfill Function
// =============================================================================

/**
 * Classifies all exercises that haven't been analyzed yet.
 * Tries AI first, falls back to built-in defaults if AI unavailable.
 * Processes in batches of 5 with 500ms delay between batches.
 */
export async function backfillExerciseClassifications(
  onProgress?: ProgressCallback,
): Promise<{ total: number; succeeded: number; failed: number }> {
  // Fetch ALL exercises — re-tags muscle groups and re-classifies any that need it
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, exercise_type, muscle_groups, instructions, classification_status');

  if (error) throw error;
  if (!exercises || exercises.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const total = exercises.length;
  let succeeded = 0;
  let failed = 0;

  // Test if AI is available with the first exercise
  let aiAvailable = true;
  try {
    const testInput: ExerciseInput = {
      name: exercises[0].name,
      exercise_type: exercises[0].exercise_type,
      muscle_groups: exercises[0].muscle_groups ?? [],
      instructions: exercises[0].instructions,
    };
    await classifyExercise(testInput);
  } catch {
    aiAvailable = false;
  }

  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = aiAvailable ? 1000 : 100; // Fast when using local defaults

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (exercise) => {
        onProgress?.({
          total,
          completed: succeeded + failed,
          failed,
          current: exercise.name,
        });

        const input: ExerciseInput = {
          name: exercise.name,
          exercise_type: exercise.exercise_type,
          muscle_groups: exercise.muscle_groups ?? [],
          instructions: exercise.instructions,
        };

        let result;

        if (aiAvailable) {
          try {
            result = await classifyExercise(input);
          } catch {
            // Fall back to defaults for this exercise
            result = getLocalClassification(exercise.name, exercise.exercise_type);
          }
        } else {
          result = getLocalClassification(exercise.name, exercise.exercise_type);
        }

        // Save to database (including muscle_groups)
        const { error: updateError } = await supabase
          .from('exercises')
          .update({
            resistance_model: result.resistance_model,
            movement_family: result.movement_family,
            bodyweight_fraction: result.bodyweight_fraction,
            bodyweight_fraction_min: result.bodyweight_fraction_min,
            bodyweight_fraction_max: result.bodyweight_fraction_max,
            volume_mode: result.volume_mode,
            ai_confidence: result.confidence,
            ai_rationale: result.rationale,
            muscle_groups: result.muscle_groups,
            classification_status: 'completed',
            analyzed_at: new Date().toISOString(),
          })
          .eq('id', exercise.id);

        if (updateError) throw updateError;
      }),
    );

    // Tally results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        succeeded++;
      } else {
        failed++;
      }
    }

    onProgress?.({
      total,
      completed: succeeded + failed,
      failed,
      current: null,
    });

    // Delay between batches (skip after last batch)
    if (i + BATCH_SIZE < exercises.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return { total, succeeded, failed };
}

// =============================================================================
// Helpers
// =============================================================================

function getLocalClassification(name: string, exerciseType: string) {
  const nameDefault = getDefaultClassification(name);
  const fraction = nameDefault?.bodyweight_fraction ?? getDefaultFractionByType(exerciseType);

  return {
    resistance_model: nameDefault?.resistance_model ?? (fraction > 0 ? 'bodyweight' : 'external_load_only'),
    movement_family: nameDefault?.movement_family ?? 'other',
    bodyweight_fraction: fraction,
    bodyweight_fraction_min: Math.max(0, fraction - 0.05),
    bodyweight_fraction_max: Math.min(1, fraction + 0.05),
    volume_mode: nameDefault?.volume_mode ?? 'repetitions',
    muscle_groups: nameDefault?.muscle_groups ?? getMuscleGroupsByMovement(nameDefault?.movement_family ?? 'other'),
    confidence: 0.60,
    rationale: 'Estimated from exercise name and type (AI unavailable)',
  };
}

/**
 * Fallback muscle group assignment based on movement family when no name match exists.
 */
function getMuscleGroupsByMovement(movementFamily: string): string[] {
  switch (movementFamily) {
    case 'horizontal_push': return ['chest', 'triceps', 'front_delts'];
    case 'vertical_push': return ['front_delts', 'side_delts', 'triceps'];
    case 'horizontal_pull': return ['upper_back', 'lats', 'biceps', 'rear_delts'];
    case 'vertical_pull': return ['lats', 'biceps', 'forearms', 'upper_back'];
    case 'squat': return ['quads', 'glutes', 'hamstrings'];
    case 'hinge': return ['glutes', 'hamstrings', 'erector_spinae'];
    case 'lunge': return ['quads', 'glutes', 'hamstrings'];
    case 'core': return ['abs', 'obliques'];
    case 'isometric': return ['abs', 'transverse_abs'];
    default: return [];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
