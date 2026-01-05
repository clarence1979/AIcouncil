export interface PersonaConfig {
  imagePrompt: string;
  voiceId: string;
}

export const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  'Socrates': {
    imagePrompt: 'Ultra-photorealistic portrait of ancient Greek philosopher Socrates in a modern podcast studio, elderly man with distinctive beard, wise contemplative expression, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, classical Athens atmosphere blended with modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'onyx',
  },
  'Albert Einstein': {
    imagePrompt: 'Ultra-photorealistic portrait of Albert Einstein in a modern podcast studio, wild gray hair, mustache, thoughtful intelligent expression, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, early 1900s style clothing with modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'echo',
  },
  'Confucius': {
    imagePrompt: 'Ultra-photorealistic portrait of ancient Chinese philosopher Confucius in a modern podcast studio, traditional scholarly robes, serene wise expression, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, classical Chinese setting blended with modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'onyx',
  },
  'Marie Curie': {
    imagePrompt: 'Ultra-photorealistic portrait of Marie Curie in a modern podcast studio, early 1900s scientist, determined intelligent expression, period-appropriate dress, wearing professional headset with microphone, studio condenser microphone on boom arm in front of her, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'shimmer',
  },
  'Nikola Tesla': {
    imagePrompt: 'Ultra-photorealistic portrait of inventor Nikola Tesla in a modern podcast studio, sharp features, intense intelligent eyes, late 1800s style clothing, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'echo',
  },
  'Ada Lovelace': {
    imagePrompt: 'Ultra-photorealistic portrait of Ada Lovelace in a modern podcast studio, Victorian era mathematician, elegant period dress, analytical expression, 1840s style, wearing professional headset with microphone, studio condenser microphone on boom arm in front of her, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'shimmer',
  },
  'Aristotle': {
    imagePrompt: 'Ultra-photorealistic portrait of ancient Greek philosopher Aristotle in a modern podcast studio, mature bearded man, scholarly expression, classical Greek style robes, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'onyx',
  },
  'Leonardo da Vinci': {
    imagePrompt: 'Ultra-photorealistic portrait of Leonardo da Vinci in a modern podcast studio, Renaissance era, long beard, piercing intelligent eyes, Renaissance clothing, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'fable',
  },
  'Maya Angelou': {
    imagePrompt: 'Ultra-photorealistic portrait of Maya Angelou in a modern podcast studio, wise compassionate expression, dignified presence, modern era, wearing professional headset with microphone, studio condenser microphone on boom arm in front of her, professional broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'nova',
  },
  'Carl Sagan': {
    imagePrompt: 'Ultra-photorealistic portrait of Carl Sagan in a modern podcast studio, 1980s scientist and astronomer, warm intelligent expression, turtleneck sweater, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'echo',
  },
  'Sherlock Holmes': {
    imagePrompt: 'Ultra-photorealistic portrait of Sherlock Holmes in a modern podcast studio, Victorian era detective, sharp analytical expression, period clothing, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, Victorian aesthetics blended with modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'fable',
  },
  'Yoda': {
    imagePrompt: 'Ultra-photorealistic portrait of a wise elderly sage with green skin and pointed ears in a modern podcast studio, ancient wisdom in expression, mystical atmosphere, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'onyx',
  },
  'Tony Stark': {
    imagePrompt: 'Ultra-photorealistic portrait of a confident modern tech genius in a high-tech podcast studio, goatee beard, charismatic expression, contemporary style, wearing sleek professional headset with microphone, premium studio condenser microphone on boom arm in front of him, state-of-the-art broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'echo',
  },
  'William Shakespeare': {
    imagePrompt: 'Ultra-photorealistic portrait of William Shakespeare in a modern podcast studio, Elizabethan era playwright, contemplative expression, period clothing, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, Elizabethan aesthetics blended with modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'fable',
  },
  'Mark Twain': {
    imagePrompt: 'Ultra-photorealistic portrait of Mark Twain in a modern podcast studio, distinctive mustache, witty expression, late 1800s style clothing, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'echo',
  },
  'Oscar Wilde': {
    imagePrompt: 'Ultra-photorealistic portrait of Oscar Wilde in a modern podcast studio, Victorian era writer, elegant and witty expression, period formal wear, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, Victorian aesthetics with modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'fable',
  },
  'Winston Churchill': {
    imagePrompt: 'Ultra-photorealistic portrait of Winston Churchill in a modern podcast studio, determined expression, formal attire, 1940s style, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'fable',
  },
  'Marcus Aurelius': {
    imagePrompt: 'Ultra-photorealistic portrait of Marcus Aurelius in a modern podcast studio, Roman emperor philosopher, dignified expression, classical Roman style robes, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, Roman aesthetics blended with modern broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'onyx',
  },
  'Nelson Mandela': {
    imagePrompt: 'Ultra-photorealistic portrait of Nelson Mandela in a modern podcast studio, warm dignified expression, modern era, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, professional broadcasting setup, facing camera directly, professional lighting, 8k quality',
    voiceId: 'onyx',
  },
  'Friedrich Nietzsche': {
    imagePrompt: 'Ultra-photorealistic portrait of Friedrich Nietzsche in a modern podcast studio, distinctive mustache, intense philosophical expression, late 1800s style clothing, wearing professional headset with microphone, studio condenser microphone on boom arm in front of him, modern broadcasting equipment, facing camera directly, professional lighting, 8k quality',
    voiceId: 'echo',
  },
};

export function getPersonaConfig(personaName: string): PersonaConfig {
  return PERSONA_CONFIGS[personaName] || {
    imagePrompt: `Ultra-photorealistic portrait of ${personaName} in a modern podcast studio, professional appearance, wearing professional headset with microphone, studio condenser microphone on boom arm in front of them, neutral expression, facing camera directly, professional broadcasting setup, professional lighting, 8k quality`,
    voiceId: 'alloy',
  };
}
