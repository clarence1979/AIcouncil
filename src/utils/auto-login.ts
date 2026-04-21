export interface AuthData {
  username: string;
  isAdmin: boolean;
  authToken?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export interface AutoLoginResult {
  authenticated: boolean;
  username?: string;
  isAdmin?: boolean;
  apiKey?: string;
}

export async function attemptAutoLogin(): Promise<AutoLoginResult> {
  console.log('[Auto-Login] Starting...');
  console.log('[Auto-Login] Running in iframe:', isInIframe());

  return new Promise((resolve) => {
    let resolved = false;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'API_VALUES_RESPONSE' && !resolved) {
        window.removeEventListener('message', handleMessage);
        resolved = true;

        const authData: AuthData = event.data.data;
        const {
          username,
          isAdmin,
          OPENAI_API_KEY,
          CLAUDE_API_KEY,
          GEMINI_API_KEY,
          REPLICATE_API_KEY,
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
        } = authData || {};

        if (username && SUPABASE_URL && SUPABASE_ANON_KEY) {
          localStorage.setItem('VITE_SUPABASE_URL', SUPABASE_URL);
          localStorage.setItem('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

          if (OPENAI_API_KEY) localStorage.setItem('VITE_OPENAI_API_KEY', OPENAI_API_KEY);
          if (CLAUDE_API_KEY) localStorage.setItem('VITE_CLAUDE_API_KEY', CLAUDE_API_KEY);
          if (GEMINI_API_KEY) localStorage.setItem('VITE_GEMINI_API_KEY', GEMINI_API_KEY);
          if (REPLICATE_API_KEY) localStorage.setItem('VITE_REPLICATE_API_KEY', REPLICATE_API_KEY);

          console.log('[Auto-Login] Success for:', username);

          resolve({
            authenticated: true,
            username,
            isAdmin: isAdmin || false,
            apiKey: OPENAI_API_KEY || CLAUDE_API_KEY || GEMINI_API_KEY || '',
          });
          return;
        }

        console.warn('[Auto-Login] Missing required data');
        resolve({ authenticated: false });
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

    setTimeout(() => {
      if (!resolved) {
        window.removeEventListener('message', handleMessage);
        resolved = true;
        console.warn('[Auto-Login] Timeout');
        resolve({ authenticated: false });
      }
    }, 3000);
  });
}

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getStoredApiKey(provider: string): string {
  switch (provider) {
    case 'openai':
      return localStorage.getItem('VITE_OPENAI_API_KEY') || '';
    case 'anthropic':
      return localStorage.getItem('VITE_CLAUDE_API_KEY') || '';
    case 'google':
      return localStorage.getItem('VITE_GEMINI_API_KEY') || '';
    default:
      return '';
  }
}

export function getStoredSupabaseUrl(): string {
  return localStorage.getItem('VITE_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || '';
}

const REMOTE_SECRETS_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const REMOTE_SECRETS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

export async function fetchRemoteSecrets(): Promise<void> {
  try {
    const url = `${REMOTE_SECRETS_URL}/rest/v1/secrets?select=key_name,key_value&key_name=in.(CLAUDE_API_KEY,GEMINI_API_KEY,OPENAI_API_KEY,REPLICATE_API_KEY)`;
    const response = await fetch(url, {
      headers: {
        apikey: REMOTE_SECRETS_ANON_KEY,
        Authorization: `Bearer ${REMOTE_SECRETS_ANON_KEY}`,
      },
    });
    if (!response.ok) {
      console.warn('[RemoteSecrets] Failed to fetch:', response.status);
      return;
    }
    const rows: Array<{ key_name: string; key_value: string }> = await response.json();
    const keyToStorage: Record<string, string> = {
      OPENAI_API_KEY: 'VITE_OPENAI_API_KEY',
      CLAUDE_API_KEY: 'VITE_CLAUDE_API_KEY',
      GEMINI_API_KEY: 'VITE_GEMINI_API_KEY',
      REPLICATE_API_KEY: 'VITE_REPLICATE_API_KEY',
    };
    for (const row of rows) {
      const storageKey = keyToStorage[row.key_name];
      if (storageKey && row.key_value) {
        localStorage.setItem(storageKey, row.key_value);
      }
    }
    console.log('[RemoteSecrets] Loaded API keys for', rows.map(r => r.key_name).join(', '));
  } catch (error) {
    console.warn('[RemoteSecrets] Error fetching secrets:', error);
  }
}

export function storeCredentialsManually(creds: {
  openaiKey?: string;
  claudeKey?: string;
  geminiKey?: string;
  replicateKey?: string;
}): void {
  if (creds.openaiKey) localStorage.setItem('VITE_OPENAI_API_KEY', creds.openaiKey);
  if (creds.claudeKey) localStorage.setItem('VITE_CLAUDE_API_KEY', creds.claudeKey);
  if (creds.geminiKey) localStorage.setItem('VITE_GEMINI_API_KEY', creds.geminiKey);
  if (creds.replicateKey) localStorage.setItem('VITE_REPLICATE_API_KEY', creds.replicateKey);
}
