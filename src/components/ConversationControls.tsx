import { Pause, Play, Square } from 'lucide-react';

interface ConversationControlsProps {
  isActive: boolean;
  isPaused: boolean;
  currentTurn: number;
  maxTurns: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ConversationControls({
  isActive,
  isPaused,
  currentTurn,
  maxTurns,
  onPause,
  onResume,
  onStop,
}: ConversationControlsProps) {
  if (!isActive && !isPaused) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 p-2 bg-gray-900/70 backdrop-blur-sm border-y border-blue-500/20">
      <div className="flex items-center gap-2">
        {isPaused ? (
          <button
            onClick={onResume}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-green-500/30"
          >
            <Play size={14} />
            Resume
          </button>
        ) : (
          <button
            onClick={onPause}
            className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-yellow-500/30"
          >
            <Pause size={14} />
            Pause
          </button>
        )}

        <button
          onClick={onStop}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-red-500/30"
        >
          <Square size={14} />
          Stop
        </button>

        <div className="ml-2 px-3 py-1.5 bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-blue-500/20">
          <span className="text-xs font-medium text-blue-100">
            Turn {currentTurn}
            {maxTurns > 0 && ` of ${maxTurns}`}
          </span>
        </div>
      </div>
    </div>
  );
}
