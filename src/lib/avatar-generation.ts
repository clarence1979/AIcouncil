import { getPersonaConfig } from './persona-config';

export interface AvatarGenerationResult {
  urls: string[];
  personaName: string;
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

  throw new Error('OpenAI API key not found. Please configure an OpenAI participant first.');
}

export async function generateAvatarOptions(
  personaName: string,
  optionsCount: number = 3
): Promise<AvatarGenerationResult> {
  const apiKey = await getOpenAIKey();
  const config = getPersonaConfig(personaName);
  const urls: string[] = [];

  for (let i = 0; i < optionsCount; i++) {
    const variationPrompt = `${config.imagePrompt}. Variation ${i + 1}, unique appearance and styling.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: variationPrompt,
        size: '1024x1024',
        quality: 'hd',
        n: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DALL-E generation failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    urls.push(data.data[0].url);
  }

  return {
    urls,
    personaName,
  };
}

export async function generateSingleAvatar(personaName: string): Promise<string> {
  const result = await generateAvatarOptions(personaName, 1);
  return result.urls[0];
}
