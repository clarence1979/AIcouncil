# Supabase Storage Setup for Talking Heads

This application requires a Supabase Storage bucket to store generated avatars, audio files, and videos.

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter the following details:
   - **Name**: `ai-council-assets`
   - **Public bucket**: Enable this option (required for easy access to media files)
   - Click **Create bucket**

5. The bucket will be used to store:
   - `councils/{conversation_id}/avatars/` - DALL-E generated avatar images
   - `councils/{conversation_id}/audio/` - OpenAI TTS generated audio files
   - `councils/{conversation_id}/videos/` - SadTalker generated talking head videos

## File Structure

```
ai-council-assets/
├── councils/
│   ├── {conversation-id-1}/
│   │   ├── avatars/
│   │   │   ├── Einstein-avatar.png
│   │   │   ├── Socrates-avatar.png
│   │   │   └── ...
│   │   ├── audio/
│   │   │   ├── Einstein-msg-123.mp3
│   │   │   ├── Socrates-msg-456.mp3
│   │   │   └── ...
│   │   └── videos/
│   │       ├── Einstein-msg-123.mp4
│   │       ├── Socrates-msg-456.mp4
│   │       └── ...
│   └── {conversation-id-2}/
│       └── ...
```

## Bucket Policies

The bucket should be public to allow easy access to generated media without authentication. This is safe because:
- File paths use UUIDs for conversation IDs (hard to guess)
- Only authenticated users can create new files
- Files are user-generated content (avatars, audio, video)

## Cleanup

Consider implementing a cleanup policy to delete old files after a certain period (e.g., 30 days) to manage storage costs.
