import { Users } from 'lucide-react';
import type { LocalAIParticipant } from '../types';

interface ManualSpeakerSelectorProps {
  participants: LocalAIParticipant[];
  onSelect: (participantId: string) => void;
}

export function ManualSpeakerSelector({ participants, onSelect }: ManualSpeakerSelectorProps) {
  return (
    <div className="flex justify-start mb-6 animate-fadeIn">
      <div className="max-w-3xl w-full">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-blue-200">Choose who speaks next:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/70 border border-blue-500/30 rounded-xl hover:bg-blue-900/40 hover:border-blue-400/50 transition-all group"
            >
              {p.avatarUrl || p.characterPersona?.imageUrl ? (
                <img
                  src={p.avatarUrl || p.characterPersona?.imageUrl}
                  alt={p.customName || p.defaultName}
                  className="w-8 h-8 rounded-full object-cover border border-blue-500/30"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar || '🤖'}
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-medium text-blue-100 group-hover:text-white transition-colors">
                  {p.customName || p.defaultName}
                </div>
                <div className="text-xs text-blue-400/70">
                  {p.characterPersona?.name || p.model}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
