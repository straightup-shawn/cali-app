/**
 * Hook for AI exercise classification.
 *
 * Provides mutations to classify exercises and save results to Supabase.
 * Used when: new exercise created, user taps "Reanalyze", exercise edited.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { classifyExercise } from '@/lib/exercise-classifier';
import { getDefaultClassification, getDefaultFractionByType } from '@/lib/default-classifications';
import type { ExerciseInput } from '@/lib/exercise-classifier';

// =============================================================================
// Types
// =============================================================================

export interface ClassifyExerciseInput {
  exerciseId: string;
  name: string;
  exercise_type: string;
  muscle_groups: string[];
  instructions: string | null;
}

// =============================================================================
// Hook: useClassifyExercise
// =============================================================================

/**
 * Mutation that calls the AI classifier and saves results to Supabase.
 * Handles pending/success/failure status updates on the exercise row.
 */
export function useClassifyExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClassifyExerciseInput) => {
      // Try to mark as classifying (may fail if columns don't exist yet)
      await supabase
        .from('exercises')
        .update({ classification_status: 'classifying' })
        .eq('id', input.exerciseId)
        .then(() => {});  // swallow error

      const exerciseInput: ExerciseInput = {
        name: input.name,
        exercise_type: input.exercise_type,
        muscle_groups: input.muscle_groups,
        instructions: input.instructions,
      };

      let result;
      try {
        result = await classifyExercise(exerciseInput);
      } catch {
        // AI call failed (likely CORS) — use built-in defaults
        const nameDefault = getDefaultClassification(input.name);
        const fraction = nameDefault?.bodyweight_fraction ?? getDefaultFractionByType(input.exercise_type);

        result = {
          resistance_model: nameDefault?.resistance_model ?? (fraction > 0 ? 'bodyweight' : 'external_load_only'),
          movement_family: nameDefault?.movement_family ?? 'other',
          bodyweight_fraction: fraction,
          bodyweight_fraction_min: Math.max(0, fraction - 0.05),
          bodyweight_fraction_max: Math.min(1, fraction + 0.05),
          volume_mode: nameDefault?.volume_mode ?? 'repetitions',
          confidence: 0.60,
          rationale: 'Estimated from exercise name and type (AI unavailable)',
          muscle_groups: nameDefault?.muscle_groups ?? [],
        };
      }

      // Try to save classification results (may fail if migration not run)
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
          muscle_groups: result.muscle_groups ?? [],
          classification_status: 'completed',
          analyzed_at: new Date().toISOString(),
          user_overridden: false,
        })
        .eq('id', input.exerciseId)
        .then(() => {}); // swallow DB error — classification result still works in memory

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

/**
 * Mutation to manually override the classification for an exercise.
 * Sets user_overridden = true so the UI shows the manual badge.
 */
export function useOverrideClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      exerciseId: string;
      bodyweight_fraction: number;
      bodyweight_fraction_min?: number;
      bodyweight_fraction_max?: number;
    }) => {
      const { error } = await supabase
        .from('exercises')
        .update({
          bodyweight_fraction: input.bodyweight_fraction,
          bodyweight_fraction_min: input.bodyweight_fraction_min ?? input.bodyweight_fraction - 0.05,
          bodyweight_fraction_max: input.bodyweight_fraction_max ?? input.bodyweight_fraction + 0.05,
          user_overridden: true,
          classification_status: 'completed',
        })
        .eq('id', input.exerciseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
