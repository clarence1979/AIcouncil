export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIClientConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export abstract class AIClient {
  protected apiKey: string;
  protected edgeFunctionUrl: string;

  constructor(apiKey: string, functionName: string) {
    this.apiKey = apiKey;
    this.edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;
  }

  protected async callEdgeFunction(action: string, data?: any) {
    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        apiKey: this.apiKey,
        data,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  }

  abstract testConnection(): Promise<boolean>;
  abstract sendMessage(
    messages: AIMessage[],
    model: string,
    config?: AIClientConfig
  ): Promise<string>;
}

export class OpenAIClient extends AIClient {
  constructor(apiKey: string) {
    super(apiKey, 'openai-proxy');
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.callEdgeFunction('test');
      return result.success;
    } catch {
      return false;
    }
  }

  async sendMessage(
    messages: AIMessage[],
    model: string = 'gpt-4-turbo',
    config: AIClientConfig = {}
  ): Promise<string> {
    const result = await this.callEdgeFunction('chat', {
      model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 500,
    });

    return result.choices[0].message.content;
  }
}

export class AnthropicClient extends AIClient {
  constructor(apiKey: string) {
    super(apiKey, 'anthropic-proxy');
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.callEdgeFunction('test');
      return result.success;
    } catch {
      return false;
    }
  }

  async sendMessage(
    messages: AIMessage[],
    model: string = 'claude-3-5-sonnet-20241022',
    config: AIClientConfig = {}
  ): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const result = await this.callEdgeFunction('chat', {
      model,
      max_tokens: config.maxTokens ?? 500,
      temperature: config.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: conversationMessages,
    });

    return result.content[0].text;
  }
}

export class GeminiClient extends AIClient {
  constructor(apiKey: string) {
    super(apiKey, 'gemini-proxy');
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.callEdgeFunction('test');
      return result.success;
    } catch {
      return false;
    }
  }

  async sendMessage(
    messages: AIMessage[],
    model: string = 'gemini-2.5-flash',
    config: AIClientConfig = {}
  ): Promise<string> {
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    const result = await this.callEdgeFunction('chat', {
      model,
      contents,
      systemInstruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens ?? 500,
      },
    });

    return result.candidates[0].content.parts[0].text;
  }
}

export function createAIClient(
  provider: string,
  apiKey: string
): AIClient {
  switch (provider) {
    case 'openai':
      return new OpenAIClient(apiKey);
    case 'anthropic':
      return new AnthropicClient(apiKey);
    case 'google':
      return new GeminiClient(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    color: '#10A37F',
    models: [
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
  anthropic: {
    name: 'Anthropic',
    icon: '🧠',
    color: '#E67E22',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
  },
  google: {
    name: 'Google',
    icon: '💎',
    color: '#4285F4',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
    ],
  },
};
