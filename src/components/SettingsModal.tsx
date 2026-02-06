import { X, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { hasReplicateApiKey, setReplicateApiKey } from '../lib/sadtalker-service';
import type { TurnMode } from '../types';

export function SettingsModal() {
  const { conversationSettings, updateSettings, setShowSettings } = useApp();
  const toast = useToast();
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
      toast.success('Replicate API key saved.');
    }
  };

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
                Maximum Rounds
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={conversationSettings.maxTurns}
                onChange={(e) => updateSettings({ maxTurns: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-blue-300/60 mt-1">0 = unlimited. Each round, every AI speaks once.</p>
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

        <div className="px-6 pb-6 border-t border-blue-500/20 pt-6">
          <h3 className="text-lg font-semibold text-blue-100 mb-4">API Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Replicate API Key
                {hasExistingKey && (
                  <span className="ml-2 text-xs text-emerald-400 font-normal">Configured</span>
                )}
              </label>
              <p className="text-sm text-blue-300/60 mb-3">
                Required for talking head videos.{' '}
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Get your key
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showReplicateKey ? 'text' : 'password'}
                    value={replicateKey}
                    onChange={(e) => setReplicateKey(e.target.value)}
                    placeholder={hasExistingKey ? '••••••••••••••••' : 'Enter your Replicate API key'}
                    className="w-full px-4 py-2 pr-10 bg-gray-800/50 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReplicateKey(!showReplicateKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300"
                  >
                    {showReplicateKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  onClick={handleSaveReplicateKey}
                  disabled={!replicateKey.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
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
