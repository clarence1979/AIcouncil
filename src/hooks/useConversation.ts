import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { VoiceSynthesizer } from '../lib/voice-synthesis';
import { ConversationOrchestrator } from '../lib/conversation-orchestrator';
import { createTalkingHeadForMessage } from '../lib/talking-head-orchestrator';
import { generateTranscriptPDF, generateSummaryPDF } from '../lib/pdf-generator';
import { generateConversationSummary } from '../lib/summary-generator';
import type { LocalAIParticipant, Message } from '../types';

export function useConversation() {
  const {
    participants,
    messages,
    conversationSettings,
    isConversationActive,
    addMessage,
    updateMessage,
    clearMessages,
    updateParticipant,
    setIsConversationActive,
    setShowApiConfig,
  } = useApp();

  const toast = useToast();
  const [typingParticipant, setTypingParticipant] = useState<LocalAIParticipant | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [manualNextSpeaker, setManualNextSpeaker] = useState<string | null>(null);
  const [awaitingManualSelection, setAwaitingManualSelection] = useState(false);

  const synthesizerRef = useRef(new VoiceSynthesizer());
  const orchestratorRef = useRef<ConversationOrchestrator | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const isPausedRef = useRef(false);
  const currentTurnRef = useRef(0);

  const syncMessages = useCallback((msgs: Message[]) => {
    messagesRef.current = msgs;
    if (orchestratorRef.current) {
      orchestratorRef.current.setMessages(msgs);
    }
  }, []);

  const speakContent = useCallback(async (content: string, participant: LocalAIParticipant) => {
    if (!conversationSettings.autoPlayVoice) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return;
    }
    try {
      await synthesizerRef.current.speak(content, {
        voice: participant.voiceName || 'default',
        rate: 0.9,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }, [conversationSettings.autoPlayVoice]);

  const handleTalkingHead = useCallback(async (
    participant: LocalAIParticipant,
    content: string,
    messageId: string,
    avatarImageUrl: string
  ) => {
    const characterName = participant.characterPersona?.name || participant.customName || participant.defaultName;
    const suggestedVoice = participant.characterPersona?.voiceCharacteristics?.suggestedVoice;

    try {
      const result = await createTalkingHeadForMessage(
        characterName,
        content,
        avatarImageUrl,
        'local',
        messageId,
        (status) => console.log('Talking head status:', status),
        suggestedVoice
      );

      updateMessage(messageId, {
        videoUrl: result.videoUrl,
        avatarUrl: result.avatarUrl,
        audioUrl: result.audioUrl,
        videoStatus: 'completed',
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to generate talking head:', error);
      updateMessage(messageId, { videoStatus: 'failed' });
      await speakContent(content, participant);
    }
  }, [updateMessage, speakContent]);

  const continueConversation = useCallback(async () => {
    if (!orchestratorRef.current) return;

    if (conversationSettings.turnMode === 'manual') {
      setAwaitingManualSelection(true);
      return;
    }

    await orchestratorRef.current.getNextResponse(
      (participant) => setTypingParticipant(participant),
      async (participant, content) => {
        setTypingParticipant(null);

        const avatarImageUrl = participant.avatarUrl || participant.characterPersona?.imageUrl;

        const newMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: 'local',
          participantId: participant.id,
          senderType: 'ai',
          content,
          turnNumber: currentTurnRef.current,
          createdAt: new Date().toISOString(),
          videoStatus: (conversationSettings.enableTalkingHeads && avatarImageUrl) ? 'generating' : undefined,
        };

        messagesRef.current = [...messagesRef.current, newMessage];
        syncMessages(messagesRef.current);
        addMessage(newMessage);
        updateParticipant(participant.id, { messageCount: participant.messageCount + 1 });

        if (conversationSettings.enableTalkingHeads && avatarImageUrl) {
          await handleTalkingHead(participant, content, newMessage.id, avatarImageUrl);
        } else {
          await speakContent(content, participant);
        }

        const newTurn = currentTurnRef.current + 1;
        currentTurnRef.current = newTurn;
        setCurrentTurn(newTurn);

        const shouldContinue = conversationSettings.maxTurns === 0 || newTurn < conversationSettings.maxTurns;

        if (shouldContinue && orchestratorRef.current && !isPausedRef.current) {
          setTimeout(() => {
            if (orchestratorRef.current && !isPausedRef.current) {
              continueConversation();
            }
          }, 100);
        } else if (!shouldContinue) {
          handleStop();
        }
      },
      (participant, error) => {
        setTypingParticipant(null);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: 'local',
          participantId: participant.id,
          senderType: 'ai',
          content: `[Error: ${error}]`,
          turnNumber: currentTurnRef.current,
          createdAt: new Date().toISOString(),
        };

        messagesRef.current = [...messagesRef.current, errorMessage];
        syncMessages(messagesRef.current);
        addMessage(errorMessage);

        const newTurn = currentTurnRef.current + 1;
        currentTurnRef.current = newTurn;
        setCurrentTurn(newTurn);

        const shouldContinue = conversationSettings.maxTurns === 0 || newTurn < conversationSettings.maxTurns;

        if (shouldContinue && orchestratorRef.current && !isPausedRef.current) {
          setTimeout(() => {
            if (orchestratorRef.current && !isPausedRef.current) {
              continueConversation();
            }
          }, 2000);
        }
      }
    );
  }, [conversationSettings, addMessage, updateParticipant, syncMessages, handleTalkingHead, speakContent, updateMessage]);

  const selectManualSpeaker = useCallback(async (participantId: string) => {
    if (!orchestratorRef.current) return;
    setAwaitingManualSelection(false);
    setManualNextSpeaker(null);

    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    orchestratorRef.current.setManualNextSpeaker(participantId);

    await orchestratorRef.current.getNextResponse(
      () => setTypingParticipant(participant),
      async (_participant, content) => {
        setTypingParticipant(null);

        const avatarImageUrl = _participant.avatarUrl || _participant.characterPersona?.imageUrl;

        const newMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: 'local',
          participantId: _participant.id,
          senderType: 'ai',
          content,
          turnNumber: currentTurnRef.current,
          createdAt: new Date().toISOString(),
          videoStatus: (conversationSettings.enableTalkingHeads && avatarImageUrl) ? 'generating' : undefined,
        };

        messagesRef.current = [...messagesRef.current, newMessage];
        syncMessages(messagesRef.current);
        addMessage(newMessage);
        updateParticipant(_participant.id, { messageCount: _participant.messageCount + 1 });

        if (conversationSettings.enableTalkingHeads && avatarImageUrl) {
          await handleTalkingHead(_participant, content, newMessage.id, avatarImageUrl);
        } else {
          await speakContent(content, _participant);
        }

        const newTurn = currentTurnRef.current + 1;
        currentTurnRef.current = newTurn;
        setCurrentTurn(newTurn);

        const shouldContinue = conversationSettings.maxTurns === 0 || newTurn < conversationSettings.maxTurns;

        if (shouldContinue && orchestratorRef.current && !isPausedRef.current) {
          if (conversationSettings.turnMode === 'manual') {
            setAwaitingManualSelection(true);
          } else {
            setTimeout(() => continueConversation(), 100);
          }
        } else if (!shouldContinue) {
          handleStop();
        }
      },
      (p, error) => {
        setTypingParticipant(null);
        toast.error(`${p.customName || p.defaultName} encountered an error: ${error}`);
        setAwaitingManualSelection(true);
      }
    );
  }, [participants, conversationSettings, addMessage, updateParticipant, syncMessages, handleTalkingHead, speakContent, continueConversation, toast, updateMessage]);

  const handleStart = useCallback(async (topic: string) => {
    if (participants.length === 0) {
      toast.warning('Please configure at least one AI participant first.');
      setShowApiConfig(true);
      return;
    }

    const activeParticipants = participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      toast.warning('Please activate at least one AI participant.');
      return;
    }

    const topicMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: 'local',
      senderType: 'user',
      content: topic,
      turnNumber: isConversationActive ? currentTurnRef.current : 0,
      createdAt: new Date().toISOString(),
    };

    if (isConversationActive) {
      messagesRef.current = [...messagesRef.current, topicMessage];
      syncMessages(messagesRef.current);
      addMessage(topicMessage);

      if (isPaused) {
        setIsPaused(false);
        isPausedRef.current = false;
        orchestratorRef.current?.start();
        setTimeout(() => continueConversation(), 1000);
      }
      return;
    }

    clearMessages();
    messagesRef.current = [];
    currentTurnRef.current = 1;
    setCurrentTurn(1);
    setIsConversationActive(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setAwaitingManualSelection(false);

    orchestratorRef.current = new ConversationOrchestrator(
      participants,
      conversationSettings.turnMode,
      conversationSettings.responseLength,
      conversationSettings.conversationStyle
    );

    messagesRef.current = [topicMessage];
    orchestratorRef.current.setMessages([topicMessage]);
    orchestratorRef.current.start();
    addMessage(topicMessage);

    setTimeout(() => continueConversation(), 1000);
  }, [participants, conversationSettings, isConversationActive, isPaused, clearMessages, addMessage, setIsConversationActive, setShowApiConfig, syncMessages, continueConversation, toast]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    orchestratorRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    orchestratorRef.current?.start();
    setTimeout(() => continueConversation(), 1000);
  }, [continueConversation]);

  const handleStop = useCallback(() => {
    setIsConversationActive(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setTypingParticipant(null);
    setAwaitingManualSelection(false);
    orchestratorRef.current?.stop();
    orchestratorRef.current = null;
  }, [setIsConversationActive]);

  const handleClear = useCallback(() => {
    clearMessages();
    messagesRef.current = [];
    currentTurnRef.current = 0;
    setCurrentTurn(0);
    setIsConversationActive(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setAwaitingManualSelection(false);
  }, [clearMessages, setIsConversationActive]);

  const handleDownloadTranscript = useCallback(() => {
    const topic = messages.find(m => m.senderType === 'user')?.content || 'AI Council Discussion';
    generateTranscriptPDF(messages, participants, topic);
    toast.success('Transcript PDF downloaded.');
  }, [messages, participants, toast]);

  const handleDownloadSummary = useCallback(async () => {
    toast.info('Generating summary and determining winner...');
    try {
      const { summary, winner } = await generateConversationSummary(messages, participants);
      await generateSummaryPDF(summary, winner, messages, participants);
      toast.success('Summary PDF downloaded.');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary. Please try again.');
    }
  }, [messages, participants, toast]);

  return {
    typingParticipant,
    isPaused,
    currentTurn,
    awaitingManualSelection,
    manualNextSpeaker,
    synthesizer: synthesizerRef.current,
    messagesEndRef: useRef<HTMLDivElement>(null),

    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleClear,
    handleDownloadTranscript,
    handleDownloadSummary,
    selectManualSpeaker,
    setManualNextSpeaker,
  };
}
