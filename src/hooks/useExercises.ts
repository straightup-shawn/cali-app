import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

export interface ExerciseFilters {
  type?: string;
  muscleGroup?: string;
  search?: string;
}

export interface CreateExerciseInput {
  name: string;
  exercise_type: string;
  muscle_groups?: string[];
  instructions?: string | null;
  progresses_to?: string | null;
}

/**
 * Fetches exercises with optional filtering by type, muscle group, and search term.
 * Returns both system exercises and user-created exercises (enforced by RLS).
 */
export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: ['exercises', filters],
    queryFn: async () => {
      let query = supabase.from('exercises').select('*');
      if (filters?.type) query = query.eq('exercise_type', filters.type);
      if (filters?.muscleGroup) query = query.contains('muscle_groups', [filters.muscleGroup]);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as ExerciseRow[];
    },
  });
}

/**
 * Fetches a single exercise by ID along with its progression chain info:
 * - The exercise it progresses to (if any)
 * - Exercises that progress TO this exercise (prerequisites)
 */
export function useExercise(id: string | undefined) {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: async () => {
      if (!id) throw new Error('Exercise ID is required');

      // Fetch the exercise itself
      const { data: exercise, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      // Fetch the exercise it progresses to
      let progressesTo: ExerciseRow | null = null;
      if (exercise.progresses_to) {
        const { data, error: progressError } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', exercise.progresses_to)
          .single();
        if (!progressError) progressesTo = data;
      }

      // Fetch exercises that progress TO this exercise (prerequisites)
      const { data: prerequisiteExercises, error: prereqError } = await supabase
        .from('exercises')
        .select('*')
        .eq('progresses_to', id);
      if (prereqError) throw prereqError;

      return {
        ...exercise,
        progressesToExercise: progressesTo,
        prerequisiteExercises: prerequisiteExercises as ExerciseRow[],
      };
    },
    enabled: !!id,
  });
}

/**
 * Updates an existing custom exercise by ID.
 * Invalidates the exercises query cache on success.
 */
export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      exercise_type?: string;
      muscle_groups?: string[];
      instructions?: string | null;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

/**
 * Deletes an exercise by ID.
 * Invalidates the exercises query cache on success.
 */
export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

/**
 * Creates a new custom exercise. Validates name uniqueness via Supabase constraint.
 * Invalidates the exercises query cache on success.
 */
export function useCreateExercise() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      if (!user) throw new Error('No authenticated user');
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          ...input,
          user_id: user.id,
          is_system: false,
        })
        .select()
        .single();
      if (error) {
        // Surface uniqueness constraint violation as a friendly message
        if (error.code === '23505') {
          throw new Error(`An exercise named "${input.name}" already exists`);
        }
        throw error;
      }
      return data as ExerciseRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
