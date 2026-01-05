const SADTALKER_MODEL_VERSION = '3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376';
const REPLICATE_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/replicate-proxy`;

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

async function callReplicateProxy(action: 'create' | 'get', apiKey: string, data?: any, predictionId?: string) {
  const response = await fetch(REPLICATE_PROXY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, apiKey, data, predictionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Replicate proxy request failed');
  }

  return response.json();
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

  let prediction = await callReplicateProxy('create', apiKey, {
    version: SADTALKER_MODEL_VERSION,
    input: {
      source_image: imageUrl,
      driven_audio: audioUrl,
      still: options.still !== false,
      preprocess: options.preprocess || 'crop',
      enhancer: options.enhancer || 'gfpgan',
      face_model_resolution: options.faceModelResolution || '256',
    },
  });

  let attempts = 0;
  const maxAttempts = 120;

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    attempts < maxAttempts
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    prediction = await callReplicateProxy('get', apiKey, undefined, prediction.id);
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
