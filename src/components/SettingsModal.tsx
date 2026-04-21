import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { TurnMode } from '../types';

export function SettingsModal() {
  const { conversationSettings, updateSettings, setShowSettings } = useApp();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-blue-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20 sticky top-0 bg-gray-900/95 backdrop-blur-md z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-blue-100">Conversation Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-blue-300 hover:text-blue-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-3">
                Turn-taking Mode
              </label>
              <div className="space-y-2">
                {[
                  { value: 'sequential', label: 'Sequential', desc: 'Each AI takes turns in order' },
                  { value: 'random', label: 'Random', desc: 'AI selected randomly each turn' },
                  { value: 'contextual', label: 'Contextual', desc: 'AI chosen by relevance to last message' },
                  { value: 'manual', label: 'Manual', desc: 'You choose who speaks next' },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      conversationSettings.turnMode === mode.value
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-blue-500/20 hover:bg-gray-800/50 hover:border-blue-500/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="turnMode"
                      value={mode.value}
                      checked={conversationSettings.turnMode === mode.value}
                      onChange={(e) => updateSettings({ turnMode: e.target.value as TurnMode })}
                      className="mt-1 accent-blue-500"
                    />
                    <div>
                      <div className="font-medium text-blue-100">{mode.label}</div>
                      <div className="text-sm text-blue-300/70">{mode.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-3">
                Turns Per AI
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={conversationSettings.maxTurns}
                onChange={(e) => updateSettings({ maxTurns: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-blue-300/60 mt-1">0 = unlimited. Each AI speaks this many times, then the conversation stops.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-3">
                Conversation Style
              </label>
              <select
                value={conversationSettings.conversationStyle}
                onChange={(e) => updateSettings({ conversationStyle: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="discussion">Collaborative Discussion</option>
                <option value="debate">Debate / Argue Different Perspectives</option>
                <option value="consensus">Agree and Build Consensus</option>
                <option value="questioning">Question and Challenge Each Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-3">
                Response Length
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-300/70">Brief</span>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="100"
                  value={conversationSettings.responseLength}
                  onChange={(e) => updateSettings({ responseLength: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-blue-300/70">Detailed</span>
              </div>
              <div className="text-center mt-2 text-sm text-blue-300/60">
                ~{conversationSettings.responseLength} tokens
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-blue-500/20 rounded-lg hover:bg-gray-800/50 transition-colors">
              <input
                type="checkbox"
                checked={conversationSettings.autoPlayVoice}
                onChange={(e) => updateSettings({ autoPlayVoice: e.target.checked })}
                className="w-5 h-5 accent-blue-500 rounded"
              />
              <div>
                <div className="font-medium text-blue-100">Auto-play Voice</div>
                <div className="text-sm text-blue-300/70">
                  Automatically play audio for AI responses
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-blue-500/20 rounded-lg hover:bg-gray-800/50 transition-colors">
              <input
                type="checkbox"
                checked={conversationSettings.enableTalkingHeads}
                onChange={(e) => updateSettings({ enableTalkingHeads: e.target.checked })}
                className="w-5 h-5 accent-blue-500 rounded"
              />
              <div>
                <div className="font-medium text-blue-100">Enable Talking Head Videos</div>
                <div className="text-sm text-blue-300/70">
                  Generate animated videos using AI-generated character portraits. Requires Replicate API.
                </div>
              </div>
            </label>
          </div>
        </div>

<div className="flex justify-end gap-3 p-6 border-t border-blue-500/20 sticky bottom-0 bg-gray-900/95 backdrop-blur-md rounded-b-2xl">
          <button
            onClick={() => setShowSettings(false)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
