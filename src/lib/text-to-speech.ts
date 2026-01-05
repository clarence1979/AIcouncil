import { getPersonaConfig } from './persona-config';

export interface TTSOptions {
  voice?: string;
  speed?: number;
}

async function getOpenAIKey(): Promise<string> {
  const participants = JSON.parse(localStorage.getItem('aiParticipants') || '[]');
  const openaiParticipant = participants.find((p: any) => p.provider === 'openai');

  if (openaiParticipant?.apiKey) {
    return openaiParticipant.apiKey;
  }

  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envKey) {
    return envKey;
  }

  throw new Error('OpenAI API key not found. Please configure an OpenAI participant first.');
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/openai-tts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
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
    throw new Error('Text-to-speech generation failed');
  }

  return await response.blob();
}
