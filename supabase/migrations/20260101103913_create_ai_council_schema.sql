/*
  # AI Council Database Schema

  ## Overview
  This migration creates the database structure for the AI Council multi-AI conversation platform.

  ## New Tables
  
  ### 1. `ai_participants`
  Stores user-configured AI providers and their settings
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `provider` (text) - AI provider (openai, anthropic, google, etc.)
  - `model` (text) - Specific model name
  - `custom_name` (text) - User-defined name for this AI
  - `default_name` (text) - Default provider name
  - `color` (text) - UI color for this participant
  - `api_key_hash` (text) - Hashed API key (never store plaintext)
  - `voice_name` (text) - Selected voice for TTS
  - `config` (jsonb) - Additional configuration (temperature, tokens, etc.)
  - `is_active` (boolean) - Whether this AI is currently active
  - `message_count` (integer) - Total messages from this AI
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `conversations`
  Stores conversation topics and metadata
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `topic` (text) - Initial conversation topic
  - `turn_mode` (text) - Turn-taking mode (sequential, random, contextual, manual)
  - `conversation_style` (text) - Style (debate, brainstorm, consensus, etc.)
  - `max_turns` (integer) - Maximum turns (0 = unlimited)
  - `current_turn` (integer) - Current turn number
  - `is_active` (boolean) - Whether conversation is ongoing
  - `started_at` (timestamptz) - Start timestamp
  - `ended_at` (timestamptz) - End timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `messages`
  Stores individual messages in conversations
  - `id` (uuid, primary key) - Unique identifier
  - `conversation_id` (uuid) - Reference to conversations
  - `participant_id` (uuid, nullable) - Reference to ai_participants (null for user)
  - `sender_type` (text) - 'user' or 'ai'
  - `content` (text) - Message content
  - `turn_number` (integer) - Turn number in conversation
  - `created_at` (timestamptz) - Message timestamp

  ### 4. `conversation_participants`
  Junction table linking conversations to AI participants
  - `id` (uuid, primary key) - Unique identifier
  - `conversation_id` (uuid) - Reference to conversations
  - `participant_id` (uuid) - Reference to ai_participants
  - `join_order` (integer) - Order in which participant joined
  - `created_at` (timestamptz) - Join timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - All policies check authentication and ownership
*/

-- Create ai_participants table
CREATE TABLE IF NOT EXISTS ai_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  custom_name text,
  default_name text NOT NULL,
  color text NOT NULL,
  api_key_hash text NOT NULL,
  voice_name text DEFAULT 'default',
  config jsonb DEFAULT '{"temperature": 0.7, "maxTokens": 500}'::jsonb,
  is_active boolean DEFAULT true,
  message_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  turn_mode text DEFAULT 'sequential',
  conversation_style text DEFAULT 'discussion',
  max_turns integer DEFAULT 0,
  current_turn integer DEFAULT 0,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES ai_participants(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'ai')),
  content text NOT NULL,
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create conversation_participants junction table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES ai_participants(id) ON DELETE CASCADE NOT NULL,
  join_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, participant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_participants_user_id ON ai_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to ai_participants
DROP TRIGGER IF EXISTS update_ai_participants_updated_at ON ai_participants;
CREATE TRIGGER update_ai_participants_updated_at
  BEFORE UPDATE ON ai_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE ai_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_participants
CREATE POLICY "Users can view own AI participants"
  ON ai_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI participants"
  ON ai_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI participants"
  ON ai_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI participants"
  ON ai_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages from own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from own conversations"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants in own conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to own conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove participants from own conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );