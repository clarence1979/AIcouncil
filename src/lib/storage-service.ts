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

export async function uploadAvatar(
  imageUrl: string,
  personaName: string,
  conversationId: string
): Promise<UploadResult> {
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();

  const dataUrl = await blobToDataURL(imageBlob);
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
  const videoResponse = await fetch(videoUrl);
  const videoBlob = await videoResponse.blob();

  const dataUrl = await blobToDataURL(videoBlob);
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
