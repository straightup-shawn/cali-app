/**
 * Hook for AI exercise classification.
 *
 * Provides mutations to classify exercises and save results to Supabase.
 * Used when: new exercise created, user taps "Reanalyze", exercise edited.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { classifyExercise } from '@/lib/exercise-classifier';
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
      // Mark as classifying
      await supabase
        .from('exercises')
        .update({ classification_status: 'classifying' })
        .eq('id', input.exerciseId);

      try {
        const exerciseInput: ExerciseInput = {
          name: input.name,
          exercise_type: input.exercise_type,
          muscle_groups: input.muscle_groups,
          instructions: input.instructions,
        };

        const result = await classifyExercise(exerciseInput);

        // Save classification results
        const { error } = await supabase
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
            user_overridden: false,
          })
          .eq('id', input.exerciseId);

        if (error) throw error;

        return result;
      } catch (err) {
        // Mark as failed
        await supabase
          .from('exercises')
          .update({ classification_status: 'failed' })
          .eq('id', input.exerciseId);
        throw err;
      }
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
