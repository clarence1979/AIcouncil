/*
  # Add Personality and Avatar to AI Participants

  ## Changes
  Adds personality customization and avatar selection to AI participants.

  ### New Columns
  - `personality` (text) - AI personality type (analytical, creative, sarcastic, enthusiastic, skeptical, philosophical, pragmatic, witty)
  - `avatar` (text) - Emoji avatar for visual representation
  
  ## Notes
  - Default personality is 'analytical'
  - Default avatar is '🤖'
  - Uses IF NOT EXISTS checks for safety
*/

-- Add personality column to ai_participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'personality'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN personality text DEFAULT 'analytical';
  END IF;
END $$;

-- Add avatar column to ai_participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_participants' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE ai_participants ADD COLUMN avatar text DEFAULT '🤖';
  END IF;
END $$;
