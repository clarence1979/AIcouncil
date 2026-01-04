/*
  # Add Character Persona Fields

  1. Changes
    - Add character persona fields to ai_participants table
    - Add speaking_style column (text)
    - Add catchphrases column (text array)
    - Add mannerisms column (text array)
  
  2. Notes
    - These fields are optional and only populated when a character persona is assigned
    - Existing rows will have NULL values for these fields by default
*/

-- Add new columns for enhanced character persona support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'speaking_style'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN speaking_style text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'catchphrases'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN catchphrases text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'mannerisms'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN mannerisms text[];
  END IF;
END $$;