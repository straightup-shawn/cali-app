import { supabase } from '@/lib/supabase';

const BUCKET = 'workout-photos';

/**
 * Uploads a workout photo to Supabase Storage.
 * Returns the public URL of the uploaded file with a cache-busting parameter.
 */
export async function uploadWorkoutPhoto(
  workoutId: string,
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  // Use timestamp in filename to avoid cache issues when replacing
  const timestamp = Date.now();
  const path = `${userId}/${workoutId}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '0',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a profile photo (avatar) to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '0',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
