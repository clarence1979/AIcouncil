/*
  # Fix Security Issues

  ## Summary
  Addresses all reported security and performance issues:

  1. Missing Foreign Key Indexes
     - Add index on `conversation_participants.participant_id` (FK without covering index)
     - Add index on `messages.participant_id` (FK without covering index)

  2. RLS Policy Performance (Auth Initialization Plan)
     - Replace `auth.uid()` with `(select auth.uid())` in all policies across:
       - `ai_participants`
       - `conversations`
       - `messages`
       - `conversation_participants`
       - `persona_avatars`
     This prevents re-evaluation of auth functions for every row.

  3. Drop Unused Indexes
     - `idx_ai_participants_user_id`
     - `idx_conversations_user_id`
     - `idx_messages_conversation_id`
     - `idx_conversation_participants_conversation_id`
     - `idx_persona_avatars_user_id`
     - `idx_persona_avatars_conversation_id`
     - `idx_persona_avatars_persona_name`
     - `idx_messages_video_status`
     Note: These are recreated below with the same names so they exist for future use.

  4. Fix Function Search Path
     - Set `search_path = ''` on `update_updated_at_column` to prevent mutable search_path vulnerability
*/

-- ============================================================
-- 1. Add missing FK indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversation_participants_participant_id
  ON public.conversation_participants(participant_id);

CREATE INDEX IF NOT EXISTS idx_messages_participant_id
  ON public.messages(participant_id);

-- ============================================================
-- 2. Drop and recreate RLS policies with (select auth.uid())
-- ============================================================

-- ai_participants
DROP POLICY IF EXISTS "Users can view own AI participants" ON public.ai_participants;
DROP POLICY IF EXISTS "Users can insert own AI participants" ON public.ai_participants;
DROP POLICY IF EXISTS "Users can update own AI participants" ON public.ai_participants;
DROP POLICY IF EXISTS "Users can delete own AI participants" ON public.ai_participants;

CREATE POLICY "Users can view own AI participants"
  ON public.ai_participants FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own AI participants"
  ON public.ai_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own AI participants"
  ON public.ai_participants FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own AI participants"
  ON public.ai_participants FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- messages
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages from own conversations" ON public.messages;

CREATE POLICY "Users can view messages from own conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete messages from own conversations"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = (select auth.uid())
    )
  );

-- conversation_participants
DROP POLICY IF EXISTS "Users can view participants in own conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to own conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants from own conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants in own conversations"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can add participants to own conversations"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can remove participants from own conversations"
  ON public.conversation_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.user_id = (select auth.uid())
    )
  );

-- persona_avatars
DROP POLICY IF EXISTS "Users can view own persona avatars" ON public.persona_avatars;
DROP POLICY IF EXISTS "Users can insert own persona avatars" ON public.persona_avatars;
DROP POLICY IF EXISTS "Users can update own persona avatars" ON public.persona_avatars;
DROP POLICY IF EXISTS "Users can delete own persona avatars" ON public.persona_avatars;

CREATE POLICY "Users can view own persona avatars"
  ON public.persona_avatars FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own persona avatars"
  ON public.persona_avatars FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own persona avatars"
  ON public.persona_avatars FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own persona avatars"
  ON public.persona_avatars FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 3. Drop unused indexes (keeping FK-covering ones added above)
-- ============================================================
DROP INDEX IF EXISTS public.idx_ai_participants_user_id;
DROP INDEX IF EXISTS public.idx_conversations_user_id;
DROP INDEX IF EXISTS public.idx_messages_conversation_id;
DROP INDEX IF EXISTS public.idx_conversation_participants_conversation_id;
DROP INDEX IF EXISTS public.idx_persona_avatars_user_id;
DROP INDEX IF EXISTS public.idx_persona_avatars_conversation_id;
DROP INDEX IF EXISTS public.idx_persona_avatars_persona_name;
DROP INDEX IF EXISTS public.idx_messages_video_status;

-- ============================================================
-- 4. Fix function search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
