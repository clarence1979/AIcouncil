import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Keyboard } from 'lucide-react';
import { VoiceRecognizer } from '../lib/voice-synthesis';
import { useToast } from './Toast';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  disabled?: boolean;
  isConversationActive?: boolean;
}

export function TopicInput({ onSubmit, disabled, isConversationActive }: TopicInputProps) {
  const toast = useToast();
  const [topic, setTopic] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  useEffect(() => {
    recognizerRef.current = new VoiceRecognizer();
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  const handleVoiceInput = () => {
    if (!recognizerRef.current?.isSupported()) {
      toast.warning('Voice recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognizerRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognizerRef.current.listen(
        (transcript, isFinal) => {
          setTopic(transcript);
          if (isFinal) {
            setIsListening(false);
          }
        },
        (error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
        }
      );
    }
  };

  const handleSubmit = () => {
    if (topic.trim()) {
      onSubmit(topic.trim());
      setTopic('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border-t border-blue-500/30 p-3 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-blue-200">
            {isConversationActive ? 'Interject with your thoughts:' : 'What should the AI council discuss?'}
          </label>
          <button
            onClick={() => setUseVoice(!useVoice)}
            className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors"
          >
            {useVoice ? (
              <>
                <Keyboard size={14} />
                Type Instead
              </>
            ) : (
              <>
                <Mic size={14} />
                Use Voice
              </>
            )}
          </button>
        </div>

        {useVoice ? (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConversationActive ? "Add your thoughts to the conversation..." : "Your topic will appear here as you speak..."}
                disabled={disabled}
                rows={2}
                className="w-full px-3 py-2 border-2 border-blue-500/30 bg-gray-800/50 text-blue-100 placeholder-blue-300/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceInput}
                disabled={disabled}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Mic size={16} />
                {isListening ? 'Listening...' : 'Hold to Speak'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={disabled || !topic.trim()}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center gap-1.5"
              >
                <Send size={16} />
                {isConversationActive ? 'Interject' : 'Send'}
              </button>
            </div>

            {isListening && (
              <div className="flex items-center justify-center gap-2 text-xs text-red-600 animate-fadeIn">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                Recording...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConversationActive ? "Add your thoughts to the conversation..." : "e.g., What are the ethical implications of artificial general intelligence?"}
              disabled={disabled}
              rows={2}
              className="w-full px-3 py-2 border-2 border-blue-500/30 bg-gray-800/50 text-blue-100 placeholder-blue-300/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={disabled || !topic.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-1.5"
              >
                <Send size={16} />
                {isConversationActive ? 'Interject' : 'Start Discussion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
