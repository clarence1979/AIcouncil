# Talking Heads Feature - Quick Start

## What's New

Your AI Council app now supports **realistic talking head videos** using state-of-the-art AI:

- 🎨 **DALL-E 3 Avatars**: Photorealistic portraits for each persona
- 🗣️ **OpenAI TTS**: Natural-sounding voices matched to each character
- 🎬 **SadTalker Animation**: Lip-synced talking head videos
- 💾 **Supabase Storage**: All media assets stored securely

## Quick Setup (5 minutes)

### 1. Create Storage Bucket

```bash
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
# Click "Create Bucket"
# Name: ai-council-assets
# Public: YES (enable)
```

### 2. Add Replicate API Key

```bash
# Get your key: https://replicate.com/account/api-tokens
# Add to .env file:
echo "VITE_REPLICATE_API_KEY=r8_your_key_here" >> .env
```

Alternatively, the app will prompt you for the key when needed.

### 3. That's it!

The app is ready. Your existing OpenAI API key will be used for DALL-E and TTS.

## How It Works

### Avatar Selection Flow

When starting a conversation with personas:

1. App generates 3 portrait options for each persona (DALL-E 3)
2. You choose your favorite for each
3. Selected avatars are saved for future use

### During Conversations

When an AI persona responds:

1. **Immediate**: Text + static avatar appear
2. **~5 seconds**: Voice audio is generated
3. **~15 seconds**: Talking head video is ready
4. **Result**: Animated persona speaking their response

### Fallback Modes

The system gracefully degrades if anything fails:

```
Best  → Talking head video (avatar + lip-sync)
Good  → Static avatar + audio playback
Okay  → Static avatar + text
Basic → Text only (original behavior)
```

## Example Usage

```typescript
// 1. Setup avatars before conversation
import { AvatarSelectionModal } from './components/AvatarSelectionModal';

<AvatarSelectionModal
  personaName="Albert Einstein"
  onSelect={(url, allUrls) => {
    console.log('Selected avatar:', url);
  }}
  onCancel={() => setShowModal(false)}
/>

// 2. Generate talking head for AI response
import { createTalkingHeadForMessage } from './lib/talking-head-orchestrator';

const result = await createTalkingHeadForMessage(
  'Albert Einstein',
  'E = mc²',
  selectedAvatarUrl,
  conversationId,
  messageId,
  (status) => {
    console.log('Progress:', status.message, status.progress);
  }
);

// 3. Display in MessageBubble (automatic)
import { MessageBubble } from './components/MessageBubble';

<MessageBubble
  message={{
    content: 'E = mc²',
    videoUrl: result.videoUrl,  // Shows video player
    audioUrl: result.audioUrl,  // Fallback audio
    avatarUrl: result.avatarUrl, // Static avatar
    ...
  }}
  synthesizer={synthesizer}
/>
```

## Pre-configured Personas

The system includes optimized prompts and voices for 20+ personas:

**Philosophers**: Socrates, Aristotle, Confucius, Marcus Aurelius, Nietzsche

**Scientists**: Einstein, Marie Curie, Nikola Tesla, Ada Lovelace, Carl Sagan

**Artists**: Leonardo da Vinci, Shakespeare, Mark Twain, Oscar Wilde, Maya Angelou

**Leaders**: Winston Churchill, Nelson Mandela

**Fictional**: Sherlock Holmes, Yoda, Tony Stark

Each persona has:
- Custom DALL-E prompt for authentic appearance
- Matched OpenAI voice (echo, fable, nova, onyx, etc.)
- Personality traits for consistent character

## Cost Estimates

Per persona (one-time):
- Avatar generation: $0.12 (3 DALL-E images)

Per message:
- Text-to-speech: $0.015 per 1K characters
- Video generation: $0.03 (SadTalker)
- **Total: ~$0.05 per talking head video**

**Cost Saving Tips**:
- Reuse avatars across conversations (automatic)
- Make video generation optional (user preference)
- Cache videos for repeated responses

## Troubleshooting

### "Failed to generate avatar"
- Verify OpenAI API key has DALL-E 3 access
- Check account has credits
- Click "Regenerate Options"

### "Replicate API key required"
- Get key at: https://replicate.com/account/api-tokens
- Add to `.env` or enter when prompted
- Key is saved in browser localStorage

### "Video generation timed out"
- SadTalker sometimes takes longer (max 2 minutes)
- Message will still show with audio + static avatar
- Try generating again for the next message

### Storage bucket error
- Ensure bucket named `ai-council-assets` exists
- Verify bucket is set to **Public**
- Check Supabase project settings

## Files Added

New services:
- `src/lib/persona-config.ts` - Persona prompts and voices
- `src/lib/avatar-generation.ts` - DALL-E 3 integration
- `src/lib/text-to-speech.ts` - OpenAI TTS integration
- `src/lib/sadtalker-service.ts` - Replicate SadTalker API
- `src/lib/storage-service.ts` - Supabase storage uploads
- `src/lib/talking-head-orchestrator.ts` - Main orchestration

New components:
- `src/components/AvatarSelectionModal.tsx` - Avatar chooser UI
- `src/components/VideoGenerationProgress.tsx` - Progress indicator

Updated:
- `src/components/MessageBubble.tsx` - Video player support
- `src/types/index.ts` - Added video/audio/avatar fields
- `src/index.css` - Video component styles

Database:
- `supabase/migrations/*_add_talking_heads_support.sql` - Schema updates

Documentation:
- `STORAGE_SETUP.md` - Bucket setup instructions
- `TALKING_HEADS_INTEGRATION.md` - Full integration guide
- `TALKING_HEADS_QUICKSTART.md` - This file

## Next Steps

To activate the feature in your conversation flow:

1. Add avatar selection step before starting conversations
2. Call `createTalkingHeadForMessage()` after each AI response
3. Subscribe to real-time updates for video completion
4. (Optional) Add user preference toggle for video generation

See `TALKING_HEADS_INTEGRATION.md` for detailed integration code.

## Demo Video

Try it out:
1. Configure AI participants (existing flow)
2. Start a conversation
3. Watch as personas come to life with talking head videos!

Example personas to try:
- "What is the meaning of life?" → Socrates, Confucius, Nietzsche
- "Explain quantum mechanics" → Einstein, Marie Curie, Carl Sagan
- "Write a poem" → Shakespeare, Maya Angelou, Oscar Wilde

Enjoy your AI Council with realistic talking heads! 🎭
