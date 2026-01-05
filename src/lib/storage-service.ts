import { supabase } from './supabase';

const BUCKET_NAME = 'ai-council-assets';

export interface UploadResult {
  publicUrl: string;
  path: string;
}

export async function uploadAvatar(
  imageUrl: string,
  personaName: string,
  conversationId: string
): Promise<UploadResult> {
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();

  const sanitizedPersonaName = personaName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `councils/${conversationId}/avatars/${sanitizedPersonaName}-avatar.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, imageBlob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return {
    publicUrl,
    path: filename,
  };
}

export async function uploadAudio(
  audioBlob: Blob,
  personaName: string,
  conversationId: string,
  messageId: string
): Promise<UploadResult> {
  const sanitizedPersonaName = personaName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `councils/${conversationId}/audio/${sanitizedPersonaName}-${messageId}.mp3`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, audioBlob, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return {
    publicUrl,
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

  const sanitizedPersonaName = personaName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `councils/${conversationId}/videos/${sanitizedPersonaName}-${messageId}.mp4`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, videoBlob, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return {
    publicUrl,
    path: filename,
  };
}

export async function ensureBucketExists(): Promise<boolean> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    return buckets?.some(b => b.name === BUCKET_NAME) || false;
  } catch (error) {
    console.error('Error checking bucket existence:', error);
    return false;
  }
}
