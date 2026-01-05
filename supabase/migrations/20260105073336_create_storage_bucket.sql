/*
  # Create Storage Bucket for AI Council Assets

  1. Storage Setup
    - Creates public bucket `ai-council-assets` for storing:
      - DALL-E generated avatar images
      - OpenAI TTS audio files
      - SadTalker talking head videos
  
  2. Security
    - Public bucket for easy media access
    - Authenticated users can upload files
    - Anyone can read files (required for video playback)
  
  3. File Structure
    - councils/{conversation_id}/avatars/ - Avatar images
    - councils/{conversation_id}/audio/ - Audio files
    - councils/{conversation_id}/videos/ - Video files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-council-assets',
  'ai-council-assets',
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'audio/mpeg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-council-assets');

-- Allow everyone to read files (required for video playback)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ai-council-assets');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ai-council-assets' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'ai-council-assets');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ai-council-assets' AND auth.uid()::text = owner::text);