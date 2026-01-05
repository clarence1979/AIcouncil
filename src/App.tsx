import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, HelpCircle } from 'lucide-react';
import { useApp } from './context/AppContext';
import { ApiConfigModal } from './components/ApiConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { ParticipantConfigModal } from './components/ParticipantConfigModal';
import { ParticipantCard } from './components/ParticipantCard';
import { MessageBubble, TypingIndicator } from './components/MessageBubble';
import { TopicInput } from './components/TopicInput';
import { ConversationControls } from './components/ConversationControls';
import { VoiceSynthesizer } from './lib/voice-synthesis';
import { ConversationOrchestrator } from './lib/conversation-orchestrator';
import { createTalkingHeadForMessage } from './lib/talking-head-orchestrator';
import type { LocalAIParticipant, Message, Avatar } from './types';

export default function App() {
  const {
    participants,
    messages,
    conversationSettings,
    isConversationActive,
    showSettings,
    showApiConfig,
    addMessage,
    updateMessage,
    clearMessages,
    updateParticipant,
    setIsConversationActive,
    setShowSettings,
    setShowApiConfig,
  } = useApp();

  const [typingParticipant, setTypingParticipant] = useState<LocalAIParticipant | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [configuringParticipant, setConfiguringParticipant] = useState<LocalAIParticipant | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);

  const synthesizerRef = useRef(new VoiceSynthesizer());
  const orchestratorRef = useRef<ConversationOrchestrator | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingParticipant]);

  const handleStartConversation = async (topic: string) => {
    if (participants.length === 0) {
      alert('Please configure at least one AI participant first!');
      setShowApiConfig(true);
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
        orchestratorRef.current?.start();
        setTimeout(() => continueConversation(), 1000);
      }
      return;
    }

    clearMessages();
    messagesRef.current = [];
    setCurrentTurn(1);
    setIsConversationActive(true);
    setIsPaused(false);

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
  };

  const continueConversation = async () => {
    if (!orchestratorRef.current) return;

    await orchestratorRef.current.getNextResponse(
      (participant) => {
        setTypingParticipant(participant);
      },
      async (participant, content) => {
        setTypingParticipant(null);

        const newMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: 'local',
          participantId: participant.id,
          senderType: 'ai',
          content,
          turnNumber: currentTurn,
          createdAt: new Date().toISOString(),
          videoStatus: participant.characterPersona?.imageUrl ? 'generating' : undefined,
        };

        messagesRef.current = [...messagesRef.current, newMessage];

        if (orchestratorRef.current) {
          orchestratorRef.current.setMessages(messagesRef.current);
        }

        addMessage(newMessage);

        updateParticipant(participant.id, {
          messageCount: participant.messageCount + 1,
        });

        if (participant.characterPersona?.imageUrl) {
          try {
            const suggestedVoice = participant.characterPersona?.voiceCharacteristics?.suggestedVoice;
            const result = await createTalkingHeadForMessage(
              participant.characterPersona.name,
              content,
              participant.characterPersona.imageUrl,
              'local',
              newMessage.id,
              (status) => {
                console.log('Talking head status:', status);
              },
              suggestedVoice
            );

            updateMessage(newMessage.id, {
              videoUrl: result.videoUrl,
              avatarUrl: result.avatarUrl,
              audioUrl: result.audioUrl,
              videoStatus: 'completed',
            });

            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error('Failed to generate talking head:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error details:', errorMessage);
            updateMessage(newMessage.id, {
              videoStatus: 'failed',
            });

            if (conversationSettings.autoPlayVoice) {
              try {
                await synthesizerRef.current.speak(content, {
                  voice: participant.voiceName || 'default',
                  rate: 0.9,
                });
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error('Voice synthesis error:', error);
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            } else {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        } else {
          if (conversationSettings.autoPlayVoice) {
            try {
              await synthesizerRef.current.speak(content, {
                voice: participant.voiceName || 'default',
                rate: 0.9,
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.error('Voice synthesis error:', error);
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        const newTurn = currentTurn + 1;
        setCurrentTurn(newTurn);

        const shouldContinue =
          conversationSettings.maxTurns === 0 || newTurn < conversationSettings.maxTurns;

        if (shouldContinue && orchestratorRef.current) {
          continueConversation();
        } else {
          handleStopConversation();
        }
      },
      (participant, error) => {
        setTypingParticipant(null);
        addMessage({
          conversationId: 'local',
          senderType: 'ai',
          content: `[Error: ${error}]`,
          turnNumber: currentTurn,
        });
        setTimeout(() => continueConversation(), 2000);
      }
    );
  };

  const handlePauseConversation = () => {
    setIsPaused(true);
    orchestratorRef.current?.pause();
  };

  const handleResumeConversation = () => {
    setIsPaused(false);
    orchestratorRef.current?.start();
    setTimeout(() => continueConversation(), 1000);
  };

  const handleStopConversation = () => {
    setIsConversationActive(false);
    setIsPaused(false);
    setTypingParticipant(null);
    orchestratorRef.current?.stop();
    orchestratorRef.current = null;
    clearMessages();
    messagesRef.current = [];
    setCurrentTurn(0);
  };

  const handleConfigure = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    if (participant) {
      setConfiguringParticipant(participant);
    }
  };

  const handleSaveConfig = (updates: Partial<LocalAIParticipant>) => {
    if (configuringParticipant) {
      updateParticipant(configuringParticipant.id, updates);
    }
  };

  const activeParticipants = participants.filter((p) => p.isActive);
  const usedAvatars = activeParticipants.map((p) => p.avatar).filter(Boolean) as Avatar[];

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-900">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: 'url(/chatgpt_image_jan_2,_2026,_12_29_46_am.png)' }}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-blue-500/30 shadow-lg shadow-blue-500/10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🎭</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                AI Council
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setShowApiConfig(true)}
                className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/50 rounded-lg transition-colors"
                title="Configure AI Participants"
              >
                <Plus size={20} />
              </button>
              <button className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/50 rounded-lg transition-colors" title="Help">
                <HelpCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {activeParticipants.length > 0 && (
        <div className="bg-gray-900/70 backdrop-blur-sm border-b border-blue-500/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
                Active Participants ({activeParticipants.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2">
                {activeParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onConfigure={() => handleConfigure(participant.id)}
                    onRemove={() => updateParticipant(participant.id, { isActive: false })}
                  />
                ))}
                <button
                  onClick={() => setShowApiConfig(true)}
                  className="border-2 border-dashed border-blue-500/30 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 text-blue-300 hover:text-blue-100 font-medium text-sm"
                >
                  <Plus size={18} />
                  Add AI
                </button>
              </div>
              {messages.length === 0 && (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-4">💭</div>
                    <h2 className="text-xl font-bold text-blue-100 mb-3 drop-shadow-lg">
                      Ready to Start
                    </h2>
                    <p className="text-base text-blue-200/90 drop-shadow">
                      Your AI council is assembled. What topic would you like them to discuss?
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConversationControls
        isActive={isConversationActive && !isPaused}
        isPaused={isPaused}
        currentTurn={currentTurn}
        maxTurns={conversationSettings.maxTurns}
        onPause={handlePauseConversation}
        onResume={handleResumeConversation}
        onStop={handleStopConversation}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {messages.length === 0 && activeParticipants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-blue-100 mb-3 drop-shadow-lg">
                Welcome to AI Council
              </h2>
              <p className="text-base text-blue-200/90 mb-6 max-w-2xl mx-auto drop-shadow">
                A sophisticated platform where multiple AI models engage in collaborative
                conversations. Configure your AI participants and start a thought-provoking
                discussion.
              </p>
              <button
                onClick={() => setShowApiConfig(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Configure Your First AI
              </button>
            </div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  synthesizer={synthesizerRef.current}
                  onEditName={handleConfigure}
                />
              ))}
              {typingParticipant && <TypingIndicator participant={typingParticipant} />}
              <div ref={messagesEndRef} />
            </>
          ) : null}
        </div>
      </main>

      <TopicInput
        onSubmit={handleStartConversation}
        disabled={activeParticipants.length === 0}
        isConversationActive={isConversationActive}
        isPaused={isPaused}
        onPause={handlePauseConversation}
        onResume={handleResumeConversation}
        onStop={handleStopConversation}
      />

      {showApiConfig && <ApiConfigModal />}
      {showSettings && <SettingsModal />}
      {configuringParticipant && (
        <ParticipantConfigModal
          isOpen={true}
          onClose={() => setConfiguringParticipant(null)}
          participant={configuringParticipant}
          allParticipants={participants}
          usedAvatars={usedAvatars}
          onSave={handleSaveConfig}
        />
      )}
      </div>
    </div>
  );
}
