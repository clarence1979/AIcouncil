export interface PersonaConfig {
  imagePrompt: string;
  voiceId: string;
}

export const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  'Socrates': {
    imagePrompt: 'Photorealistic portrait of ancient Greek philosopher Socrates, elderly man with distinctive beard, wise contemplative expression, classical Athens atmosphere, facing camera directly, neutral background, high quality headshot',
    voiceId: 'onyx',
  },
  'Albert Einstein': {
    imagePrompt: 'Photorealistic portrait of Albert Einstein, wild gray hair, mustache, thoughtful intelligent expression, early 1900s style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'echo',
  },
  'Confucius': {
    imagePrompt: 'Photorealistic portrait of ancient Chinese philosopher Confucius, traditional scholarly robes, serene wise expression, classical Chinese setting, facing camera directly, neutral background, high quality headshot',
    voiceId: 'onyx',
  },
  'Marie Curie': {
    imagePrompt: 'Photorealistic portrait of Marie Curie, early 1900s scientist, determined intelligent expression, period-appropriate dress, facing camera directly, neutral background, high quality headshot',
    voiceId: 'shimmer',
  },
  'Nikola Tesla': {
    imagePrompt: 'Photorealistic portrait of inventor Nikola Tesla, sharp features, intense intelligent eyes, late 1800s style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'echo',
  },
  'Ada Lovelace': {
    imagePrompt: 'Photorealistic portrait of Ada Lovelace, Victorian era mathematician, elegant period dress, analytical expression, 1840s style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'shimmer',
  },
  'Aristotle': {
    imagePrompt: 'Photorealistic portrait of ancient Greek philosopher Aristotle, mature bearded man, scholarly expression, classical Greek style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'onyx',
  },
  'Leonardo da Vinci': {
    imagePrompt: 'Photorealistic portrait of Leonardo da Vinci, Renaissance era, long beard, piercing intelligent eyes, Renaissance clothing, facing camera directly, neutral background, high quality headshot',
    voiceId: 'fable',
  },
  'Maya Angelou': {
    imagePrompt: 'Photorealistic portrait of Maya Angelou, wise compassionate expression, dignified presence, modern era, facing camera directly, neutral background, high quality headshot',
    voiceId: 'nova',
  },
  'Carl Sagan': {
    imagePrompt: 'Photorealistic portrait of Carl Sagan, 1980s scientist and astronomer, warm intelligent expression, turtleneck sweater, facing camera directly, neutral background, high quality headshot',
    voiceId: 'echo',
  },
  'Sherlock Holmes': {
    imagePrompt: 'Photorealistic portrait of Sherlock Holmes, Victorian era detective, sharp analytical expression, deerstalker cap optional, facing camera directly, neutral background, high quality headshot',
    voiceId: 'fable',
  },
  'Yoda': {
    imagePrompt: 'Photorealistic portrait of a wise elderly sage with green skin and pointed ears, ancient wisdom in expression, mystical atmosphere, facing camera directly, neutral background, high quality headshot',
    voiceId: 'onyx',
  },
  'Tony Stark': {
    imagePrompt: 'Photorealistic portrait of a confident modern tech genius, goatee beard, charismatic expression, contemporary style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'echo',
  },
  'William Shakespeare': {
    imagePrompt: 'Photorealistic portrait of William Shakespeare, Elizabethan era playwright, contemplative expression, period clothing, facing camera directly, neutral background, high quality headshot',
    voiceId: 'fable',
  },
  'Mark Twain': {
    imagePrompt: 'Photorealistic portrait of Mark Twain, distinctive mustache, witty expression, late 1800s style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'echo',
  },
  'Oscar Wilde': {
    imagePrompt: 'Photorealistic portrait of Oscar Wilde, Victorian era writer, elegant and witty expression, period formal wear, facing camera directly, neutral background, high quality headshot',
    voiceId: 'fable',
  },
  'Winston Churchill': {
    imagePrompt: 'Photorealistic portrait of Winston Churchill, determined expression, formal attire, 1940s style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'fable',
  },
  'Marcus Aurelius': {
    imagePrompt: 'Photorealistic portrait of Marcus Aurelius, Roman emperor philosopher, dignified expression, classical Roman style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'onyx',
  },
  'Nelson Mandela': {
    imagePrompt: 'Photorealistic portrait of Nelson Mandela, warm dignified expression, modern era, facing camera directly, neutral background, high quality headshot',
    voiceId: 'onyx',
  },
  'Friedrich Nietzsche': {
    imagePrompt: 'Photorealistic portrait of Friedrich Nietzsche, distinctive mustache, intense philosophical expression, late 1800s style, facing camera directly, neutral background, high quality headshot',
    voiceId: 'echo',
  },
};

export function getPersonaConfig(personaName: string): PersonaConfig {
  return PERSONA_CONFIGS[personaName] || {
    imagePrompt: `Photorealistic portrait of ${personaName}, professional headshot, neutral expression, facing camera directly, neutral background, high quality`,
    voiceId: 'alloy',
  };
}
