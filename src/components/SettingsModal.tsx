import { X, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { hasReplicateApiKey, setReplicateApiKey } from '../lib/sadtalker-service';
import type { TurnMode } from '../types';

export function SettingsModal() {
  const { conversationSettings, updateSettings, setShowSettings } = useApp();
  const [replicateKey, setReplicateKey] = useState('');
  const [showReplicateKey, setShowReplicateKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    setHasExistingKey(hasReplicateApiKey());
  }, []);

  const handleSaveReplicateKey = () => {
    if (replicateKey.trim()) {
      setReplicateApiKey(replicateKey.trim());
      setHasExistingKey(true);
      setReplicateKey('');
      alert('Replicate API key saved successfully!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Conversation Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Turn-taking Mode
              </label>
              <div className="space-y-2">
                {[
                  { value: 'sequential', label: 'Sequential', desc: 'Each AI takes turns in order' },
                  { value: 'random', label: 'Random', desc: 'AI selected randomly each turn' },
                  { value: 'contextual', label: 'Contextual', desc: 'AI chosen by relevance' },
                  { value: 'manual', label: 'Manual', desc: 'You choose who speaks next' },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="turnMode"
                      value={mode.value}
                      checked={conversationSettings.turnMode === mode.value}
                      onChange={(e) => updateSettings({ turnMode: e.target.value as TurnMode })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{mode.label}</div>
                      <div className="text-sm text-gray-500">{mode.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Maximum Turns
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={conversationSettings.maxTurns}
                onChange={(e) => updateSettings({ maxTurns: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">0 = unlimited</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Conversation Style
              </label>
              <select
                value={conversationSettings.conversationStyle}
                onChange={(e) => updateSettings({ conversationStyle: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="discussion">Collaborative Discussion</option>
                <option value="debate">Debate / Argue Different Perspectives</option>
                <option value="consensus">Agree and Build Consensus</option>
                <option value="questioning">Question and Challenge Each Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Response Length
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Brief</span>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="100"
                  value={conversationSettings.responseLength}
                  onChange={(e) => updateSettings({ responseLength: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">Detailed</span>
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">
                ~{conversationSettings.responseLength} tokens
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={conversationSettings.autoPlayVoice}
                  onChange={(e) => updateSettings({ autoPlayVoice: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Auto-play Voice</div>
                  <div className="text-sm text-gray-500">
                    Automatically play audio for AI responses
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replicate API Key
                {hasExistingKey && (
                  <span className="ml-2 text-xs text-green-600 font-normal">✓ Key configured</span>
                )}
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Required for generating talking head videos. Get your key at{' '}
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  replicate.com/account/api-tokens
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showReplicateKey ? 'text' : 'password'}
                    value={replicateKey}
                    onChange={(e) => setReplicateKey(e.target.value)}
                    placeholder={hasExistingKey ? '••••••••••••••••' : 'Enter your Replicate API key'}
                    className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReplicateKey(!showReplicateKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showReplicateKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  onClick={handleSaveReplicateKey}
                  disabled={!replicateKey.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={() => setShowSettings(false)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
