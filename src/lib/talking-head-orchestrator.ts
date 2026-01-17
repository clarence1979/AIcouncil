import { generateSpeech } from './text-to-speech';
import { generateTalkingHead, hasReplicateApiKey, promptForApiKey } from './sadtalker-service';
import { uploadAvatar, uploadAudio, uploadVideo } from './storage-service';

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
    // Check for Replicate API key (used for video generation)
    if (!hasReplicateApiKey()) {
      const key = promptForApiKey();
      if (!key) {
        throw new Error('Replicate API key required for video generation');
      }
    }

    // Check for OpenAI API key (used for audio generation)
    const participants = JSON.parse(localStorage.getItem('ai-participants') || '[]');
    const openaiParticipant = participants.find((p: any) => p.provider === 'openai');
    const hasOpenAIKey = openaiParticipant?.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

    if (!hasOpenAIKey) {
      throw new Error('OpenAI API key required for voice generation. Please configure an OpenAI participant first to enable talking head audio.');
    }

    updateStatus('generating_audio', `Generating ${personaName}'s voice...`, 10);

    // Generate audio using OpenAI TTS
    const audioBlob = await generateSpeech(messageText, personaName, {}, characterVoice);

    updateStatus('uploading_assets', `Uploading ${personaName}'s assets...`, 30);

    const [avatarUpload, audioUpload] = await Promise.all([
      uploadAvatar(selectedAvatarUrl, personaName, conversationId),
      uploadAudio(audioBlob, personaName, conversationId, messageId),
    ]);

    updateStatus('generating_video', `Animating ${personaName} (15-20 seconds)...`, 50);

    const videoResult = await generateTalkingHead(
      avatarUpload.publicUrl,
      audioUpload.publicUrl
    );

    updateStatus('generating_video', 'Uploading video...', 90);

    const videoUpload = await uploadVideo(
      videoResult.videoUrl,
      personaName,
      conversationId,
      messageId
    );

    updateStatus('completed', `${personaName} is ready!`, 100);

    return {
      videoUrl: videoUpload.publicUrl,
      avatarUrl: avatarUpload.publicUrl,
      audioUrl: audioUpload.publicUrl,
    };
  } catch (error) {
    console.error('Error creating talking head:', error);

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
  const avatarCache = JSON.parse(localStorage.getItem('persona-avatars') || '{}');
  avatarCache[personaName] = {
    selectedAvatarUrl,
    allGeneratedUrls,
    conversationId,
  };
  localStorage.setItem('persona-avatars', JSON.stringify(avatarCache));
}

export async function getCachedPersonaAvatar(
  personaName: string
): Promise<string | null> {
  const avatarCache = JSON.parse(localStorage.getItem('persona-avatars') || '{}');
  return avatarCache[personaName]?.selectedAvatarUrl || null;
}
