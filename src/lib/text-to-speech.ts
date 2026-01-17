import { getPersonaConfig } from './persona-config';

export interface TTSOptions {
  voice?: string;
  speed?: number;
}

async function getOpenAIKey(): Promise<string> {
  const participants = JSON.parse(localStorage.getItem('ai-participants') || '[]');
  const openaiParticipant = participants.find((p: any) => p.provider === 'openai');

  if (openaiParticipant?.apiKey) {
    return openaiParticipant.apiKey;
  }

  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envKey) {
    return envKey;
  }

  throw new Error('OpenAI API key required for voice generation. Please configure an OpenAI participant to enable talking head audio.');
}

export async function generateSpeech(
  text: string,
  personaName: string,
  options: TTSOptions = {},
  characterVoice?: string
): Promise<Blob> {
  const apiKey = await getOpenAIKey();
  const config = getPersonaConfig(personaName);
  const voice = characterVoice || options.voice || config.voiceId;
  const speed = options.speed || 1.0;
  const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-tts`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice,
      speed,
      apiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Text-to-speech generation failed: ${error}`);
  }

  return await response.blob();
}
