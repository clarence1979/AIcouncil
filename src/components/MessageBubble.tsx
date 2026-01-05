import { useState, useRef } from 'react';
import { Volume2, VolumeX, Copy, ThumbsUp, ThumbsDown, Edit2, Play, Pause } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VoiceSynthesizer } from '../lib/voice-synthesis';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  synthesizer: VoiceSynthesizer;
  onEditName?: (participantId: string) => void;
}

export function MessageBubble({ message, synthesizer, onEditName }: MessageBubbleProps) {
  const { participants } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const participant = message.participantId
    ? participants.find((p) => p.id === message.participantId)
    : null;

  const isUser = message.senderType === 'user';
  const displayName = isUser
    ? 'You'
    : participant?.customName || participant?.defaultName || 'AI';

  const hasVideo = !!(message as any).videoUrl;
  const hasAudio = !!(message as any).audioUrl;
  const hasAvatar = !!(message as any).avatarUrl;
  const hasPersonaImage = participant?.characterPersona?.imageUrl && !hasVideo && !hasAvatar;

  const handlePlayVoice = async () => {
    if (isPlaying) {
      synthesizer.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      try {
        await synthesizer.speak(message.content, {
          voice: participant?.voiceName || 'default',
          rate: 0.9,
        });
      } catch (error) {
        console.error('Voice synthesis error:', error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (videoPlaying) {
        videoRef.current.pause();
        setVideoPlaying(false);
      } else {
        videoRef.current.play();
        setVideoPlaying(true);
      }
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        audioRef.current.play();
        setAudioPlaying(true);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-fadeIn">
        <div className="max-w-3xl">
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className="text-sm font-medium text-blue-200">{displayName}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/30">
              👤
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-2xl rounded-tr-sm shadow-lg shadow-blue-500/30">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-xs text-blue-300/70">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fadeIn">
      <div className="max-w-4xl w-full">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
            style={{ backgroundColor: participant?.color, boxShadow: `0 4px 14px ${participant?.color}40` }}
          >
            {hasAvatar ? '👤' : '🤖'}
          </div>
          <span className="text-sm font-medium text-blue-100">{displayName}</span>
          {participant && (
            <>
              <span className="text-xs text-blue-300/60">
                {participant.model}
              </span>
              {onEditName && (
                <button
                  onClick={() => onEditName(participant.id)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex gap-4">
          {(hasVideo || hasAvatar || hasPersonaImage) && (
            <div className="flex-shrink-0">
              {hasVideo ? (
                <div className="relative group">
                  <video
                    ref={videoRef}
                    src={(message as any).videoUrl}
                    className="w-64 h-64 object-cover rounded-xl border-2 border-blue-500/30 shadow-lg"
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    onEnded={() => setVideoPlaying(false)}
                    loop={false}
                  />
                  <button
                    onClick={handlePlayVideo}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  >
                    {videoPlaying ? (
                      <Pause className="w-12 h-12 text-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white" />
                    )}
                  </button>
                </div>
              ) : hasAvatar || hasPersonaImage ? (
                <div className="relative">
                  <img
                    src={(message as any).avatarUrl || participant?.characterPersona?.imageUrl}
                    alt={displayName}
                    className="w-64 h-64 object-cover rounded-xl border-2 border-blue-500/30 shadow-lg"
                  />
                  {message.videoStatus === 'generating' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl backdrop-blur-sm">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm font-medium">Generating video...</p>
                      </div>
                    </div>
                  )}
                  {hasAudio && (
                    <button
                      onClick={handlePlayAudio}
                      className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow-lg transition-colors"
                    >
                      {audioPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                  )}
                  {hasAudio && (
                    <audio
                      ref={audioRef}
                      src={(message as any).audioUrl}
                      onPlay={() => setAudioPlaying(true)}
                      onPause={() => setAudioPlaying(false)}
                      onEnded={() => setAudioPlaying(false)}
                    />
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="flex-1">
            <div
              className="px-6 py-4 rounded-2xl rounded-tl-sm shadow-lg border-l-4 bg-gray-800/60 backdrop-blur-sm"
              style={{
                borderLeftColor: participant?.color,
                boxShadow: `0 4px 14px rgba(0, 0, 0, 0.3), -4px 0 8px ${participant?.color}20`,
              }}
            >
              <p className="whitespace-pre-wrap text-blue-50">{message.content}</p>

              {isPlaying && (
                <div className="flex items-center gap-1 mt-3">
                  <div className="waveform">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              {hasVideo && (
                <button
                  onClick={handlePlayVideo}
                  className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors"
                >
                  {videoPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {videoPlaying ? 'Pause' : 'Play Video'}
                </button>
              )}
              {!hasVideo && (
                <button
                  onClick={handlePlayVoice}
                  className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors"
                >
                  {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {isPlaying ? 'Stop' : 'Play'}
                </button>
              )}
              <button
                onClick={handleCopy}
                className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors">
                <ThumbsUp size={14} />
              </button>
              <button className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors">
                <ThumbsDown size={14} />
              </button>
              <span className="text-xs text-blue-300/70 ml-auto">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ participant }: { participant?: any }) {
  return (
    <div className="flex justify-start mb-6 animate-fadeIn">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
            style={{ backgroundColor: participant?.color, boxShadow: `0 4px 14px ${participant?.color}40` }}
          >
            🤖
          </div>
          <span className="text-sm font-medium text-blue-100">
            {participant?.customName || participant?.defaultName || 'AI'}
          </span>
          <span className="text-xs text-blue-300/70">is thinking...</span>
        </div>

        <div
          className="px-6 py-4 rounded-2xl rounded-tl-sm shadow-lg border-l-4 bg-gray-800/60 backdrop-blur-sm"
          style={{
            borderLeftColor: participant?.color,
            boxShadow: `0 4px 14px rgba(0, 0, 0, 0.3), -4px 0 8px ${participant?.color}20`,
          }}
        >
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
