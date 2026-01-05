import { generateSpeech } from './text-to-speech';
import { generateTalkingHead, hasReplicateApiKey, promptForApiKey } from './sadtalker-service';
import { uploadAvatar, uploadAudio } from './storage-service';
import { supabase } from './supabase';

export interface TalkingHeadStatus {
  status: 'pending' | 'generating_audio' | 'uploading_assets' | 'generating_video' | 'completed' | 'failed';
  message: string;
  progress: number;
}

export type StatusCallback = (status: TalkingHeadStatus) => void;

export interface TalkingHeadResult {
  videoUrl: string;
  avatarUrl: string;
  audioUrl: string;
}

export async function createTalkingHeadForMessage(
  personaName: string,
  messageText: string,
  selectedAvatarUrl: string,
  conversationId: string,
  messageId: string,
  onStatusUpdate?: StatusCallback,
  characterVoice?: string
): Promise<TalkingHeadResult> {
  const updateStatus = (
    status: TalkingHeadStatus['status'],
    message: string,
    progress: number
  ) => {
    if (onStatusUpdate) {
      onStatusUpdate({ status, message, progress });
    }
  };

  try {
    if (!hasReplicateApiKey()) {
      const key = promptForApiKey();
      if (!key) {
        throw new Error('Replicate API key required for video generation');
      }
    }

    updateStatus('generating_audio', `Generating ${personaName}'s voice...`, 10);

    const audioBlob = await generateSpeech(messageText, personaName, {}, characterVoice);

    updateStatus('uploading_assets', `Uploading ${personaName}'s assets...`, 30);

    const [avatarUpload, audioUpload] = await Promise.all([
      uploadAvatar(selectedAvatarUrl, personaName, conversationId),
      uploadAudio(audioBlob, personaName, conversationId, messageId),
    ]);

    await supabase
      .from('messages')
      .update({
        avatar_url: avatarUpload.publicUrl,
        audio_url: audioUpload.publicUrl,
        video_status: 'generating',
      })
      .eq('id', messageId);

    updateStatus('generating_video', `Animating ${personaName} (15-20 seconds)...`, 50);

    const videoResult = await generateTalkingHead(
      avatarUpload.publicUrl,
      audioUpload.publicUrl
    );

    updateStatus('generating_video', 'Finalizing video...', 90);

    await supabase
      .from('messages')
      .update({
        video_url: videoResult.videoUrl,
        video_status: 'completed',
      })
      .eq('id', messageId);

    updateStatus('completed', `${personaName} is ready!`, 100);

    return {
      videoUrl: videoResult.videoUrl,
      avatarUrl: avatarUpload.publicUrl,
      audioUrl: audioUpload.publicUrl,
    };
  } catch (error) {
    console.error('Error creating talking head:', error);

    await supabase
      .from('messages')
      .update({
        video_status: 'failed',
      })
      .eq('id', messageId);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    updateStatus('failed', `Error: ${errorMessage}`, 0);

    throw error;
  }
}

export async function savePersonaAvatar(
  personaName: string,
  selectedAvatarUrl: string,
  allGeneratedUrls: string[],
  conversationId?: string
): Promise<void> {
  const { data: session } = await supabase.auth.getSession();

  if (!session?.session?.user) {
    console.warn('No authenticated user, skipping avatar save to database');
    return;
  }

  const { error } = await supabase.from('persona_avatars').upsert({
    user_id: session.session.user.id,
    conversation_id: conversationId || null,
    persona_name: personaName,
    selected_avatar_url: selectedAvatarUrl,
    avatar_options: allGeneratedUrls,
  });

  if (error) {
    console.error('Failed to save persona avatar:', error);
  }
}

export async function getCachedPersonaAvatar(
  personaName: string
): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();

  if (!session?.session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('persona_avatars')
    .select('selected_avatar_url')
    .eq('user_id', session.session.user.id)
    .eq('persona_name', personaName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.selected_avatar_url;
}
