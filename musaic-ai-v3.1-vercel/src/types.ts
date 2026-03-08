export interface AIPreferences {
  artStyle: string;
  bioTone: string;
  videoAesthetic: string;
}

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  artStyle: 'Modern, Minimalist, High Contrast',
  bioTone: 'Professional, Engaging, Authentic',
  videoAesthetic: 'Cinematic, Moody, High Energy'
};
