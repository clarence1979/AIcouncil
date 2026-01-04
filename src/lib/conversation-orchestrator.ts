import { createAIClient, type AIMessage } from './ai-clients';
import type { LocalAIParticipant, TurnMode, Message } from '../types';

export class ConversationOrchestrator {
  private participants: LocalAIParticipant[];
  private messages: Message[];
  private turnMode: TurnMode;
  private maxTokens: number;
  private conversationStyle: string;
  private isRunning: boolean = false;

  constructor(
    participants: LocalAIParticipant[],
    turnMode: TurnMode,
    maxTokens: number,
    conversationStyle: string
  ) {
    this.participants = participants.filter((p) => p.isActive);
    this.messages = [];
    this.turnMode = turnMode;
    this.maxTokens = maxTokens;
    this.conversationStyle = conversationStyle;
  }

  setMessages(messages: Message[]) {
    this.messages = messages;
  }

  stop() {
    this.isRunning = false;
  }

  async getNextResponse(
    onTyping: (participant: LocalAIParticipant) => void,
    onMessage: (participant: LocalAIParticipant, content: string) => void,
    onError: (participant: LocalAIParticipant, error: string) => void
  ): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const nextParticipant = this.selectNextSpeaker();
    if (!nextParticipant) {
      return;
    }

    onTyping(nextParticipant);

    try {
      const context = this.buildContext(nextParticipant);
      const client = createAIClient(nextParticipant.provider, nextParticipant.apiKey);

      const response = await client.sendMessage(context, nextParticipant.model, {
        temperature: nextParticipant.config.temperature,
        maxTokens: this.maxTokens,
      });

      if (this.isRunning) {
        onMessage(nextParticipant, response);
      }
    } catch (error: any) {
      onError(nextParticipant, error.message || 'An error occurred');
    }
  }

  start() {
    this.isRunning = true;
  }

  pause() {
    this.isRunning = false;
  }

  private selectNextSpeaker(): LocalAIParticipant | null {
    if (this.participants.length === 0) {
      return null;
    }

    switch (this.turnMode) {
      case 'sequential':
        return this.getNextSequential();
      case 'random':
        return this.getRandomParticipant();
      case 'contextual':
        return this.getContextualParticipant();
      case 'manual':
        return null;
      default:
        return this.getNextSequential();
    }
  }

  private getNextSequential(): LocalAIParticipant {
    const lastAiMessage = [...this.messages]
      .reverse()
      .find((m) => m.senderType === 'ai');

    if (!lastAiMessage) {
      return this.participants[0];
    }

    const lastIndex = this.participants.findIndex(
      (p) => p.id === lastAiMessage.participantId
    );

    if (lastIndex === -1) {
      return this.participants[0];
    }

    const nextIndex = (lastIndex + 1) % this.participants.length;
    return this.participants[nextIndex];
  }

  private getRandomParticipant(): LocalAIParticipant {
    const randomIndex = Math.floor(Math.random() * this.participants.length);
    return this.participants[randomIndex];
  }

  private getContextualParticipant(): LocalAIParticipant {
    return this.getRandomParticipant();
  }

  private buildContext(currentParticipant: LocalAIParticipant): AIMessage[] {
    const systemPrompt = this.getSystemPrompt(currentParticipant);
    const context: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    for (const message of this.messages) {
      if (message.senderType === 'user') {
        context.push({
          role: 'user',
          content: message.content,
        });
      } else {
        const participant = this.participants.find((p) => p.id === message.participantId);
        const speakerName =
          participant?.customName || participant?.defaultName || 'AI';

        if (message.participantId === currentParticipant.id) {
          context.push({
            role: 'assistant',
            content: message.content,
          });
        } else {
          context.push({
            role: 'user',
            content: `${speakerName} says: ${message.content}`,
          });
        }
      }
    }

    return context;
  }

  private getSystemPrompt(participant: LocalAIParticipant): string {
    const participantName = participant.customName || participant.defaultName;
    const otherParticipants = this.participants
      .filter((p) => p.id !== participant.id)
      .map((p) => p.customName || p.defaultName)
      .join(', ');

    let styleInstructions = '';
    switch (this.conversationStyle) {
      case 'debate':
        styleInstructions =
          'DEBATE MODE: Be sharp. Challenge ideas directly. Make your point land hard.';
        break;
      case 'consensus':
        styleInstructions =
          'CONSENSUS MODE: Find what connects the ideas. Bridge disagreements with insight.';
        break;
      case 'questioning':
        styleInstructions =
          'QUESTIONING MODE: Drop thought bombs as questions. Make people rethink everything.';
        break;
      default:
        styleInstructions =
          'DISCUSSION MODE: Add spice. Build on ideas in unexpected ways.';
    }

    let personalitySection = '';
    if (participant.characterPersona) {
      const traits = participant.characterPersona.traits.join(', ');
      const speakingStyleSection = participant.characterPersona.speakingStyle
        ? `\nSPEAKING STYLE: ${participant.characterPersona.speakingStyle}`
        : '';
      const catchphrasesSection = participant.characterPersona.catchphrases && participant.characterPersona.catchphrases.length > 0
        ? `\nFAMOUS PHRASES: ${participant.characterPersona.catchphrases.join(' | ')}`
        : '';
      const mannerismsSection = participant.characterPersona.mannerisms && participant.characterPersona.mannerisms.length > 0
        ? `\nMANNERISMS & QUIRKS: ${participant.characterPersona.mannerisms.join(', ')}`
        : '';

      personalitySection = `CHARACTER: You are ${participant.characterPersona.name}. ${participant.characterPersona.description}

KEY TRAITS: ${traits}${speakingStyleSection}${catchphrasesSection}${mannerismsSection}

CRITICAL: Fully embody this character. Use their speaking style, reference their way of thinking, and incorporate their characteristic phrases naturally. Stay in character at all times. Don't just describe them - BE them.`;
    } else {
      const personalityTrait = this.getPersonalityTrait(participant.personality || 'analytical');
      personalitySection = `PERSONALITY: ${personalityTrait}`;
    }

    return `You are ${participantName}${
      otherParticipants ? ` in a conversation with ${otherParticipants}` : ''
    }.

CRITICAL: This is a TURN-BASED conversation. You speak ONLY as ${participantName}. DO NOT simulate or write responses for other participants. Wait for them to respond in their own turns.

${styleInstructions}

${personalitySection}

RULES:
- 2-4 sentences MAX. Brevity is power.
- Strong takes. No hedging. No "well, it depends."
- React to what was just said - quote it, flip it, build on it
- Be witty when you can. Boring = banned.
- Skip the formalities. Jump straight to the point.
- One killer idea per response
- NEVER prefix your response with your name or format it like "${participantName}:"
- Just respond naturally as yourself

Make it punchy. Make it count.`;
  }

  private getPersonalityTrait(personality: string): string {
    const traits: Record<string, string> = {
      analytical: 'You dissect arguments with precision. Data and logic are your weapons.',
      creative: 'You think sideways. Connect dots others miss. Make wild leaps work.',
      sarcastic: 'Your wit has bite. Call out BS with humor. Keep it clever.',
      enthusiastic: 'You bring energy. Hype up good ideas. Make boring topics pop.',
      skeptical: 'You question everything. Poke holes. Demand proof. Stay critical.',
      philosophical: 'You zoom out. Find deeper meaning. Connect to bigger ideas.',
      pragmatic: 'You cut to what works. Real solutions only. No fluff.',
      witty: 'You weaponize humor. Drop zingers. Make serious points hilariously.',
    };
    return traits[personality] || traits.analytical;
  }
}
