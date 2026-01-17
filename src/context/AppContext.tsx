import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { LocalAIParticipant, Message, ConversationSettings } from '../types';

interface AppContextType {
  participants: LocalAIParticipant[];
  messages: Message[];
  currentConversationId: string | null;
  conversationSettings: ConversationSettings;
  isConversationActive: boolean;
  showSettings: boolean;
  showApiConfig: boolean;
  addParticipant: (participant: LocalAIParticipant) => void;
  updateParticipant: (id: string, updates: Partial<LocalAIParticipant>) => void;
  removeParticipant: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'> | Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<ConversationSettings>) => void;
  setIsConversationActive: (active: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowApiConfig: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [participants, setParticipants] = useState<LocalAIParticipant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [conversationSettings, setConversationSettings] = useState<ConversationSettings>({
    turnMode: 'sequential',
    conversationStyle: 'discussion',
    maxTurns: 0,
    autoPlayVoice: true,
    responseLength: 500,
    enableTalkingHeads: false,
  });

  useEffect(() => {
    const modelMigrationMap: Record<string, string> = {
      'claude-3-5-sonnet-20241022': 'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20240620': 'claude-sonnet-4-20250514',
      'claude-3-opus-20240229': 'claude-opus-4-20250514',
      'claude-3-sonnet-20240229': 'claude-sonnet-4-20250514',
      'claude-3-haiku-20240307': 'claude-haiku-4-20250514',
      'gemini-pro': 'gemini-2.5-flash',
      'gemini-1.5-pro-latest': 'gemini-2.5-flash',
      'gemini-1.5-pro': 'gemini-2.5-flash',
      'gemini-1.5-flash': 'gemini-2.5-flash',
    };

    const availableAvatars = ['🤖', '👨‍💻', '👩‍🔬', '🧠', '🎭', '🦉', '🦊', '🐺', '🐉', '⚡', '🔮', '💎'];
    const availablePersonalities = ['analytical', 'creative', 'sarcastic', 'enthusiastic', 'skeptical', 'philosophical', 'pragmatic', 'witty'];
    const availableVoices = ['nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx'];

    const savedParticipants = localStorage.getItem('ai-participants');
    if (savedParticipants) {
      const parsed = JSON.parse(savedParticipants);
      const usedAvatars = new Set<string>();
      const usedVoices = new Set<string>();

      const migrated = parsed.map((p: LocalAIParticipant, index: number) => {
        const updatedModel = modelMigrationMap[p.model] || p.model;
        const needsAvatar = !p.avatar;
        const needsPersonality = !p.personality;

        let avatar = p.avatar;
        if (needsAvatar) {
          avatar = availableAvatars.find(a => !usedAvatars.has(a)) || '🤖';
        }
        usedAvatars.add(avatar);

        let voiceName = p.voiceName;
        if (!voiceName || voiceName === 'default' || !availableVoices.includes(voiceName)) {
          voiceName = availableVoices.find(v => !usedVoices.has(v)) || 'alloy';
        }
        usedVoices.add(voiceName);

        return {
          ...p,
          model: updatedModel,
          personality: needsPersonality ? availablePersonalities[index % availablePersonalities.length] : p.personality,
          avatar,
          voiceName,
        };
      });
      setParticipants(migrated);
      localStorage.setItem('ai-participants', JSON.stringify(migrated));
    }

    const savedSettings = localStorage.getItem('conversation-settings');
    if (savedSettings) {
      setConversationSettings(JSON.parse(savedSettings));
    }
  }, []);

  const addParticipant = (participant: LocalAIParticipant) => {
    const updated = [...participants, participant];
    setParticipants(updated);
    localStorage.setItem('ai-participants', JSON.stringify(updated));
  };

  const updateParticipant = (id: string, updates: Partial<LocalAIParticipant>) => {
    const updated = participants.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setParticipants(updated);
    localStorage.setItem('ai-participants', JSON.stringify(updated));
  };

  const removeParticipant = (id: string) => {
    const updated = participants.filter(p => p.id !== id);
    setParticipants(updated);
    localStorage.setItem('ai-participants', JSON.stringify(updated));
  };

  const addMessage = (message: Omit<Message, 'id' | 'createdAt'> | Message) => {
    if ('id' in message && 'createdAt' in message) {
      setMessages(prev => [...prev, message as Message]);
    } else {
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const updateSettings = (settings: Partial<ConversationSettings>) => {
    const updated = { ...conversationSettings, ...settings };
    setConversationSettings(updated);
    localStorage.setItem('conversation-settings', JSON.stringify(updated));
  };

  return (
    <AppContext.Provider
      value={{
        participants,
        messages,
        currentConversationId,
        conversationSettings,
        isConversationActive,
        showSettings,
        showApiConfig,
        addParticipant,
        updateParticipant,
        removeParticipant,
        addMessage,
        updateMessage,
        clearMessages,
        updateSettings,
        setIsConversationActive,
        setShowSettings,
        setShowApiConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
