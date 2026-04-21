import { createClient } from '@supabase/supabase-js';

const AUTH_SUPABASE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const AUTH_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

const authClient = createClient(AUTH_SUPABASE_URL, AUTH_SUPABASE_ANON_KEY);

export interface LoginResult {
  success: boolean;
  username?: string;
  error?: string;
}

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<LoginResult> {
  const { data, error } = await authClient
    .from('users_login')
    .select('username')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  if (error) {
    return { success: false, error: 'Authentication failed. Please try again.' };
  }

  if (!data) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const secrets = await fetchSecrets();
  if (secrets.claudeKey) localStorage.setItem('VITE_CLAUDE_API_KEY', secrets.claudeKey);
  if (secrets.geminiKey) localStorage.setItem('VITE_GEMINI_API_KEY', secrets.geminiKey);
  if (secrets.openaiKey) localStorage.setItem('VITE_OPENAI_API_KEY', secrets.openaiKey);

  return { success: true, username: data.username };
}

async function fetchSecrets(): Promise<{
  claudeKey?: string;
  geminiKey?: string;
  openaiKey?: string;
}> {
  const { data, error } = await authClient
    .from('secrets')
    .select('key_name, key_value')
    .in('key_name', ['CLAUDE_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY']);

  if (error || !data) return {};

  const result: { claudeKey?: string; geminiKey?: string; openaiKey?: string } = {};
  for (const row of data) {
    if (row.key_name === 'CLAUDE_API_KEY') result.claudeKey = row.key_value;
    if (row.key_name === 'GEMINI_API_KEY') result.geminiKey = row.key_value;
    if (row.key_name === 'OPENAI_API_KEY') result.openaiKey = row.key_value;
  }
  return result;
}
