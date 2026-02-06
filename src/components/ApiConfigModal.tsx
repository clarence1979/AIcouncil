import { useState } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle, Sparkles } from 'lucide-react';
import { AI_PROVIDERS, createAIClient } from '../lib/ai-clients';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import type { LocalAIParticipant, Avatar, Personality, CharacterPersona } from '../types';
import { AI_VOICES } from '../types';

const AVAILABLE_AVATARS: Avatar[] = ['🤖', '👨‍💻', '👩‍🔬', '🧠', '🎭', '🦉', '🦊', '🐺', '🐉', '⚡', '🔮', '💎'];
const AVAILABLE_PERSONALITIES: Personality[] = ['analytical', 'creative', 'sarcastic', 'enthusiastic', 'skeptical', 'philosophical', 'pragmatic', 'witty'];

export function ApiConfigModal() {
  const { participants, addParticipant, updateParticipant, removeParticipant, setShowApiConfig } = useApp();
  const toast = useToast();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [researchingCharacter, setResearchingCharacter] = useState<Record<string, boolean>>({});
  const [characterName, setCharacterName] = useState<Record<string, string>>({});


  const handleResearchCharacter = async (provider: string) => {
    const name = characterName[provider];
    if (!name?.trim()) return;

    const currentFormData = formData[provider];
    const openaiParticipant = participants.find(p => p.provider === 'openai');
    const apiKey = provider === 'openai' && currentFormData?.apiKey
      ? currentFormData.apiKey
      : openaiParticipant?.apiKey;

    if (!apiKey) {
      toast.warning('OpenAI API key is required for character research. Please configure an OpenAI participant first.');
      return;
    }

    setResearchingCharacter({ ...researchingCharacter, [provider]: true });

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a character research assistant. Return a JSON object with this exact structure:
{
  "name": "character name",
  "description": "brief description",
  "traits": ["trait1", "trait2", "trait3"],
  "speakingStyle": "description of how they speak",
  "catchphrases": ["phrase1", "phrase2"],
  "mannerisms": ["mannerism1", "mannerism2"]
}`,
        },
        {
          role: 'user',
          content: `Research the character "${name.trim()}" and provide detailed information about their personality, traits, speaking style, catchphrases, and mannerisms.`,
        },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error('Character research failed');
      }

      const data = await response.json();
      let characterPersona: CharacterPersona = JSON.parse(data.choices[0].message.content);

      let avatarUrl = currentFormData.avatarUrl;

      try {
        const imagePrompt = `A professional portrait photo of ${name.trim()}, ${characterPersona.description}. High quality, clear face, neutral background, photorealistic.`;

        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          avatarUrl = imageData.data[0].url;
          characterPersona = { ...characterPersona, imageUrl: avatarUrl };
        } else {
          const errorData = await imageResponse.json();
          console.error('Avatar generation failed:', errorData);
          toast.error(`Avatar generation failed: ${errorData.error?.message || 'Unknown error'}`);
        }
      } catch (imageError) {
        console.error('Avatar generation error:', imageError);
        toast.error(`Avatar generation error: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
      }

      setFormData({
        ...formData,
        [provider]: {
          ...currentFormData,
          characterPersona,
          avatarUrl,
        },
      });
    } catch (error) {
      console.error('Character research error:', error);
      toast.error('Failed to research character. Please try again.');
    } finally {
      setResearchingCharacter({ ...researchingCharacter, [provider]: false });
    }
  };

  const handleTestVoice = async (provider: string, voiceId: string) => {
    const providerInfo = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
    setTestingVoice(voiceId);

    try {
      const openaiParticipant = participants.find(p => p.provider === 'openai');
      const currentFormData = formData[provider];
      const apiKey = provider === 'openai' && currentFormData?.apiKey
        ? currentFormData.apiKey
        : openaiParticipant?.apiKey;

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: `Hello! I am ${providerInfo.name}. This is how I sound when speaking in conversations.`,
          voice: voiceId,
          speed: 1.0,
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

  const handleProviderClick = (provider: string, participantId?: string) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
    setEditingParticipantId(participantId || null);
    const providerInfo = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];

    if (participantId) {
      const existing = participants.find(p => p.id === participantId);
      if (existing) {
        setFormData({
          ...formData,
          [provider]: {
            apiKey: existing.apiKey,
            model: existing.model,
            customName: existing.customName || '',
            voiceName: existing.voiceName || 'alloy',
            characterPersona: existing.characterPersona,
          },
        });
        if (existing.characterPersona) {
          setCharacterName({ ...characterName, [provider]: existing.characterPersona.name });
        }
      }
    } else if (!formData[provider]) {
      setFormData({
        ...formData,
        [provider]: {
          apiKey: '',
          model: providerInfo.models[0].id,
          customName: '',
          voiceName: 'alloy',
          characterPersona: undefined,
        },
      });
    }
  };

  const handleTestConnection = async (provider: string) => {
    const data = formData[provider];
    if (!data?.apiKey) return;

    setTesting({ ...testing, [provider]: true });
    try {
      const client = createAIClient(provider, data.apiKey);
      const result = await client.testConnection();
      setTestResults({ ...testResults, [provider]: result });
    } catch {
      setTestResults({ ...testResults, [provider]: false });
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  const getNextAvailableAvatar = (): Avatar => {
    const usedAvatars = participants.filter(p => p.isActive).map(p => p.avatar).filter(Boolean);
    const available = AVAILABLE_AVATARS.find(avatar => !usedAvatars.includes(avatar));
    return available || '🤖';
  };

  const getRandomPersonality = (): Personality => {
    return AVAILABLE_PERSONALITIES[Math.floor(Math.random() * AVAILABLE_PERSONALITIES.length)];
  };

  const handleSave = (provider: string) => {
    const data = formData[provider];
    if (!data?.apiKey || !data?.model) return;

    const providerInfo = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];

    if (editingParticipantId) {
      updateParticipant(editingParticipantId, {
        apiKey: data.apiKey,
        model: data.model,
        customName: data.customName || undefined,
        voiceName: data.voiceName || 'alloy',
        characterPersona: data.characterPersona,
        avatarUrl: data.avatarUrl,
      });
    } else {
      const newParticipant: LocalAIParticipant = {
        id: crypto.randomUUID(),
        provider: provider as any,
        model: data.model,
        customName: data.customName || undefined,
        defaultName: providerInfo.name,
        color: providerInfo.color,
        apiKey: data.apiKey,
        voiceName: data.voiceName || 'alloy',
        personality: getRandomPersonality(),
        avatar: getNextAvailableAvatar(),
        avatarUrl: data.avatarUrl,
        characterPersona: data.characterPersona,
        config: {
          temperature: 0.7,
          maxTokens: 500,
        },
        isActive: true,
        messageCount: 0,
      };
      addParticipant(newParticipant);
    }

    setJustSaved(provider);
    setTimeout(() => {
      setJustSaved(null);
      setExpandedProvider(null);
      setEditingParticipantId(null);
      setTestResults({ ...testResults, [provider]: null });
    }, 1500);
  };

  const handleRemove = (participantId: string, provider: string) => {
    removeParticipant(participantId);
    if (editingParticipantId === participantId) {
      setEditingParticipantId(null);
      setFormData({ ...formData, [provider]: undefined });
      setTestResults({ ...testResults, [provider]: null });
    }
  };

  const getProviderParticipants = (provider: string) => {
    return participants.filter(p => p.provider === provider && p.isActive);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-blue-500/30 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20">
          <h2 className="text-2xl font-bold text-blue-100">Configure AI Participants</h2>
          <button
            onClick={() => setShowApiConfig(false)}
            className="text-blue-300 hover:text-blue-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.entries(AI_PROVIDERS).map(([key, provider], index) => {
            const providerParticipants = getProviderParticipants(key);
            const expanded = expandedProvider === key;
            const data = formData[key] || {};
            const testResult = testResults[key];

            return (
              <div key={key}>
                {index > 0 && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-blue-500/20"></div>
                    </div>
                  </div>
                )}
                <div
                  className="border border-blue-500/20 rounded-xl overflow-hidden transition-all hover:border-blue-500/40"
                >
                <div className="p-4 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: provider.color + '20' }}
                      >
                        {provider.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-blue-100">{provider.name}</h3>
                        <p className="text-sm text-blue-300/60">
                          {provider.models.map(m => m.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {providerParticipants.length > 0 && (
                        <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                          <Check size={16} /> {providerParticipants.length} Active
                        </span>
                      )}
                      {providerParticipants.length === 0 && (
                        <span className="text-sm text-blue-400/50">Not Configured</span>
                      )}
                    </div>
                  </div>

                  {providerParticipants.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {providerParticipants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{participant.avatar}</span>
                            <span className="text-sm font-medium text-blue-100">
                              {participant.customName || participant.defaultName}
                            </span>
                            <span className="text-xs text-blue-300/60">({participant.model})</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleProviderClick(key, participant.id)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemove(participant.id, key)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleProviderClick(key)}
                    className="mt-3 w-full px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                  >
                    + Add {providerParticipants.length > 0 ? 'Another' : 'New'} {provider.name} Participant
                  </button>
                </div>

                {expanded && (
                  <div className="p-4 bg-gray-800/30 border-t border-blue-500/20 space-y-4">
                    {justSaved === key && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 animate-fadeIn">
                        <Check size={18} className="flex-shrink-0" />
                        <span className="text-sm font-semibold">
                          Successfully saved! AI added to your council.
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey[key] ? 'text' : 'password'}
                          value={data.apiKey || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: { ...data, apiKey: e.target.value },
                            })
                          }
                          placeholder="Enter your API key"
                          className="w-full px-4 py-2 pr-10 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() =>
                            setShowApiKey({ ...showApiKey, [key]: !showApiKey[key] })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300"
                        >
                          {showApiKey[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Model
                      </label>
                      <select
                        value={data.model || provider.models[0].id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [key]: { ...data, model: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {provider.models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Custom Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={data.customName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [key]: { ...data, customName: e.target.value },
                          })
                        }
                        placeholder={`e.g., The ${provider.name} Philosopher`}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        AI Voice (Powered by OpenAI)
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {AI_VOICES.map((voice) => (
                          <div
                            key={voice.id}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              data.voiceName === voice.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-blue-500/20 bg-gray-800/30 hover:border-blue-400/50'
                            }`}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                [key]: { ...data, voiceName: voice.id },
                              })
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-blue-100">{voice.name}</div>
                                <div className="text-sm text-blue-300/70">{voice.description}</div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestVoice(key, voice.id);
                                }}
                                disabled={testingVoice === voice.id}
                                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium disabled:opacity-50"
                              >
                                {testingVoice === voice.id ? '🎧 Playing...' : '🎧 Preview'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-300/50 mt-2">
                        Professional AI voices from OpenAI. Each has a unique personality!
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Character Persona (Optional)
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        Give your AI a specific character personality with auto-generated image
                      </p>

                      {!data.characterPersona && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={characterName[key] || ''}
                              onChange={(e) =>
                                setCharacterName({ ...characterName, [key]: e.target.value })
                              }
                              placeholder="e.g., Albert Einstein, Sherlock Holmes, Yoda"
                              className="flex-1 px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => handleResearchCharacter(key)}
                              disabled={!characterName[key]?.trim() || researchingCharacter[key]}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Sparkles size={16} />
                              {researchingCharacter[key] ? 'Researching...' : 'Research'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Uses OpenAI to research character traits and generate an AI portrait
                          </p>
                        </div>
                      )}

                      {data.characterPersona && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            {data.characterPersona.imageUrl && (
                              <img
                                src={data.characterPersona.imageUrl}
                                alt={data.characterPersona.name}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-purple-300"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-purple-900 mb-1">
                                {data.characterPersona.name}
                              </h4>
                              <p className="text-sm text-purple-800 mb-2">
                                {data.characterPersona.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {data.characterPersona.traits.map((trait: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full"
                                  >
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                [key]: { ...data, characterPersona: undefined },
                              });
                              setCharacterName({ ...characterName, [key]: '' });
                            }}
                            className="w-full text-sm text-purple-700 hover:text-purple-900 font-medium"
                          >
                            Remove Character
                          </button>
                        </div>
                      )}
                    </div>

                    {testResult !== null && (
                      <div
                        className={`flex items-start gap-2 p-3 rounded-lg ${
                          testResult
                            ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-900/30 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {testResult ? (
                          <>
                            <Check size={18} className="mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm font-semibold mb-1">
                                Connection successful!
                              </div>
                              <div className="text-xs text-emerald-400">
                                Now click "Save Configuration" below to add this AI to your council.
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              Connection failed. Check your API key.
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestConnection(key)}
                        disabled={!data.apiKey || testing[key]}
                        className="flex-1 px-4 py-2 border border-blue-500/30 text-blue-200 rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {testing[key] ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button
                        onClick={() => handleSave(key)}
                        disabled={!data.apiKey || !data.model || justSaved === key}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          testResult === true
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {justSaved === key ? 'Saved!' : (editingParticipantId ? 'Update Configuration' : 'Save Configuration')}
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })}

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <h4 className="font-semibold text-blue-200 mb-2">How to get API keys:</h4>
            <ul className="text-sm text-blue-300/80 space-y-1">
              <li>OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">platform.openai.com/api-keys</a></li>
              <li>Anthropic: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">console.anthropic.com/settings/keys</a></li>
              <li>Google: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">makersuite.google.com/app/apikey</a></li>
              <li>Replicate: <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">replicate.com/account/api-tokens</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
