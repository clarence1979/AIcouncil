import { Settings, Trash2 } from 'lucide-react';
import type { LocalAIParticipant } from '../types';

interface ParticipantCardProps {
  participant: LocalAIParticipant;
  onConfigure: () => void;
  onRemove: () => void;
}

export function ParticipantCard({
  participant,
  onConfigure,
  onRemove,
}: ParticipantCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-blue-500/20 p-2 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 hover:border-blue-400/30 transition-all">
      <div className="flex items-start gap-2">
        {participant.characterPersona?.imageUrl ? (
          <img
            src={participant.characterPersona.imageUrl}
            alt={participant.characterPersona.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-lg border-2 border-purple-400/50"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-lg"
            style={{ backgroundColor: participant.color }}
          >
            {participant.avatar || '🤖'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <h4 className="text-sm font-semibold text-blue-100 truncate">
              {participant.customName || participant.defaultName}
            </h4>
            {participant.characterPersona && (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-400/30">
                {participant.characterPersona.name}
              </span>
            )}
          </div>

          <p className="text-[10px] text-blue-300/70">{participant.model}</p>
          {participant.characterPersona ? (
            <p className="text-[10px] text-purple-400/80 line-clamp-1">{participant.characterPersona.description}</p>
          ) : (
            <p className="text-[10px] text-blue-400/80 capitalize">{participant.personality || 'analytical'}</p>
          )}
        </div>

        <div className="flex gap-1">
          <button
            onClick={onConfigure}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
            title="Configure"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-blue-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
            title="Remove"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
