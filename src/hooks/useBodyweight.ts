import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

type BodyweightEntryRow = Database['public']['Tables']['bodyweight_entries']['Row'];

export interface LogBodyweightInput {
  weight_kg: number;
  entry_date?: string;
}

export interface UpdateBodyweightInput {
  id: string;
  weight_kg?: number;
  entry_date?: string;
}

/**
 * Fetches all bodyweight entries for the current user, ordered by entry_date descending.
 * The first element in the returned array is the most recent entry.
 */
export function useBodyweightEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bodyweight'],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      const { data, error } = await supabase
        .from('bodyweight_entries')
        .select('*')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data as BodyweightEntryRow[];
    },
    enabled: !!user,
  });
}

/**
 * Mutation to insert a new bodyweight entry.
 * Accepts weight_kg and optional entry_date (defaults to today via DB).
 * Invalidates the ['bodyweight'] query key on success.
 */
export function useLogBodyweight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogBodyweightInput) => {
      if (!user) throw new Error('No authenticated user');
      const { data, error } = await supabase
        .from('bodyweight_entries')
        .insert({
          user_id: user.id,
          weight_kg: input.weight_kg,
          ...(input.entry_date && { entry_date: input.entry_date }),
        })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('A bodyweight entry already exists for this date');
        }
        throw error;
      }
      return data as BodyweightEntryRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyweight'] });
    },
  });
}

/**
 * Mutation to update an existing bodyweight entry.
 * Accepts the entry ID and fields to update (weight_kg, entry_date).
 * Invalidates the ['bodyweight'] query key on success.
 */
export function useUpdateBodyweight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBodyweightInput) => {
      if (!user) throw new Error('No authenticated user');
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('bodyweight_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('A bodyweight entry already exists for this date');
        }
        throw error;
      }
      return data as BodyweightEntryRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyweight'] });
    },
  });
}

/**
 * Mutation to delete a bodyweight entry by ID.
 * Invalidates the ['bodyweight'] query key on success.
 */
export function useDeleteBodyweight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No authenticated user');
      const { error } = await supabase
        .from('bodyweight_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyweight'] });
    },
  });
}
