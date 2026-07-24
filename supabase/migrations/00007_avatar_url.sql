-- Add avatar_url to profiles table for persistent profile picture storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
