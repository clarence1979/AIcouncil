import { useState, useEffect, useRef } from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import { useApp } from './context/AppContext';
import { useConversation } from './hooks/useConversation';
import { SettingsModal } from './components/SettingsModal';
import { ParticipantConfigModal } from './components/ParticipantConfigModal';
import { MessageBubble, TypingIndicator } from './components/MessageBubble';
import { TopicInput } from './components/TopicInput';
import { ConversationControls } from './components/ConversationControls';
import { ManualSpeakerSelector } from './components/ManualSpeakerSelector';
import { ConfirmDialog } from './components/ConfirmDialog';
import { StandaloneLoginForm } from './components/StandaloneLoginForm';
import { ParticipantManager, ParticipantManagerEmpty } from './components/ParticipantManager';
import { attemptAutoLogin, isInIframe } from './utils/auto-login';
import type { LocalAIParticipant, Avatar } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authUsername, setAuthUsername] = useState('');

  useEffect(() => {
    async function init() {
      if (isInIframe()) {
        const result = await attemptAutoLogin();
        if (result.authenticated) {
          setIsAuthenticated(true);
          setAuthUsername(result.username || '');
        }
      } else {
        const hasAnyKey =
          localStorage.getItem('VITE_OPENAI_API_KEY') ||
          localStorage.getItem('VITE_CLAUDE_API_KEY') ||
          localStorage.getItem('VITE_GEMINI_API_KEY');
        if (hasAnyKey) {
          setIsAuthenticated(true);
          setAuthUsername(localStorage.getItem('auth-username') || 'User');
        }
      }
      setIsAuthLoading(false);
    }
    init();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-300 text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <StandaloneLoginForm
        onLogin={(username) => {
          localStorage.setItem('auth-username', username);
          setIsAuthenticated(true);
          setAuthUsername(username);
        }}
      />
    );
  }

  return <MainApp username={authUsername} />;
}

function MainApp({ username }: { username: string }) {
  const {
    participants,
    messages,
    conversationSettings,
    isConversationActive,
    showSettings,
    updateParticipant,
    setShowSettings,
  } = useApp();

  const {
    typingParticipant,
    isPaused,
    currentTurn,
    awaitingManualSelection,
    synthesizer,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleClear,
    handleDownloadTranscript,
    handleDownloadSummary,
    selectManualSpeaker,
  } = useConversation();

  const [configuringParticipant, setConfiguringParticipant] = useState<LocalAIParticipant | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingParticipant]);

  const handleConfigure = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    if (participant) setConfiguringParticipant(participant);
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
              <div className="flex items-center gap-6">
                <a
                  href="https://digitalvector.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img src="/digivec_logo.png" alt="Digital Vector" className="h-16" />
                </a>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🎭</div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                    AI Council
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {username && (
                  <span className="text-sm text-blue-300/70 hidden sm:block">
                    {username}
                  </span>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/50 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
                <button
                  className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/50 rounded-lg transition-colors"
                  title="Help"
                >
                  <HelpCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <ParticipantManager onConfigure={handleConfigure} />

        <ConversationControls
          isActive={isConversationActive && !isPaused}
          isPaused={isPaused}
          currentTurn={currentTurn}
          maxTurns={conversationSettings.maxTurns}
          hasMessages={messages.length > 0}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onClear={() => setShowClearConfirm(true)}
          onDownloadTranscript={handleDownloadTranscript}
          onDownloadSummary={handleDownloadSummary}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {messages.length === 0 && activeParticipants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎭</div>
                <h2 className="text-2xl font-bold text-blue-100 mb-3 drop-shadow-lg">
                  Welcome to AI Council
                </h2>
                <p className="text-base text-blue-200/90 mb-8 max-w-2xl mx-auto drop-shadow">
                  A sophisticated platform where multiple AI models engage in collaborative
                  conversations. Add your first AI participant to get started.
                </p>
                <div className="max-w-xs mx-auto">
                  <ParticipantManagerEmpty />
                </div>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    synthesizer={synthesizer}
                    onEditName={handleConfigure}
                  />
                ))}
                {typingParticipant && <TypingIndicator participant={typingParticipant} />}
                {awaitingManualSelection && !typingParticipant && (
                  <ManualSpeakerSelector
                    participants={activeParticipants}
                    onSelect={selectManualSpeaker}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            ) : null}
          </div>
        </main>

        <TopicInput
          onSubmit={handleStart}
          disabled={activeParticipants.length === 0}
          isConversationActive={isConversationActive}
        />

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
        <ConfirmDialog
          isOpen={showClearConfirm}
          title="Clear Chat"
          message="Are you sure you want to clear the entire chat? This cannot be undone."
          confirmLabel="Clear"
          onConfirm={() => {
            handleClear();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      </div>
    </div>
  );
}
