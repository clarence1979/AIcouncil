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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,163,127,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(230,126,34,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 100% 80%, rgba(66,133,244,0.08) 0%, transparent 55%)',
        }} />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="login-glow-green" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="24" />
            </filter>
            <filter id="login-glow-orange" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="24" />
            </filter>
            <filter id="login-glow-blue" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="24" />
            </filter>
            <linearGradient id="login-gemini-grad" x1="0.573" y1="0.057" x2="0.426" y2="0.943" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#1aa4f5" stopOpacity="0.22" />
              <stop offset="1" stopColor="#1a6bf5" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          <g transform="translate(-80, 80)" opacity="0.18" filter="url(#login-glow-green)">
            <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.224-3.735 10.079 10.079 0 0 0-11.298 4.96 9.964 9.964 0 0 0-6.675 4.813 10.079 10.079 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.224 3.735 10.079 10.079 0 0 0 11.298-4.961 9.965 9.965 0 0 0 6.675-4.813 10.079 10.079 0 0 0-1.24-11.816zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103L16.4 34.494a7.505 7.505 0 0 1-10.008-3.488zm-1.32-17.48A7.472 7.472 0 0 1 9.08 9.99l-.001.252v9.202a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L8.2 23.94a7.505 7.505 0 0 1-3.128-10.414zm27.688 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l7.775 4.99a7.505 7.505 0 0 1-1.168 13.528v-9.452a1.293 1.293 0 0 0-.364-.496zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l7.859-4.384a7.504 7.504 0 0 1 11.325 6.502zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.505 7.505 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V18.906z"
              fill="#10A37F" transform="scale(6)" />
          </g>

          <g transform="translate(60%, -60) scale(1)" opacity="0.16" filter="url(#login-glow-orange)">
            <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0zM12.665 0L0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264zm-.702 19.337 4.334-11.246 4.334 11.246H11.963z"
              fill="#E67E22" transform="scale(7)" />
          </g>

          <g transform="translate(55%, 45%)" opacity="0.18" filter="url(#login-glow-blue)">
            <path d="M96 180c-4.4-16.7-9.4-31.8-16.4-44.8C71.6 121.2 61 109 47 97.6 33 86.2 18.8 78.8 0 75.4c18.4-2 32.8-6.6 47.4-17 14.6-10.4 25-25.4 35.4-42.4C90.2 8.6 92.8 0 96 0c3.2 0 5.8 8.6 13.2 16C120 32 130.4 47 145 57.4c14.6 10.4 29 15 47.4 17-18.8 3.4-33 10.8-47 22.2-14 11.4-24.6 23.6-32.6 37.6-7 13-12 28.1-16.4 44.8H96z"
              fill="url(#login-gemini-grad)" transform="scale(1.8)" />
          </g>
        </svg>
      </div>
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
