import { supabase } from '@/lib/supabase';

const BUCKET = 'workout-photos';

/**
 * Uploads a workout photo to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadWorkoutPhoto(
  workoutId: string,
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${workoutId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
