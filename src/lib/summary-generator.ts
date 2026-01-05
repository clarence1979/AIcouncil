import { createAIClient } from './ai-clients';
import type { Message, LocalAIParticipant } from '../types';

export async function generateConversationSummary(
  messages: Message[],
  participants: LocalAIParticipant[]
): Promise<{ summary: string; winner: string }> {
  const aiMessages = messages.filter(m => m.senderType === 'ai');

  if (aiMessages.length === 0) {
    return {
      summary: 'No discussion took place.',
      winner: 'No winner - no messages exchanged.'
    };
  }

  const userMessage = messages.find(m => m.senderType === 'user');
  const topic = userMessage?.content || 'Unknown topic';

  const transcript = aiMessages.map(msg => {
    const participant = participants.find(p => p.id === msg.participantId);
    const name = participant?.customName || participant?.defaultName || 'AI';
    return `${name}: ${msg.content}`;
  }).join('\n\n');

  const participantNames = participants
    .map(p => p.customName || p.defaultName)
    .join(', ');

  const availableParticipant = participants.find(p => p.apiKey && p.isActive);
  if (!availableParticipant) {
    return {
      summary: 'Summary generation requires an active AI participant with API key.',
      winner: 'Unable to determine winner without AI analysis.'
    };
  }

  try {
    const client = createAIClient(availableParticipant.provider, availableParticipant.apiKey);

    const prompt = `You are analyzing an AI council discussion. Here is the information:

Topic: ${topic}

Participants: ${participantNames}

Full Transcript:
${transcript}

Please provide:
1. A comprehensive summary of the discussion (3-5 paragraphs covering key points, arguments, and conclusions)
2. Declare a winner based on who made the most compelling arguments, showed the best reasoning, and contributed most meaningfully to the discussion

Format your response exactly as:
SUMMARY:
[Your summary here]

WINNER:
[Winner name and explanation here]`;

    const response = await client.sendMessage(
      [{ role: 'user', content: prompt }],
      availableParticipant.model,
      { temperature: 0.3, maxTokens: 1500 }
    );

    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=WINNER:|$)/);
    const winnerMatch = response.match(/WINNER:\s*([\s\S]*?)$/);

    const summary = summaryMatch ? summaryMatch[1].trim() : response;
    const winner = winnerMatch ? winnerMatch[1].trim() : 'Unable to determine a clear winner.';

    return { summary, winner };
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      summary: 'Error generating summary. Please try again.',
      winner: 'Unable to determine winner due to an error.'
    };
  }
}
