/*
  # Add Full Character Persona Support

  1. Changes
    - Add persona_name column (text) - The name of the character persona (e.g., "Albert Einstein")
    - Add persona_description column (text) - Brief description of the character
    - Add persona_traits column (text array) - Key personality traits
    - Add personality_avatar_url column (text) - URL to character portrait image
    - Add persona_is_custom column (boolean) - Whether the persona was custom or auto-researched
  
  2. Notes
    - These fields are optional and only populated when a character persona is assigned
    - When populated, these override the basic personality/avatar fields
    - Existing rows will have NULL values for these fields by default
*/

-- Add persona name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'persona_name'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN persona_name text;
  END IF;
END $$;

-- Add persona description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'persona_description'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN persona_description text;
  END IF;
END $$;

-- Add persona traits column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'persona_traits'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN persona_traits text[];
  END IF;
END $$;

-- Add personality avatar URL column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'personality_avatar_url'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN personality_avatar_url text;
  END IF;
END $$;

-- Add persona is custom flag column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'persona_is_custom'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN persona_is_custom boolean DEFAULT false;
  END IF;
END $$;