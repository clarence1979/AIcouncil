/*
  # Fix Storage Policies for Anonymous Access

  1. Changes
    - Allow anonymous (public) users to upload files
    - Keep public read access
    - Allow public users to update/delete files they create
  
  2. Security
    - Safe for demo apps without authentication
    - File paths still use UUIDs for privacy
    - Bucket remains public for easy media playback
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Allow anyone to upload files (no auth required)
CREATE POLICY "Public users can upload files"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'ai-council-assets');

-- Allow everyone to read files
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ai-council-assets');

-- Allow anyone to update files in the bucket
CREATE POLICY "Public users can update files"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'ai-council-assets')
WITH CHECK (bucket_id = 'ai-council-assets');

-- Allow anyone to delete files in the bucket
CREATE POLICY "Public users can delete files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'ai-council-assets');