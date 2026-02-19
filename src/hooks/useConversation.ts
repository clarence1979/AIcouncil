import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [awaitingManualSelection, setAwaitingManualSelection] = useState(false);

  const synthesizerRef = useRef(new VoiceSynthesizer());
  const orchestratorRef = useRef<ConversationOrchestrator | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const isPausedRef = useRef(false);
  const responseCountRef = useRef(0);
  const activeParticipantCountRef = useRef(1);
  const settingsRef = useRef(conversationSettings);
  const participantsRef = useRef(participants);
  const loopRef = useRef<() => Promise<void>>();

  useEffect(() => {
    settingsRef.current = conversationSettings;
  }, [conversationSettings]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const speakContent = useCallback(async (content: string, participant: LocalAIParticipant) => {
    if (!settingsRef.current.autoPlayVoice) {
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
  }, []);

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

  const processResponse = useCallback(async (participant: LocalAIParticipant, content: string) => {
    const settings = settingsRef.current;
    const avatarImageUrl = participant.avatarUrl || participant.characterPersona?.imageUrl;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: 'local',
      participantId: participant.id,
      senderType: 'ai',
      content,
      turnNumber: responseCountRef.current,
      createdAt: new Date().toISOString(),
      videoStatus: (settings.enableTalkingHeads && avatarImageUrl) ? 'generating' : undefined,
    };

    messagesRef.current = [...messagesRef.current, newMessage];
    if (orchestratorRef.current) {
      orchestratorRef.current.setMessages(messagesRef.current);
    }
    addMessage(newMessage);
    updateParticipant(participant.id, { messageCount: participant.messageCount + 1 });

    if (settings.enableTalkingHeads && avatarImageUrl) {
      await handleTalkingHead(participant, content, newMessage.id, avatarImageUrl);
    } else {
      await speakContent(content, participant);
    }
  }, [addMessage, updateParticipant, handleTalkingHead, speakContent]);

  const runConversationLoop = useCallback(async () => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return;

    const settings = settingsRef.current;

    if (settings.turnMode === 'manual') {
      setAwaitingManualSelection(true);
      return;
    }

    try {
      await orchestrator.getNextResponse(
        (participant) => setTypingParticipant(participant),
        async (participant, content) => {
          setTypingParticipant(null);
          await processResponse(participant, content);

          responseCountRef.current += 1;
          const round = Math.floor(responseCountRef.current / activeParticipantCountRef.current) + 1;
          setCurrentTurn(round);

          const maxTurns = settingsRef.current.maxTurns;
          const maxResponses = maxTurns * activeParticipantCountRef.current;
          const shouldContinue = maxTurns === 0 || responseCountRef.current < maxResponses;

          if (shouldContinue && orchestratorRef.current && !isPausedRef.current) {
            setTimeout(() => {
              if (orchestratorRef.current && !isPausedRef.current) {
                loopRef.current?.();
              }
            }, 100);
          } else if (!shouldContinue) {
            setIsConversationActive(false);
            setIsPaused(false);
            isPausedRef.current = false;
            setTypingParticipant(null);
            setAwaitingManualSelection(false);
            orchestratorRef.current?.stop();
            orchestratorRef.current = null;
          }
        },
        (participant, error) => {
          setTypingParticipant(null);
          console.error(`AI error from ${participant.customName || participant.defaultName}:`, error);

          const errorMessage: Message = {
            id: crypto.randomUUID(),
            conversationId: 'local',
            participantId: participant.id,
            senderType: 'ai',
            content: `[Error: ${error}]`,
            turnNumber: responseCountRef.current,
            createdAt: new Date().toISOString(),
          };

          messagesRef.current = [...messagesRef.current, errorMessage];
          if (orchestratorRef.current) {
            orchestratorRef.current.setMessages(messagesRef.current);
          }
          addMessage(errorMessage);

          responseCountRef.current += 1;
          const round = Math.floor(responseCountRef.current / activeParticipantCountRef.current) + 1;
          setCurrentTurn(round);

          const maxTurns = settingsRef.current.maxTurns;
          const maxResponses = maxTurns * activeParticipantCountRef.current;
          const shouldContinue = maxTurns === 0 || responseCountRef.current < maxResponses;

          if (shouldContinue && orchestratorRef.current && !isPausedRef.current) {
            setTimeout(() => {
              if (orchestratorRef.current && !isPausedRef.current) {
                loopRef.current?.();
              }
            }, 2000);
          }
        }
      );
    } catch (error) {
      console.error('Conversation loop error:', error);
      setTypingParticipant(null);
      toast.error('An unexpected error occurred. The conversation has been paused.');
    }
  }, [processResponse, addMessage, setIsConversationActive, toast]);

  useEffect(() => {
    loopRef.current = runConversationLoop;
  }, [runConversationLoop]);

  const selectManualSpeaker = useCallback(async (participantId: string) => {
    if (!orchestratorRef.current) return;
    setAwaitingManualSelection(false);

    const participant = participantsRef.current.find(p => p.id === participantId);
    if (!participant) return;

    orchestratorRef.current.setManualNextSpeaker(participantId);

    try {
      await orchestratorRef.current.getNextResponse(
        () => setTypingParticipant(participant),
        async (_participant, content) => {
          setTypingParticipant(null);
          await processResponse(_participant, content);

          responseCountRef.current += 1;
          const round = Math.floor(responseCountRef.current / activeParticipantCountRef.current) + 1;
          setCurrentTurn(round);

          const maxTurns = settingsRef.current.maxTurns;
          const maxResponses = maxTurns * activeParticipantCountRef.current;
          const shouldContinue = maxTurns === 0 || responseCountRef.current < maxResponses;

          if (shouldContinue && orchestratorRef.current && !isPausedRef.current) {
            if (settingsRef.current.turnMode === 'manual') {
              setAwaitingManualSelection(true);
            } else {
              setTimeout(() => loopRef.current?.(), 100);
            }
          } else if (!shouldContinue) {
            setIsConversationActive(false);
            setIsPaused(false);
            isPausedRef.current = false;
            setTypingParticipant(null);
            setAwaitingManualSelection(false);
            orchestratorRef.current?.stop();
            orchestratorRef.current = null;
          }
        },
        (p, error) => {
          setTypingParticipant(null);
          toast.error(`${p.customName || p.defaultName} encountered an error: ${error}`);
          setAwaitingManualSelection(true);
        }
      );
    } catch (error) {
      console.error('Manual speaker error:', error);
      setTypingParticipant(null);
      toast.error('An error occurred. Please select a speaker again.');
      setAwaitingManualSelection(true);
    }
  }, [processResponse, setIsConversationActive, toast]);

  const handleStart = useCallback(async (topic: string) => {
    if (participantsRef.current.length === 0) {
      toast.warning('Please configure at least one AI participant first.');
      setShowApiConfig(true);
      return;
    }

    const activeParticipants = participantsRef.current.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      toast.warning('Please activate at least one AI participant.');
      return;
    }

    const topicMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: 'local',
      senderType: 'user',
      content: topic,
      turnNumber: isConversationActive ? currentTurn : 0,
      createdAt: new Date().toISOString(),
    };

    if (isConversationActive) {
      messagesRef.current = [...messagesRef.current, topicMessage];
      if (orchestratorRef.current) {
        orchestratorRef.current.setMessages(messagesRef.current);
      }
      addMessage(topicMessage);

      if (isPaused) {
        setIsPaused(false);
        isPausedRef.current = false;
        orchestratorRef.current?.start();
        setTimeout(() => loopRef.current?.(), 1000);
      }
      return;
    }

    clearMessages();
    messagesRef.current = [];
    responseCountRef.current = 0;
    activeParticipantCountRef.current = activeParticipants.length;
    setCurrentTurn(1);
    setIsConversationActive(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setAwaitingManualSelection(false);

    orchestratorRef.current = new ConversationOrchestrator(
      participantsRef.current,
      settingsRef.current.turnMode,
      settingsRef.current.responseLength,
      settingsRef.current.conversationStyle
    );

    messagesRef.current = [topicMessage];
    orchestratorRef.current.setMessages([topicMessage]);
    orchestratorRef.current.start();
    addMessage(topicMessage);

    setTimeout(() => loopRef.current?.(), 1000);
  }, [isConversationActive, isPaused, clearMessages, addMessage, setIsConversationActive, setShowApiConfig, toast]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    orchestratorRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    orchestratorRef.current?.start();
    setTimeout(() => loopRef.current?.(), 1000);
  }, []);

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
    responseCountRef.current = 0;
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
    synthesizer: synthesizerRef.current,

    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleClear,
    handleDownloadTranscript,
    handleDownloadSummary,
    selectManualSpeaker,
  };
}
