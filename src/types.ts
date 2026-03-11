export interface AIPreferences {
  artStyle: string;
  bioTone: string;
  videoAesthetic: string;
}

// Nouvelle interface pour vos données utilisateur
export interface UserProfile {
  firstName: string;
  lastName: string;
  artistName: string;
  country: string;
  email: string;
  points: number;
  isPro: boolean;
  plan: 'guest' | 'artist' | 'pro';
  createdAt: any;
}

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  artStyle: 'Modern, Minimalist, High Contrast',
  bioTone: 'Professional, Engaging, Authentic',
  videoAesthetic: 'Cinematic, Moody, High Energy'
};
