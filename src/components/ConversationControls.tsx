import { Pause, Play, Square, Download, FileText, Trash2 } from 'lucide-react';

interface ConversationControlsProps {
  isActive: boolean;
  isPaused: boolean;
  currentTurn: number;
  maxTurns: number;
  hasMessages: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClear: () => void;
  onDownloadTranscript: () => void;
  onDownloadSummary: () => void;
}

export function ConversationControls({
  isActive,
  isPaused,
  currentTurn,
  maxTurns,
  hasMessages,
  onPause,
  onResume,
  onStop,
  onClear,
  onDownloadTranscript,
  onDownloadSummary,
}: ConversationControlsProps) {
  const showDownloadButtons = (isPaused || !isActive) && hasMessages;

  if (!isActive && !isPaused && !hasMessages) {
    return null;
  }

  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border-y border-blue-500/20">
      <div className="flex flex-col items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          {(isActive || isPaused) && (
            <>
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
            </>
          )}
        </div>

        {showDownloadButtons && (
          <div className="flex items-center gap-2 pt-2 border-t border-blue-500/20">
            <button
              onClick={onDownloadTranscript}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-500/30"
            >
              <Download size={14} />
              Download Transcript
            </button>
            <button
              onClick={onDownloadSummary}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/30"
            >
              <FileText size={14} />
              Download Summary
            </button>
            <button
              onClick={onClear}
              className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-gray-500/30"
            >
              <Trash2 size={14} />
              Clear Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
