import { createAIClient, type AIMessage } from './ai-clients';
import type { LocalAIParticipant, TurnMode, Message } from '../types';

export class ConversationOrchestrator {
  private participants: LocalAIParticipant[];
  private messages: Message[];
  private turnMode: TurnMode;
  private maxTokens: number;
  private conversationStyle: string;
  private isRunning: boolean = false;
  private manualNextSpeakerId: string | null = null;

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

  setManualNextSpeaker(participantId: string) {
    this.manualNextSpeakerId = participantId;
  }

  stop() {
    this.isRunning = false;
  }

  async getNextResponse(
    onTyping: (participant: LocalAIParticipant) => void,
    onMessage: (participant: LocalAIParticipant, content: string) => Promise<void>,
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
        await onMessage(nextParticipant, response);
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
        return this.getManualParticipant();
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
    if (this.participants.length <= 1) return this.participants[0];

    const lastAiMessage = [...this.messages].reverse().find((m) => m.senderType === 'ai');
    const eligible = lastAiMessage
      ? this.participants.filter(p => p.id !== lastAiMessage.participantId)
      : this.participants;

    return eligible[Math.floor(Math.random() * eligible.length)] || this.participants[0];
  }

  private getContextualParticipant(): LocalAIParticipant {
    if (this.participants.length <= 1) return this.participants[0];

    const lastAiMessage = [...this.messages].reverse().find((m) => m.senderType === 'ai');
    const lastContent = lastAiMessage?.content?.toLowerCase() || '';

    let bestMatch: LocalAIParticipant | null = null;
    let bestScore = -1;

    for (const p of this.participants) {
      if (p.id === lastAiMessage?.participantId) continue;

      let score = 0;
      const name = (p.customName || p.defaultName).toLowerCase();
      if (lastContent.includes(name)) score += 10;

      if (p.characterPersona) {
        for (const trait of p.characterPersona.traits) {
          if (lastContent.includes(trait.toLowerCase())) score += 3;
        }
        if (lastContent.includes(p.characterPersona.name.toLowerCase())) score += 5;
      }

      const personalityKeywords: Record<string, string[]> = {
        analytical: ['data', 'evidence', 'logic', 'numbers', 'research', 'proof'],
        creative: ['imagine', 'create', 'design', 'art', 'novel', 'innovative'],
        skeptical: ['doubt', 'question', 'really', 'prove', 'evidence', 'sure'],
        philosophical: ['meaning', 'purpose', 'existence', 'truth', 'moral', 'ethics'],
        pragmatic: ['practical', 'real', 'actually', 'work', 'solution', 'implement'],
        enthusiastic: ['amazing', 'great', 'love', 'exciting', 'wonderful'],
        sarcastic: ['obviously', 'sure', 'right', 'clearly', 'genius'],
        witty: ['joke', 'funny', 'humor', 'clever', 'absurd'],
      };

      const keywords = personalityKeywords[p.personality] || [];
      for (const kw of keywords) {
        if (lastContent.includes(kw)) score += 2;
      }

      if (lastContent.includes('?')) score += 1;
      score += Math.random() * 3;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = p;
      }
    }

    return bestMatch || this.getRandomParticipant();
  }

  private getManualParticipant(): LocalAIParticipant | null {
    if (!this.manualNextSpeakerId) return null;
    const participant = this.participants.find(p => p.id === this.manualNextSpeakerId);
    this.manualNextSpeakerId = null;
    return participant || null;
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
          'DEBATE MODE: Attack the idea, not the person. But be ruthless with bad logic. Call out BS. No mercy.';
        break;
      case 'consensus':
        styleInstructions =
          'CONSENSUS MODE: Push back first, THEN find common ground. Make them earn agreement.';
        break;
      case 'questioning':
        styleInstructions =
          'QUESTIONING MODE: Ask loaded questions. Make them squirm. Expose the holes in their thinking.';
        break;
      default:
        styleInstructions =
          'DISCUSSION MODE: Disagree first. Find the flaw. Make them defend their position.';
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
- 1-2 sentences MAX. Any longer = you lose.
- DISAGREE by default. Agreement is boring. Find what's wrong first.
- No politeness required. Be blunt. Be rude if the idea deserves it.
- Call out flaws immediately. Don't sugarcoat.
- Informal language encouraged. This isn't a boardroom.
- NO hedging. No "perhaps" or "maybe" or "it depends."
- NEVER prefix your response with your name or format it like "${participantName}:"
- React fast, hit hard, move on.

Short. Sharp. Disagree.`;
  }

  private getPersonalityTrait(personality: string): string {
    const traits: Record<string, string> = {
      analytical: 'Tear apart weak logic. Numbers don\'t lie, people do. Show the receipts or shut up.',
      creative: 'Break the rules. Normal thinking is trash. Push boundaries, make them uncomfortable.',
      sarcastic: 'Mock bad ideas. Use humor like a knife. Make them laugh at themselves.',
      enthusiastic: 'Call out lazy thinking with energy. Get fired up. Don\'t let mediocrity slide.',
      skeptical: 'Trust nothing. Everyone\'s full of it until proven otherwise. Demand receipts.',
      philosophical: 'Challenge their assumptions. Go deeper. Make them question everything they thought they knew.',
      pragmatic: 'Real world or GTFO. Theory is worthless. What actually works? Anything else is noise.',
      witty: 'Roast bad takes. Make your point sting. Clever burns only.',
    };
    return traits[personality] || traits.analytical;
  }
}
