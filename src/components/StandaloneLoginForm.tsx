import { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { storeCredentialsManually } from '../utils/auto-login';

interface StandaloneLoginFormProps {
  onLogin: (username: string) => void;
}

export function StandaloneLoginForm({ onLogin }: StandaloneLoginFormProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [replicateKey, setReplicateKey] = useState('');
  const [username, setUsername] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const toggleShow = (field: string) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!openaiKey && !claudeKey && !geminiKey) {
      setError('At least one AI API key (OpenAI, Claude, or Gemini) is required.');
      return;
    }

    storeCredentialsManually({ openaiKey, claudeKey, geminiKey, replicateKey });
    onLogin(username.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: 'url(/chatgpt_image_jan_2,_2026,_12_29_46_am.png)' }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/10 p-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/digivec_logo.png" alt="Digital Vector" className="h-12 mb-4" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              AI Council
            </h1>
            <p className="text-blue-300/60 text-sm mt-1 text-center">
              Standalone mode - enter your API credentials
            </p>
          </div>

          <div className="mb-6 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300/80">
              This app is designed to be embedded in a parent portal. In standalone mode, enter your API keys directly. Credentials are stored locally in your browser.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 bg-gray-800/60 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="border-t border-blue-500/20 pt-4">
              <p className="text-xs font-semibold text-blue-300/60 uppercase tracking-wider mb-3">
                AI Provider Keys (at least one required)
              </p>

              {[
                { id: 'openai', label: 'OpenAI API Key', value: openaiKey, onChange: setOpenaiKey, placeholder: 'sk-...' },
                { id: 'claude', label: 'Anthropic (Claude) API Key', value: claudeKey, onChange: setClaudeKey, placeholder: 'sk-ant-...' },
                { id: 'gemini', label: 'Google Gemini API Key', value: geminiKey, onChange: setGeminiKey, placeholder: 'AIza...' },
              ].map(field => (
                <div key={field.id} className="mb-3">
                  <label className="block text-sm text-blue-200/80 mb-1">{field.label}</label>
                  <div className="relative">
                    <input
                      type={showKeys[field.id] ? 'text' : 'password'}
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2 pr-10 bg-gray-800/60 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(field.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 hover:text-blue-300 transition-colors"
                    >
                      {showKeys[field.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm text-blue-200/80 mb-1">Replicate API Key (optional)</label>
                <div className="relative">
                  <input
                    type={showKeys['replicate'] ? 'text' : 'password'}
                    value={replicateKey}
                    onChange={e => setReplicateKey(e.target.value)}
                    placeholder="r8_..."
                    className="w-full px-4 py-2 pr-10 bg-gray-800/60 border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('replicate')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 hover:text-blue-300 transition-colors"
                  >
                    {showKeys['replicate'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Enter AI Council
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
