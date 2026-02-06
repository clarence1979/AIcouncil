export interface VoiceOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class VoiceSynthesizer {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  private getOpenAIApiKey(): string | null {
    const participants = localStorage.getItem('ai-participants');
    if (!participants) return null;

    try {
      const parsed = JSON.parse(participants);
      const openaiParticipant = parsed.find((p: any) => p.provider === 'openai');
      return openaiParticipant?.apiKey || null;
    } catch {
      return null;
    }
  }

  async speak(text: string, options: VoiceOptions = {}): Promise<void> {
    const voiceId = options.voice || 'alloy';
    const speed = options.rate || 1.0;

    try {
      const audioUrl = await this.generateSpeech(text, voiceId, speed);
      await this.playAudio(audioUrl);
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  private async generateSpeech(text: string, voice: string, speed: number): Promise<string> {
    const openaiApiKey = this.getOpenAIApiKey();
    if (!openaiApiKey) {
      throw new Error('Please configure OpenAI in your AI Council settings first');
    }

    const processedText = this.preprocessText(text);
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-tts`;

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: processedText,
        voice: voice.toLowerCase(),
        speed: Math.max(0.25, Math.min(4.0, speed)),
        apiKey: openaiApiKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS request failed: ${errorText}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }

  private preprocessText(text: string): string {
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\n\n+/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }

  private playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stop();

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isPlaying = true;

      audio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audio.onerror = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch((error) => {
        this.isPlaying = false;
        this.currentAudio = null;
        reject(error);
      });
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  resume(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
      this.isPlaying = true;
    }
  }

  isSpeaking(): boolean {
    return this.isPlaying;
  }
}

export class VoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  listen(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Speech recognition not supported');
      return;
    }

    if (this.isListening) {
      return;
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.isListening = true;
    this.recognition.start();
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const DEFAULT_VOICE_PREFERENCES = {
  openai: { voice: 'google us english', rate: 0.9, pitch: 1.0 },
  anthropic: { voice: 'google uk english', rate: 0.95, pitch: 0.95 },
  google: { voice: 'google uk english', rate: 0.9, pitch: 1.05 },
};
