/**
 * Exercise Classification Backfill
 *
 * Finds all exercises where classification_status is null or 'pending',
 * batches them (5 at a time with 1s delay between batches),
 * calls the classifier for each, and saves results.
 */

import { supabase } from '@/lib/supabase';
import { classifyExercise } from '@/lib/exercise-classifier';
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
 * Processes in batches of 5 with 1s delay between batches.
 *
 * @param onProgress - Optional callback for real-time progress updates
 * @returns Summary of results
 */
export async function backfillExerciseClassifications(
  onProgress?: ProgressCallback,
): Promise<{ total: number; succeeded: number; failed: number }> {
  // Fetch all unclassified exercises
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, exercise_type, muscle_groups, instructions')
    .or('classification_status.is.null,classification_status.eq.pending,classification_status.eq.failed');

  if (error) throw error;
  if (!exercises || exercises.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const total = exercises.length;
  let succeeded = 0;
  let failed = 0;

  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 1000;
  const MAX_RETRIES = 2;

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);

    // Process batch concurrently
    const results = await Promise.allSettled(
      batch.map(async (exercise) => {
        onProgress?.({
          total,
          completed: succeeded + failed,
          failed,
          current: exercise.name,
        });

        // Mark as classifying
        await supabase
          .from('exercises')
          .update({ classification_status: 'classifying' })
          .eq('id', exercise.id);

        const input: ExerciseInput = {
          name: exercise.name,
          exercise_type: exercise.exercise_type,
          muscle_groups: exercise.muscle_groups ?? [],
          instructions: exercise.instructions,
        };

        // Retry logic
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const result = await classifyExercise(input);

            // Save to database
            await supabase
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
                classification_status: 'completed',
                analyzed_at: new Date().toISOString(),
              })
              .eq('id', exercise.id);

            return;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            // Wait before retry
            if (attempt < MAX_RETRIES) {
              await delay(500 * (attempt + 1));
            }
          }
        }

        // All retries exhausted — mark as failed
        await supabase
          .from('exercises')
          .update({ classification_status: 'failed' })
          .eq('id', exercise.id);

        throw lastError;
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
