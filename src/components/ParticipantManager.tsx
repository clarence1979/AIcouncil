import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, User } from 'lucide-react';
import { AI_PROVIDERS } from '../lib/ai-clients';
import { getStoredApiKey } from '../utils/auto-login';
import { useApp } from '../context/AppContext';
import { ProviderLogo } from './ProviderLogo';
import type { LocalAIParticipant, Avatar, Personality } from '../types';

const MAX_PARTICIPANTS = 5;

const AVAILABLE_AVATARS: Avatar[] = ['🤖', '👨‍💻', '👩‍🔬', '🧠', '🎭', '🦉', '🦊', '🐺', '🐉', '⚡', '🔮', '💎'];
const AVAILABLE_PERSONALITIES: Personality[] = ['analytical', 'creative', 'sarcastic', 'enthusiastic', 'skeptical', 'philosophical', 'pragmatic', 'witty'];
const AVAILABLE_VOICES = ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer'];

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'text-emerald-400',
  anthropic: 'text-orange-400',
  google: 'text-blue-400',
};

function getAvailableProviders(): Array<{ key: string; label: string; color: string }> {
  return Object.entries(AI_PROVIDERS)
    .filter(([key]) => !!getStoredApiKey(key))
    .map(([key, p]) => ({ key, label: p.name, color: p.color }));
}

function getNextAvatar(participants: LocalAIParticipant[]): Avatar {
  const used = new Set(participants.map(p => p.avatar));
  return AVAILABLE_AVATARS.find(a => !used.has(a)) || '🤖';
}

function getNextVoice(participants: LocalAIParticipant[]): string {
  const used = new Set(participants.map(p => p.voiceName).filter(Boolean));
  return AVAILABLE_VOICES.find(v => !used.has(v)) || 'alloy';
}

function getNextPersonality(index: number): Personality {
  return AVAILABLE_PERSONALITIES[index % AVAILABLE_PERSONALITIES.length];
}

interface ProviderDropdownProps {
  value: string;
  options: Array<{ key: string; label: string }>;
  onChange: (key: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
}

function ProviderDropdown({ value, options, onChange, placeholder = 'Select...', size = 'sm' }: ProviderDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.key === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const padding = size === 'md' ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 ${padding} bg-gray-900/60 border border-blue-500/20 rounded-lg text-blue-200 hover:border-blue-500/50 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer transition-colors`}
      >
        {selected ? (
          <>
            <span className={`flex-shrink-0 ${PROVIDER_COLORS[selected.key] || 'text-gray-400'}`}>
              <ProviderLogo provider={selected.key} size={size === 'md' ? 16 : 13} />
            </span>
            <span className="flex-1 text-left truncate">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-blue-300/50">{placeholder}</span>
        )}
        <ChevronDown size={size === 'md' ? 14 : 11} className={`flex-shrink-0 text-blue-400/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-blue-500/30 rounded-lg shadow-xl shadow-black/50 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-900/40 transition-colors ${opt.key === value ? 'bg-blue-900/30 text-blue-100' : 'text-blue-200'}`}
            >
              <span className={`flex-shrink-0 ${PROVIDER_COLORS[opt.key] || 'text-gray-400'}`}>
                <ProviderLogo provider={opt.key} size={13} />
              </span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface AddSlotProps {
  onAdd: (provider: string, model: string) => void;
  usedSlots: number;
}

function AddSlot({ onAdd, usedSlots }: AddSlotProps) {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const availableProviders = getAvailableProviders();

  if (usedSlots >= MAX_PARTICIPANTS) return null;

  const handleProviderChange = (providerKey: string) => {
    setSelectedProvider(providerKey);
    const models = AI_PROVIDERS[providerKey as keyof typeof AI_PROVIDERS]?.models || [];
    setSelectedModel(models[0]?.id || '');
  };

  const handleAdd = () => {
    if (!selectedProvider || !selectedModel) return;
    onAdd(selectedProvider, selectedModel);
    setOpen(false);
    setSelectedProvider('');
    setSelectedModel('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={availableProviders.length === 0}
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-900/20 transition-all text-blue-400/70 hover:text-blue-300 min-h-[148px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus size={22} />
        <span className="text-xs font-medium">Add Participant</span>
      </button>
    );
  }

  const modelOptions = selectedProvider
    ? AI_PROVIDERS[selectedProvider as keyof typeof AI_PROVIDERS]?.models || []
    : [];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-blue-500/50 bg-blue-900/20 min-h-[148px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">New Participant</span>
        <button onClick={() => setOpen(false)} className="text-blue-400/60 hover:text-blue-200 transition-colors">
          <X size={14} />
        </button>
      </div>

      {availableProviders.length === 0 ? (
        <p className="text-xs text-blue-300/60 text-center py-2">No API keys available.</p>
      ) : (
        <>
          <ProviderDropdown
            value={selectedProvider}
            options={availableProviders}
            onChange={handleProviderChange}
            placeholder="Select AI provider..."
            size="md"
          />

          {selectedProvider && (
            <div className="relative">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 bg-gray-800/80 border border-blue-500/30 rounded-lg text-blue-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              >
                {modelOptions.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400/60 pointer-events-none" />
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!selectedProvider || !selectedModel}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors mt-auto"
          >
            Add
          </button>
        </>
      )}
    </div>
  );
}

interface ParticipantSlotProps {
  participant: LocalAIParticipant;
  onUpdate: (id: string, updates: Partial<LocalAIParticipant>) => void;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
}

function ParticipantSlot({ participant, onUpdate, onRemove, onConfigure }: ParticipantSlotProps) {
  const availableProviders = getAvailableProviders();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(participant.customName || '');

  const providerInfo = AI_PROVIDERS[participant.provider as keyof typeof AI_PROVIDERS];
  const displayName = participant.customName || participant.defaultName;

  const handleProviderChange = (providerKey: string) => {
    const provInfo = AI_PROVIDERS[providerKey as keyof typeof AI_PROVIDERS];
    if (!provInfo) return;
    const newModel = provInfo.models[0].id;
    const newApiKey = getStoredApiKey(providerKey);
    onUpdate(participant.id, {
      provider: providerKey as any,
      model: newModel,
      apiKey: newApiKey,
      defaultName: provInfo.name,
      color: provInfo.color,
    });
  };

  const handleModelChange = (model: string) => {
    onUpdate(participant.id, { model });
  };

  const handleNameSave = () => {
    onUpdate(participant.id, { customName: nameValue.trim() || undefined });
    setEditingName(false);
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-blue-500/20 bg-gray-800/40 backdrop-blur-sm hover:border-blue-500/40 transition-all">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`flex-shrink-0 ${PROVIDER_COLORS[participant.provider] || 'text-gray-400'}`}>
            <ProviderLogo provider={participant.provider} size={18} />
          </div>
          {participant.avatarUrl ? (
            <img src={participant.avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
          ) : (
            <span className="text-base flex-shrink-0 leading-none">{participant.avatar}</span>
          )}
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
              className="flex-1 min-w-0 text-xs font-semibold bg-gray-700 text-blue-100 border border-blue-500/50 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <button
              onClick={() => { setNameValue(participant.customName || ''); setEditingName(true); }}
              className="text-xs font-semibold text-blue-100 hover:text-blue-300 transition-colors truncate max-w-[70px] text-left leading-tight"
              title="Click to rename"
            >
              {displayName}
            </button>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onConfigure(participant.id)}
            className="p-1 text-blue-400/50 hover:text-blue-300 transition-colors"
            title="Advanced settings"
          >
            <User size={12} />
          </button>
          <button
            onClick={() => onRemove(participant.id)}
            className="p-1 text-blue-400/40 hover:text-red-400 transition-colors"
            title="Remove"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <ProviderDropdown
        value={participant.provider}
        options={availableProviders}
        onChange={handleProviderChange}
      />

      <div className="relative">
        <select
          value={participant.model}
          onChange={e => handleModelChange(e.target.value)}
          className="w-full appearance-none px-2.5 py-1.5 pr-6 bg-gray-900/60 border border-blue-500/20 rounded-lg text-blue-200 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 outline-none cursor-pointer"
        >
          {providerInfo?.models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400/50 pointer-events-none" />
      </div>
    </div>
  );
}

interface ParticipantManagerProps {
  onConfigure?: (id: string) => void;
}

export function ParticipantManager({ onConfigure }: ParticipantManagerProps) {
  const { participants, addParticipant, updateParticipant, removeParticipant } = useApp();
  const activeParticipants = participants.filter(p => p.isActive);

  const handleAdd = (providerKey: string, model: string) => {
    if (activeParticipants.length >= MAX_PARTICIPANTS) return;

    const provInfo = AI_PROVIDERS[providerKey as keyof typeof AI_PROVIDERS];
    if (!provInfo) return;

    const apiKey = getStoredApiKey(providerKey);
    const newParticipant: LocalAIParticipant = {
      id: crypto.randomUUID(),
      provider: providerKey as any,
      model,
      defaultName: provInfo.name,
      color: provInfo.color,
      apiKey,
      voiceName: getNextVoice(activeParticipants),
      personality: getNextPersonality(activeParticipants.length),
      avatar: getNextAvatar(activeParticipants),
      config: { temperature: 0.7, maxTokens: 500 },
      isActive: true,
      messageCount: 0,
    };
    addParticipant(newParticipant);
  };

  const handleRemove = (id: string) => {
    removeParticipant(id);
  };

  const handleConfigure = (id: string) => {
    onConfigure?.(id);
  };

  if (activeParticipants.length === 0) return null;

  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border-b border-blue-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
            AI Council ({activeParticipants.length}/{MAX_PARTICIPANTS})
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {activeParticipants.map(participant => (
            <ParticipantSlot
              key={participant.id}
              participant={participant}
              onUpdate={updateParticipant}
              onRemove={handleRemove}
              onConfigure={handleConfigure}
            />
          ))}
          <AddSlot onAdd={handleAdd} usedSlots={activeParticipants.length} />
        </div>
      </div>
    </div>
  );
}

export function ParticipantManagerEmpty() {
  const { addParticipant } = useApp();

  const handleAdd = (providerKey: string, model: string) => {
    const provInfo = AI_PROVIDERS[providerKey as keyof typeof AI_PROVIDERS];
    if (!provInfo) return;
    const apiKey = getStoredApiKey(providerKey);
    const newParticipant: LocalAIParticipant = {
      id: crypto.randomUUID(),
      provider: providerKey as any,
      model,
      defaultName: provInfo.name,
      color: provInfo.color,
      apiKey,
      voiceName: getNextVoice([]),
      personality: getNextPersonality(0),
      avatar: getNextAvatar([]),
      config: { temperature: 0.7, maxTokens: 500 },
      isActive: true,
      messageCount: 0,
    };
    addParticipant(newParticipant);
  };

  return <AddSlot onAdd={handleAdd} usedSlots={0} />;
}
