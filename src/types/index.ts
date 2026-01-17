export type Personality =
  | 'analytical'
  | 'creative'
  | 'sarcastic'
  | 'enthusiastic'
  | 'skeptical'
  | 'philosophical'
  | 'pragmatic'
  | 'witty';

export type Avatar =
  | '🤖'
  | '👨‍💻'
  | '👩‍🔬'
  | '🧠'
  | '🎭'
  | '🦉'
  | '🦊'
  | '🐺'
  | '🐉'
  | '⚡'
  | '🔮'
  | '💎';

export const AI_VOICES = [
  { id: 'nova', name: 'Nova', description: 'Warm, engaging female voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Gentle, soothing female voice' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral, clear voice' },
  { id: 'echo', name: 'Echo', description: 'Friendly male voice' },
  { id: 'fable', name: 'Fable', description: 'Distinguished British male' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, calming male voice' },
] as const;

export type AIVoiceId = typeof AI_VOICES[number]['id'];

export interface CharacterPersona {
  name: string;
  description: string;
  traits: string[];
  speakingStyle?: string;
  catchphrases?: string[];
  mannerisms?: string[];
  imageUrl?: string;
  isCustom: boolean;
  voiceCharacteristics?: {
    gender: 'male' | 'female' | 'neutral';
    ageRange: 'young' | 'middle' | 'elderly';
    accent: string;
    suggestedVoice: AIVoiceId;
    reasoning: string;
  };
}

export interface AIParticipant {
  id: string;
  userId: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  customName?: string;
  defaultName: string;
  color: string;
  apiKeyHash: string;
  voiceName?: string;
  personality: Personality;
  avatar: Avatar;
  characterPersona?: CharacterPersona;
  config: {
    temperature?: number;
    maxTokens?: number;
  };
  isActive: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  topic: string;
  turnMode: 'sequential' | 'random' | 'contextual' | 'manual';
  conversationStyle: string;
  maxTurns: number;
  currentTurn: number;
  isActive: boolean;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  participantId?: string;
  senderType: 'user' | 'ai';
  content: string;
  turnNumber: number;
  createdAt: string;
  avatarUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  videoStatus?: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  participantId: string;
  joinOrder: number;
  createdAt: string;
}

export interface LocalAIParticipant {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  customName?: string;
  defaultName: string;
  color: string;
  apiKey: string;
  voiceName?: string;
  personality: Personality;
  avatar: Avatar;
  avatarUrl?: string;
  characterPersona?: CharacterPersona;
  config: {
    temperature?: number;
    maxTokens?: number;
  };
  isActive: boolean;
  messageCount: number;
}

export type TurnMode = 'sequential' | 'random' | 'contextual' | 'manual';

export interface ConversationSettings {
  turnMode: TurnMode;
  conversationStyle: string;
  maxTurns: number;
  autoPlayVoice: boolean;
  responseLength: number;
  enableTalkingHeads: boolean;
}
