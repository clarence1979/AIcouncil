# Talking Heads Integration Guide

This document explains how to integrate the realistic talking head video generation feature into the AI Council application.

## Overview

The talking heads feature allows AI personas to have photorealistic avatars that speak with lip-synced animations. The system uses:

- **DALL-E 3**: Generates photorealistic avatar portraits
- **OpenAI TTS**: Converts text responses to natural speech
- **SadTalker (Replicate)**: Animates avatars with lip-syncing
- **Supabase Storage**: Stores all generated media assets

## Architecture

```
User selects personas → Generate 3 avatar options → User chooses avatar
                                                     ↓
AI generates text response → Convert to speech → Upload assets
                                                  ↓
                                        Generate talking video
                                                  ↓
                                        Display in MessageBubble
```

## Setup Instructions

### 1. Create Supabase Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Create a new bucket named `ai-council-assets`
4. **Important**: Set the bucket to **Public**
5. The application will automatically organize files in this structure:
   ```
   councils/{conversation-id}/
   ├── avatars/  (DALL-E generated portraits)
   ├── audio/    (OpenAI TTS audio files)
   └── videos/   (SadTalker generated videos)
   ```

### 2. Obtain API Keys

You'll need the following API keys:

- **OpenAI API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Used for DALL-E 3 (avatar generation) and TTS (voice synthesis)

- **Replicate API Key**: [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
  - Used for SadTalker video generation
  - The app will prompt you automatically if not set

### 3. Integration into Conversation Flow

Here's how to integrate talking heads into your conversation orchestration:

```typescript
import { AvatarSelectionModal } from './components/AvatarSelectionModal';
import { VideoGenerationProgress } from './components/VideoGenerationProgress';
import {
  createTalkingHeadForMessage,
  savePersonaAvatar,
  getCachedPersonaAvatar
} from './lib/talking-head-orchestrator';
import { generateAvatarOptions } from './lib/avatar-generation';

// Step 1: Before starting conversation, select avatars for all personas
async function setupPersonaAvatars(personaNames: string[]) {
  const selectedAvatars: Record<string, string> = {};

  for (const personaName of personaNames) {
    // Check if user has used this persona before
    const cachedAvatar = await getCachedPersonaAvatar(personaName);

    if (cachedAvatar) {
      const reuse = confirm(`Reuse previous avatar for ${personaName}?`);
      if (reuse) {
        selectedAvatars[personaName] = cachedAvatar;
        continue;
      }
    }

    // Show avatar selection modal
    const { selectedUrl, allUrls } = await showAvatarSelectionModalForPersona(personaName);
    selectedAvatars[personaName] = selectedUrl;

    // Save selection for future use
    await savePersonaAvatar(personaName, selectedUrl, allUrls, conversationId);
  }

  return selectedAvatars;
}

// Step 2: During conversation, generate talking heads for each AI response
async function handleAIResponse(
  personaName: string,
  responseText: string,
  conversationId: string
) {
  // 1. Save message to database first
  const { data: message } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      participant_id: participantId,
      sender_type: 'ai',
      content: responseText,
      turn_number: currentTurn,
      video_status: 'pending'
    })
    .select()
    .single();

  // 2. Get selected avatar for this persona
  const avatarUrl = selectedAvatars[personaName];

  // 3. Generate talking head video (async)
  const statusUpdates: TalkingHeadStatus[] = [];

  createTalkingHeadForMessage(
    personaName,
    responseText,
    avatarUrl,
    conversationId,
    message.id,
    (status) => {
      // Update UI with progress
      setVideoGenerationStatus(prev => ({
        ...prev,
        [message.id]: status
      }));
    }
  ).catch(error => {
    console.error('Failed to generate talking head:', error);
    // Message will still display with text and static avatar
  });

  // 4. Return message immediately (video will be added later)
  return message;
}

// Step 3: Display progress indicators in UI
function ConversationView() {
  const [videoStatuses, setVideoStatuses] = useState<Record<string, TalkingHeadStatus>>({});

  return (
    <div>
      {/* Show progress for messages currently generating videos */}
      {Object.entries(videoStatuses).map(([messageId, status]) => (
        status.status !== 'completed' && status.status !== 'failed' && (
          <VideoGenerationProgress
            key={messageId}
            personaName={getPersonaNameForMessage(messageId)}
            status={status}
          />
        )
      ))}

      {/* Display messages (MessageBubble handles video/audio/avatar display) */}
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          message={message}
          synthesizer={synthesizer}
        />
      ))}
    </div>
  );
}
```

## Component Usage

### AvatarSelectionModal

Shows 3 DALL-E generated avatar options for a persona:

```tsx
import { AvatarSelectionModal } from './components/AvatarSelectionModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleAvatarSelected = (selectedUrl: string, allUrls: string[]) => {
    console.log('User selected:', selectedUrl);
    setShowModal(false);
    // Save selection...
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Select Avatar for Einstein
      </button>

      {showModal && (
        <AvatarSelectionModal
          personaName="Albert Einstein"
          onSelect={handleAvatarSelected}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

### VideoGenerationProgress

Displays real-time progress of video generation:

```tsx
import { VideoGenerationProgress } from './components/VideoGenerationProgress';

<VideoGenerationProgress
  personaName="Albert Einstein"
  status={{
    status: 'generating_video',
    message: 'Animating Albert Einstein (15-20 seconds)...',
    progress: 75
  }}
/>
```

### MessageBubble

Automatically displays videos when available:

```tsx
import { MessageBubble } from './components/MessageBubble';

// MessageBubble automatically handles three display modes:
// 1. Video available: Shows animated talking head
// 2. Audio + Avatar: Shows static avatar with play button
// 3. Fallback: Shows text only

<MessageBubble
  message={{
    id: '123',
    content: 'E = mc²',
    senderType: 'ai',
    videoUrl: 'https://...',  // Optional
    audioUrl: 'https://...',  // Optional
    avatarUrl: 'https://...', // Optional
    ...
  }}
  synthesizer={synthesizer}
/>
```

## Real-time Updates

To show videos as soon as they're ready, subscribe to database changes:

```typescript
import { supabase } from './lib/supabase';

useEffect(() => {
  const channel = supabase
    .channel('message-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        // Video just became available
        if (payload.new.video_url && !payload.old.video_url) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [conversationId]);
```

## Persona Configuration

The system includes pre-configured prompts and voices for 20+ famous personas:

```typescript
import { PERSONA_CONFIGS, getPersonaConfig } from './lib/persona-config';

// Get config for a persona
const config = getPersonaConfig('Albert Einstein');
console.log(config.imagePrompt); // DALL-E prompt
console.log(config.voiceId);     // OpenAI voice (e.g., 'onyx')

// Supported personas:
// - Socrates, Aristotle, Confucius, Marcus Aurelius
// - Albert Einstein, Marie Curie, Nikola Tesla, Ada Lovelace, Carl Sagan
// - Leonardo da Vinci, William Shakespeare, Mark Twain, Oscar Wilde
// - Maya Angelou, Winston Churchill, Nelson Mandela
// - Sherlock Holmes, Yoda, Tony Stark
// - and more...
```

## API Services

### Avatar Generation

```typescript
import { generateAvatarOptions } from './lib/avatar-generation';

// Generate 3 different avatar options
const { urls, personaName } = await generateAvatarOptions('Socrates', 3);
console.log(urls); // ['https://...', 'https://...', 'https://...']
```

### Text-to-Speech

```typescript
import { generateSpeech } from './lib/text-to-speech';

// Generate speech from text
const audioBlob = await generateSpeech(
  'Hello, I am Albert Einstein',
  'Albert Einstein',
  { speed: 1.0 }
);
```

### SadTalker Video Generation

```typescript
import { generateTalkingHead } from './lib/sadtalker-service';

// Generate talking head video
const { videoUrl } = await generateTalkingHead(
  'https://avatar-image-url.png',
  'https://audio-file-url.mp3',
  {
    still: true,
    preprocess: 'crop',
    enhancer: 'gfpgan'
  }
);
```

### Storage Uploads

```typescript
import { uploadAvatar, uploadAudio } from './lib/storage-service';

// Upload avatar to Supabase Storage
const avatarResult = await uploadAvatar(
  'https://dalle-generated-image.png',
  'Albert Einstein',
  conversationId
);

// Upload audio to Supabase Storage
const audioResult = await uploadAudio(
  audioBlob,
  'Albert Einstein',
  conversationId,
  messageId
);
```

## Error Handling

The system includes graceful degradation:

1. **Video generation fails**: Shows static avatar + audio
2. **Audio generation fails**: Shows static avatar + text
3. **Avatar generation fails**: Shows text only
4. **No Replicate key**: System continues with audio-only mode

## Cost Considerations

Be aware of API costs:

- **DALL-E 3**: ~$0.04 per image (3 images = ~$0.12 per persona)
- **OpenAI TTS**: ~$0.015 per 1K characters
- **SadTalker (Replicate)**: ~$0.02-0.05 per video generation
- **Total per message**: ~$0.05-0.10 depending on length

Consider implementing:
- Avatar caching (reuse same avatar across conversations)
- Optional video generation (user can disable for cost savings)
- Batch processing for multiple messages

## Performance Tips

1. **Generate avatars once**: Cache and reuse avatars for each persona
2. **Generate videos asynchronously**: Don't block UI while videos generate
3. **Show static avatars immediately**: Display avatar + text while video generates
4. **Use progress indicators**: Keep users informed during 15-20s video generation
5. **Implement retry logic**: SadTalker can occasionally fail, retry once

## Troubleshooting

### Videos not generating
- Check Replicate API key is set
- Verify Supabase storage bucket exists and is public
- Check browser console for detailed error messages

### Avatar generation fails
- Verify OpenAI API key has access to DALL-E 3
- Check OpenAI account has sufficient credits
- Try regenerating with the "Generate New Options" button

### Audio not playing
- Ensure browser allows audio autoplay
- Check audio URL is accessible (public bucket)
- Verify OpenAI TTS edge function is deployed

### Slow video generation
- SadTalker typically takes 15-20 seconds per video
- Longer audio files may take up to 60 seconds
- Consider showing progress indicator to manage expectations

## Next Steps

To fully integrate this feature:

1. Update `ConversationControls` to include avatar selection before starting
2. Modify conversation orchestrator to call `createTalkingHeadForMessage`
3. Add real-time subscription to update messages when videos complete
4. Implement user preferences for enabling/disabling video generation
5. Add cost tracking dashboard to monitor API usage
6. Consider adding video thumbnail generation for conversation history

## Demo Flow

Here's a complete example of the user experience:

1. User clicks "Start Conversation"
2. System prompts: "Let's select avatars for your council members"
3. For each persona (Einstein, Socrates, etc.):
   - Shows 3 DALL-E generated portrait options
   - User clicks their favorite
   - System saves selection
4. Conversation begins
5. When AI responds:
   - Text appears immediately
   - Static avatar shows while video generates
   - Progress indicator: "Generating voice → Uploading → Animating"
   - After 15-20 seconds, talking head video appears
   - User can click to play/pause video
6. Future conversations can reuse same avatars

Enjoy your AI Council with realistic talking heads!
