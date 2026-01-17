export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIClientConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export abstract class AIClient {
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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
    super(apiKey);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendMessage(
    messages: AIMessage[],
    model: string = 'gpt-4-turbo',
    config: AIClientConfig = {}
  ): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  }
}

export class AnthropicClient extends AIClient {
  private proxyUrl: string;

  constructor(apiKey: string) {
    super(apiKey);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.proxyUrl = `${supabaseUrl}/functions/v1/anthropic-proxy`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.success;
    } catch {
      return false;
    }
  }

  async sendMessage(
    messages: AIMessage[],
    model: string = 'claude-sonnet-4-5-20250929',
    config: AIClientConfig = {}
  ): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'chat',
        apiKey: this.apiKey,
        data: {
          model,
          max_tokens: config.maxTokens ?? 500,
          temperature: config.temperature ?? 0.7,
          system: systemMessage?.content,
          messages: conversationMessages,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const result = await response.json();
    return result.content[0].text;
  }
}

export class GeminiClient extends AIClient {
  constructor(apiKey: string) {
    super(apiKey);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );
      return response.ok;
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

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens ?? 500,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const result = await response.json();
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
      { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5' },
      { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5' },
      { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5' },
      { id: 'claude-opus-4-1', name: 'Opus 4.1' },
      { id: 'claude-sonnet-4', name: 'Sonnet 4' },
      { id: 'claude-opus-4', name: 'Opus 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Opus 3' },
      { id: 'claude-haiku-3-5', name: 'Haiku 3.5' },
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
