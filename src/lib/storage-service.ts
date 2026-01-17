export interface UploadResult {
  publicUrl: string;
  path: string;
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadResourceViaProxy(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return url;
  }

  const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-proxy`;
  const participants = JSON.parse(localStorage.getItem('ai-participants') || '[]');
  const openaiParticipant = participants.find((p: any) => p.provider === 'openai');
  const apiKey = openaiParticipant?.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key required for resource downloads');
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'download',
      apiKey,
      data: { url },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to download resource via proxy: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function uploadAvatar(
  imageUrl: string,
  personaName: string,
  conversationId: string
): Promise<UploadResult> {
  const dataUrl = await downloadResourceViaProxy(imageUrl);
  const sanitizedPersonaName = personaName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `councils/${conversationId}/avatars/${sanitizedPersonaName}-avatar.png`;

  return {
    publicUrl: dataUrl,
    path: filename,
  };
}

export async function uploadAudio(
  audioBlob: Blob,
  personaName: string,
  conversationId: string,
  messageId: string
): Promise<UploadResult> {
  const dataUrl = await blobToDataURL(audioBlob);
  const sanitizedPersonaName = personaName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `councils/${conversationId}/audio/${sanitizedPersonaName}-${messageId}.wav`;

  return {
    publicUrl: dataUrl,
    path: filename,
  };
}

export async function uploadVideo(
  videoUrl: string,
  personaName: string,
  conversationId: string,
  messageId: string
): Promise<UploadResult> {
  const dataUrl = await downloadResourceViaProxy(videoUrl);
  const sanitizedPersonaName = personaName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `councils/${conversationId}/videos/${sanitizedPersonaName}-${messageId}.mp4`;

  return {
    publicUrl: dataUrl,
    path: filename,
  };
}

export async function ensureBucketExists(): Promise<boolean> {
  return true;
}
