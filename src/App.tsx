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

  const [configuringParticipantId, setConfiguringParticipantId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingParticipant]);

  const configuringParticipant = configuringParticipantId
    ? participants.find((p) => p.id === configuringParticipantId) ?? null
    : null;

  const handleConfigure = (participantId: string) => {
    setConfiguringParticipantId(participantId);
  };

  const handleSaveConfig = (updates: Partial<LocalAIParticipant>) => {
    if (configuringParticipantId) {
      updateParticipant(configuringParticipantId, updates);
    }
  };

  const activeParticipants = participants.filter((p) => p.isActive);
  const usedAvatars = activeParticipants.map((p) => p.avatar).filter(Boolean) as Avatar[];

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,163,127,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(230,126,34,0.10) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 100% 80%, rgba(66,133,244,0.10) 0%, transparent 55%), radial-gradient(ellipse 100% 100% at 50% 50%, rgba(3,7,18,0.6) 0%, transparent 100%)',
        }} />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="bg-gemini-grad" x1="0.573" y1="0.057" x2="0.426" y2="0.943" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#1aa4f5" stopOpacity="0.18" />
              <stop offset="1" stopColor="#1a6bf5" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          <g transform="translate(120, 150) scale(0.55)" opacity="0.22" filter="url(#glow-green)">
            <path
              d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.224-3.735 10.079 10.079 0 0 0-11.298 4.96 9.964 9.964 0 0 0-6.675 4.813 10.079 10.079 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.224 3.735 10.079 10.079 0 0 0 11.298-4.961 9.965 9.965 0 0 0 6.675-4.813 10.079 10.079 0 0 0-1.24-11.816zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103L16.4 34.494a7.505 7.505 0 0 1-10.008-3.488zm-1.32-17.48A7.472 7.472 0 0 1 9.08 9.99l-.001.252v9.202a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L8.2 23.94a7.505 7.505 0 0 1-3.128-10.414zm27.688 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l7.775 4.99a7.505 7.505 0 0 1-1.168 13.528v-9.452a1.293 1.293 0 0 0-.364-.496zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l7.859-4.384a7.504 7.504 0 0 1 11.325 6.502zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.505 7.505 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V18.906z"
              fill="#10A37F"
              transform="scale(8)"
            />
          </g>

          <g transform="translate(640, 200) scale(0.55)" opacity="0.20" filter="url(#glow-orange)">
            <path
              d="M32.73 0h-6.945L38.45 32h6.945L32.73 0zM12.665 0L0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264zm-.702 19.337 4.334-11.246 4.334 11.246H11.963z"
              fill="#E67E22"
              transform="scale(10)"
            />
          </g>

          <g transform="translate(1100, 60) scale(0.55)" opacity="0.20" filter="url(#glow-blue)">
            <path
              d="M96 180c-4.4-16.7-9.4-31.8-16.4-44.8C71.6 121.2 61 109 47 97.6 33 86.2 18.8 78.8 0 75.4c18.4-2 32.8-6.6 47.4-17 14.6-10.4 25-25.4 35.4-42.4C90.2 8.6 92.8 0 96 0c3.2 0 5.8 8.6 13.2 16C120 32 130.4 47 145 57.4c14.6 10.4 29 15 47.4 17-18.8 3.4-33 10.8-47 22.2-14 11.4-24.6 23.6-32.6 37.6-7 13-12 28.1-16.4 44.8H96z"
              fill="url(#bg-gemini-grad)"
              transform="scale(2)"
            />
          </g>

          <circle cx="300" cy="700" r="300" fill="rgba(16,163,127,0.04)" />
          <circle cx="1200" cy="300" r="250" fill="rgba(66,133,244,0.04)" />
          <circle cx="750" cy="900" r="200" fill="rgba(230,126,34,0.04)" />
        </svg>
      </div>
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
            onClose={() => setConfiguringParticipantId(null)}
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
