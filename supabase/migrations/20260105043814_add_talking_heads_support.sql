/*
  # Add Talking Heads Video Support

  ## Overview
  This migration adds support for realistic talking head videos using SadTalker.
  It extends the existing schema to store avatar images, audio files, and generated videos.

  ## Changes

  ### 1. Extend `messages` table
  Add new columns to store media assets:
  - `avatar_url` (text) - URL to selected DALL-E generated avatar image
  - `audio_url` (text) - URL to OpenAI TTS generated audio file
  - `video_url` (text) - URL to SadTalker generated talking head video
  - `video_status` (text) - Video generation status: pending, generating, completed, failed

  ### 2. Create `persona_avatars` table
  Stores user's avatar selections for each persona:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `conversation_id` (uuid, nullable) - Reference to conversations (null for reusable avatars)
  - `persona_name` (text) - Name of the persona (Einstein, Socrates, etc.)
  - `selected_avatar_url` (text) - URL of the selected avatar
  - `avatar_options` (jsonb) - Array of all 3 generated avatar URLs
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on persona_avatars table
  - Users can only access their own avatar selections
  - All policies check authentication and ownership

  ## Notes
  - Supabase Storage bucket 'ai-council-assets' must be created manually
  - Bucket should be set to public for easy access to generated media
  - File structure: councils/{conversation_id}/avatars/ and /audio/ and /videos/
*/

-- Add media columns to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN audio_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'video_status'
  ) THEN
    ALTER TABLE messages ADD COLUMN video_status text DEFAULT 'pending' 
      CHECK (video_status IN ('pending', 'generating', 'completed', 'failed'));
  END IF;
END $$;

-- Create persona_avatars table
CREATE TABLE IF NOT EXISTS persona_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  persona_name text NOT NULL,
  selected_avatar_url text NOT NULL,
  avatar_options jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_persona_avatars_user_id ON persona_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_avatars_conversation_id ON persona_avatars(conversation_id);
CREATE INDEX IF NOT EXISTS idx_persona_avatars_persona_name ON persona_avatars(persona_name);
CREATE INDEX IF NOT EXISTS idx_messages_video_status ON messages(video_status);

-- Enable Row Level Security
ALTER TABLE persona_avatars ENABLE ROW LEVEL SECURITY;

-- RLS Policies for persona_avatars
CREATE POLICY "Users can view own persona avatars"
  ON persona_avatars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own persona avatars"
  ON persona_avatars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own persona avatars"
  ON persona_avatars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own persona avatars"
  ON persona_avatars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);