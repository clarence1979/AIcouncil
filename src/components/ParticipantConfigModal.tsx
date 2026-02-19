import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Sparkles, Volume2 } from 'lucide-react';
import type { LocalAIParticipant, Avatar, Personality, CharacterPersona } from '../types';
import { AI_VOICES } from '../types';
import { AI_PROVIDERS } from '../lib/ai-clients';
import { useToast } from './Toast';

interface ParticipantConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: LocalAIParticipant;
  allParticipants: LocalAIParticipant[];
  usedAvatars: Avatar[];
  onSave: (updates: Partial<LocalAIParticipant>) => void;
}

type TabType = 'basic' | 'personality' | 'voice';

const PERSONALITIES: { value: Personality; label: string; description: string }[] = [
  { value: 'analytical', label: 'Analytical', description: 'Data-driven, logical, precise' },
  { value: 'creative', label: 'Creative', description: 'Imaginative, unconventional, artistic' },
  { value: 'sarcastic', label: 'Sarcastic', description: 'Witty, ironic, sharp-tongued' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic, optimistic, passionate' },
  { value: 'skeptical', label: 'Skeptical', description: 'Questioning, critical, cautious' },
  { value: 'philosophical', label: 'Philosophical', description: 'Contemplative, deep, abstract' },
  { value: 'pragmatic', label: 'Pragmatic', description: 'Practical, realistic, solution-focused' },
  { value: 'witty', label: 'Witty', description: 'Clever, humorous, quick-thinking' },
];

const AVATARS: Avatar[] = ['🤖', '👨‍💻', '👩‍🔬', '🧠', '🎭', '🦉', '🦊', '🐺', '🐉', '⚡', '🔮', '💎'];

const EXAMPLE_CHARACTERS = [
  { name: 'Albert Einstein', category: 'Scientists' },
  { name: 'Marie Curie', category: 'Scientists' },
  { name: 'Carl Sagan', category: 'Scientists' },
  { name: 'Socrates', category: 'Philosophers' },
  { name: 'Friedrich Nietzsche', category: 'Philosophers' },
  { name: 'Confucius', category: 'Philosophers' },
  { name: 'Sherlock Holmes', category: 'Fictional' },
  { name: 'Yoda', category: 'Fictional' },
  { name: 'Tony Stark', category: 'Fictional' },
  { name: 'William Shakespeare', category: 'Writers' },
  { name: 'Mark Twain', category: 'Writers' },
  { name: 'Oscar Wilde', category: 'Writers' },
  { name: 'Winston Churchill', category: 'Leaders' },
  { name: 'Marcus Aurelius', category: 'Leaders' },
  { name: 'Nelson Mandela', category: 'Leaders' },
];

export function ParticipantConfigModal({
  isOpen,
  onClose,
  participant,
  allParticipants,
  usedAvatars,
  onSave,
}: ParticipantConfigModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    customName: participant.customName || '',
    provider: participant.provider,
    apiKey: participant.apiKey,
    model: participant.model,
  });
  const [characterName, setCharacterName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customTraits, setCustomTraits] = useState('');
  const [researchingCharacter, setResearchingCharacter] = useState(false);
  const [tempCharacterPersona, setTempCharacterPersona] = useState<CharacterPersona | null>(null);
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  const providerInfo = AI_PROVIDERS[formData.provider as keyof typeof AI_PROVIDERS];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        customName: participant.customName || '',
        provider: participant.provider,
        apiKey: participant.apiKey,
        model: participant.model,
      });
      setCharacterName(participant.characterPersona?.name || '');
      setTempCharacterPersona(participant.characterPersona || null);
      setTempAvatarUrl(participant.avatarUrl || null);
      setCustomDescription('');
      setCustomTraits('');
    } else {
      setTempAvatarUrl(null);
      setTempCharacterPersona(null);
    }
  }, [isOpen]);

  const handleProviderChange = (newProvider: string) => {
    const newProviderInfo = AI_PROVIDERS[newProvider as keyof typeof AI_PROVIDERS];
    setFormData({
      ...formData,
      provider: newProvider as LocalAIParticipant['provider'],
      model: newProviderInfo.models[0].id,
    });
  };

  const handleResearchCharacter = async (name: string, useCustom: boolean = false) => {
    if (!name?.trim()) return;

    const openaiParticipant = allParticipants.find(p => p.provider === 'openai' && p.apiKey);
    const apiKey = openaiParticipant?.apiKey;

    if (!apiKey) {
      toast.warning('OpenAI API key is required for character research. Configure an OpenAI participant first.');
      return;
    }

    setResearchingCharacter(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const body: Record<string, unknown> = {
        characterName: name.trim(),
        apiKey,
      };

      if (useCustom && customDescription) {
        body.customDescription = customDescription;
      }
      if (useCustom && customTraits) {
        body.customTraits = customTraits.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/character-research`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Character research failed');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const characterPersona: CharacterPersona = {
        name: result.name,
        description: result.description,
        traits: result.traits,
        speakingStyle: result.speakingStyle,
        catchphrases: result.catchphrases,
        mannerisms: result.mannerisms,
        imageUrl: result.imageUrl,
        voiceCharacteristics: result.voiceCharacteristics,
      };

      setTempCharacterPersona(characterPersona);
      if (result.imageUrl) {
        setTempAvatarUrl(result.imageUrl);
      }
    } catch (error) {
      console.error('Character research error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to research character. Please try again.');
    } finally {
      setResearchingCharacter(false);
    }
  };

  const handleTestVoice = async (voiceId: string) => {
    setTestingVoice(voiceId);

    try {
      const openaiParticipant = allParticipants.find(p => p.provider === 'openai' && p.apiKey);
      const apiKey = openaiParticipant?.apiKey;

      if (!apiKey) {
        toast.warning('OpenAI API key required for voice preview.');
        setTestingVoice(null);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/openai-tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Hello! I am ${participant.customName || participant.defaultName}. This is how I sound when speaking in conversations.`,
          voice: voiceId,
          speed: 1.0,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setTestingVoice(null);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setTestingVoice(null);
      };

      await audio.play();
    } catch (error) {
      console.error('Voice preview error:', error);
      setTestingVoice(null);
    }
  };

  const handleSaveBasic = () => {
    const updates: any = { ...formData };
    if (formData.provider !== participant.provider) {
      const newProviderInfo = AI_PROVIDERS[formData.provider as keyof typeof AI_PROVIDERS];
      updates.defaultName = newProviderInfo.name;
      updates.color = newProviderInfo.color;
    }
    onSave(updates);
    onClose();
  };

  const handleSavePersonality = (updates: { personality?: Personality; avatar?: Avatar; characterPersona?: CharacterPersona | null; avatarUrl?: string | null }) => {
    const updatesToSave: any = { ...updates };

    if (updates.characterPersona?.voiceCharacteristics?.suggestedVoice) {
      updatesToSave.voiceName = updates.characterPersona.voiceCharacteristics.suggestedVoice;
    }

    onSave(updatesToSave);
    if (updates.characterPersona !== undefined) {
      setTempCharacterPersona(updates.characterPersona);
    }
    if (updates.avatarUrl !== undefined) {
      setTempAvatarUrl(updates.avatarUrl);
    }
  };

  const handleSaveVoice = (voiceName: string) => {
    onSave({ voiceName });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-blue-500/30 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 border-b border-blue-500/20 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-100">Configure {participant.customName || participant.defaultName}</h2>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-blue-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-blue-500/20">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-4 px-6 font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'basic'
                ? 'bg-blue-600/20 text-blue-100 border-b-2 border-blue-500'
                : 'text-blue-400 hover:bg-blue-900/20'
            }`}
          >
            <User size={18} />
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('personality')}
            className={`flex-1 py-4 px-6 font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'personality'
                ? 'bg-blue-600/20 text-blue-100 border-b-2 border-blue-500'
                : 'text-blue-400 hover:bg-blue-900/20'
            }`}
          >
            <Sparkles size={18} />
            Personality
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-4 px-6 font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'voice'
                ? 'bg-blue-600/20 text-blue-100 border-b-2 border-blue-500'
                : 'text-blue-400 hover:bg-blue-900/20'
            }`}
          >
            <Volume2 size={18} />
            Voice
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Custom Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  placeholder={providerInfo.name}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  AI Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                    <option key={key} value={key}>
                      {provider.icon} {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Model
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {providerInfo.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="w-full px-4 py-2 pr-12 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveBasic}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'personality' && (
            <div className="space-y-6">
              {!tempCharacterPersona ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-100 mb-3">Choose Personality</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PERSONALITIES.map((personality) => (
                        <button
                          key={personality.value}
                          onClick={() => {
                            handleSavePersonality({ personality: personality.value });
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            participant.personality === personality.value && !participant.characterPersona
                              ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20'
                              : 'border-blue-500/20 bg-gray-800/50 hover:border-blue-400/50 hover:bg-gray-800'
                          }`}
                        >
                          <div className="font-semibold text-blue-100 mb-1">{personality.label}</div>
                          <div className="text-xs text-blue-300/70">{personality.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-blue-100 mb-3">Choose Avatar</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {AVATARS.map((avatar) => {
                        const isUsed = usedAvatars.includes(avatar) && avatar !== participant.avatar;
                        return (
                          <button
                            key={avatar}
                            onClick={() => {
                              if (!isUsed) {
                                handleSavePersonality({ avatar });
                              }
                            }}
                            disabled={isUsed}
                            className={`aspect-square rounded-xl border-2 text-4xl flex items-center justify-center transition-all ${
                              participant.avatar === avatar
                                ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20 scale-110'
                                : isUsed
                                ? 'border-gray-700 bg-gray-800/30 opacity-40 cursor-not-allowed'
                                : 'border-blue-500/20 bg-gray-800/50 hover:border-blue-400/50 hover:bg-gray-800 hover:scale-105'
                            }`}
                          >
                            {avatar}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-blue-300/60 mt-2">Grayed out avatars are already in use</p>
                  </div>

                  <div className="border-t border-blue-500/20 pt-6">
                    <h3 className="text-lg font-semibold text-purple-100 mb-3">Or Add Character Persona</h3>
                    <p className="text-sm text-purple-300/70 mb-4">
                      Give your AI a specific character personality with auto-generated image
                    </p>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-purple-200 mb-2">Quick Select</h4>
                        <div className="space-y-3">
                          {Array.from(new Set(EXAMPLE_CHARACTERS.map(c => c.category))).map(category => (
                            <div key={category}>
                              <h5 className="text-xs font-medium text-purple-300 mb-2">{category}</h5>
                              <div className="flex flex-wrap gap-2">
                                {EXAMPLE_CHARACTERS.filter(c => c.category === category).map(char => (
                                  <button
                                    key={char.name}
                                    onClick={() => {
                                      setCharacterName(char.name);
                                      handleResearchCharacter(char.name);
                                    }}
                                    disabled={researchingCharacter}
                                    className="px-3 py-1.5 bg-purple-900/30 border border-purple-500/30 rounded-lg text-sm text-purple-100 hover:bg-purple-800/40 hover:border-purple-400/50 transition-all disabled:opacity-50"
                                  >
                                    {char.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-purple-500/20 pt-4">
                        <h4 className="text-sm font-medium text-purple-200 mb-2">Custom Character</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            placeholder="Character name (e.g., Nikola Tesla, Gandalf)"
                            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />

                          <textarea
                            value={customDescription}
                            onChange={(e) => setCustomDescription(e.target.value)}
                            placeholder="Custom description (optional)"
                            rows={2}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />

                          <input
                            type="text"
                            value={customTraits}
                            onChange={(e) => setCustomTraits(e.target.value)}
                            placeholder="Custom traits (optional, comma-separated)"
                            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />

                          <button
                            onClick={() => handleResearchCharacter(characterName, !!(customDescription || customTraits))}
                            disabled={!characterName.trim() || researchingCharacter}
                            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Sparkles size={18} />
                            {researchingCharacter ? 'Researching & Generating Image...' : 'Research Character'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-purple-900/20 border-2 border-purple-500/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    {(tempAvatarUrl || tempCharacterPersona.imageUrl) && (
                      <img
                        src={tempAvatarUrl || tempCharacterPersona.imageUrl}
                        alt={tempCharacterPersona.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-purple-400/50 shadow-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-purple-100 mb-2">
                        {tempCharacterPersona.name}
                      </h3>
                      <p className="text-sm text-purple-200 mb-3">
                        {tempCharacterPersona.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tempCharacterPersona.traits.map((trait: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-700/30 text-purple-200 px-3 py-1 rounded-full border border-purple-500/30"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {tempCharacterPersona.voiceCharacteristics && (
                    <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/20">
                      <h4 className="text-sm font-semibold text-purple-100 mb-2">Voice Profile</h4>
                      <div className="space-y-2 text-xs text-purple-200">
                        <div className="flex gap-4">
                          <span className="text-purple-300">Gender:</span>
                          <span className="capitalize">{tempCharacterPersona.voiceCharacteristics.gender}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-purple-300">Age:</span>
                          <span className="capitalize">{tempCharacterPersona.voiceCharacteristics.ageRange}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-purple-300">Accent:</span>
                          <span>{tempCharacterPersona.voiceCharacteristics.accent}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-purple-300">Voice:</span>
                          <span className="capitalize">{tempCharacterPersona.voiceCharacteristics.suggestedVoice}</span>
                        </div>
                        <p className="text-purple-300/80 italic mt-2">{tempCharacterPersona.voiceCharacteristics.reasoning}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-purple-500/20">
                    <button
                      onClick={() => {
                        handleSavePersonality({
                          characterPersona: tempCharacterPersona,
                          avatarUrl: tempAvatarUrl || participant.avatarUrl
                        });
                        onClose();
                      }}
                      className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Save Character
                    </button>
                    <button
                      onClick={() => {
                        handleSavePersonality({ characterPersona: null, avatarUrl: null });
                        setTempCharacterPersona(null);
                        setTempAvatarUrl(null);
                      }}
                      className="flex-1 py-3 px-4 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Remove Character
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-100 mb-3">AI Voice (Powered by OpenAI)</h3>
              <div className="space-y-2">
                {AI_VOICES.map((voice) => (
                  <div
                    key={voice.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      participant.voiceName === voice.id
                        ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20'
                        : 'border-blue-500/20 bg-gray-800/50 hover:border-blue-400/50 hover:bg-gray-800'
                    }`}
                    onClick={() => handleSaveVoice(voice.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-100 mb-1">{voice.name}</div>
                        <div className="text-sm text-blue-300/70">{voice.description}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(voice.id);
                        }}
                        disabled={testingVoice === voice.id}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        {testingVoice === voice.id ? 'Playing...' : 'Preview'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-300/60 mt-2">
                Professional AI voices from OpenAI. Each has a unique personality!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
