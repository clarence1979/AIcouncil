const SADTALKER_MODEL_VERSION = '3aa3dac9353cc4d6bd62a35e0f07e9e57f52422c';
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

export interface SadTalkerOptions {
  still?: boolean;
  preprocess?: 'crop' | 'resize' | 'full';
  enhancer?: 'gfpgan' | 'RestoreFormer';
  faceModelResolution?: '256' | '512';
}

export interface SadTalkerResult {
  videoUrl: string;
  predictionId: string;
}

function getReplicateApiKey(): string {
  const key = localStorage.getItem('replicate_api_key') || import.meta.env.VITE_REPLICATE_API_KEY;

  if (!key) {
    throw new Error(
      'Replicate API key not found. Please add your key at https://replicate.com/account/api-tokens'
    );
  }

  return key;
}

export function setReplicateApiKey(key: string): void {
  localStorage.setItem('replicate_api_key', key);
}

export function hasReplicateApiKey(): boolean {
  const key = localStorage.getItem('replicate_api_key') || import.meta.env.VITE_REPLICATE_API_KEY;
  return !!key;
}

export async function generateTalkingHead(
  imageUrl: string,
  audioUrl: string,
  options: SadTalkerOptions = {}
): Promise<SadTalkerResult> {
  const apiKey = getReplicateApiKey();

  const startResponse = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=10',
    },
    body: JSON.stringify({
      version: SADTALKER_MODEL_VERSION,
      input: {
        source_image: imageUrl,
        driven_audio: audioUrl,
        still: options.still !== false,
        preprocess: options.preprocess || 'crop',
        enhancer: options.enhancer || 'gfpgan',
        face_model_resolution: options.faceModelResolution || '256',
      },
    }),
  });

  if (!startResponse.ok) {
    const error = await startResponse.json();
    throw new Error(`SadTalker generation failed: ${error.detail || 'Unknown error'}`);
  }

  let prediction = await startResponse.json();
  let attempts = 0;
  const maxAttempts = 120;

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    attempts < maxAttempts
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const checkResponse = await fetch(`${REPLICATE_API_URL}/${prediction.id}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!checkResponse.ok) {
      throw new Error('Failed to check prediction status');
    }

    prediction = await checkResponse.json();
    attempts++;
  }

  if (prediction.status === 'failed') {
    throw new Error(prediction.error || 'Video generation failed');
  }

  if (prediction.status !== 'succeeded') {
    throw new Error('Video generation timed out after 2 minutes');
  }

  if (!prediction.output) {
    throw new Error('No video output received from SadTalker');
  }

  return {
    videoUrl: prediction.output,
    predictionId: prediction.id,
  };
}

export function promptForApiKey(): string | null {
  const key = prompt(
    'Please enter your Replicate API key to generate talking head videos.\n\n' +
    'Get your key at: https://replicate.com/account/api-tokens\n\n' +
    'The key will be saved securely in your browser.'
  );

  if (key && key.trim()) {
    setReplicateApiKey(key.trim());
    return key.trim();
  }

  return null;
}
