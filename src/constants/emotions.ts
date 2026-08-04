export type EmotionType = 'great' | 'good' | 'calm' | 'notGood' | 'overwhelmed';

export type EmotionAnimationType =
  | 'pulse'
  | 'float'
  | 'breathe';

import type { MoodRating } from '@/shared/types';

export interface EmotionPalette {
  primary: string;
  secondary: string;
  darkPrimary: string;
  darkSecondary: string;
  glow: string;
  label: string;
}

export interface EmotionAnimationConfig {
  type: EmotionAnimationType;
  duration: number;
}

export const EMOTION_COLORS: Record<EmotionType, EmotionPalette> = {
  great: {
    primary: '#F6C453',
    secondary: '#F59E57',
    darkPrimary: '#FBD36B',
    darkSecondary: '#F8A766',
    glow: '#F6C453',
    label: 'Great',
  },
  good: {
    primary: '#C4B5FD',
    secondary: '#A78BFA',
    darkPrimary: '#C9BCFD',
    darkSecondary: '#B794F4',
    glow: '#A78BFA',
    label: 'Good',
  },
  calm: {
    primary: '#7DD3FC',
    secondary: '#67E8F9',
    darkPrimary: '#8ED6FC',
    darkSecondary: '#79E4F0',
    glow: '#7DD3FC',
    label: 'Calm',
  },
  notGood: {
    primary: '#8B9CF8',
    secondary: '#6366F1',
    darkPrimary: '#9AA8FB',
    darkSecondary: '#7C7FF5',
    glow: '#818CF8',
    label: 'Not good',
  },
  overwhelmed: {
    primary: '#FBA7A0',
    secondary: '#B8A1D9',
    darkPrimary: '#FBB4AE',
    darkSecondary: '#C4AFDD',
    glow: '#FBA7A0',
    label: 'Overwhelmed',
  },
};

export const EMOTION_ANIMATION: Record<EmotionType, EmotionAnimationConfig> = {
  great: { type: 'pulse', duration: 3000 },
  good: { type: 'float', duration: 3000 },
  calm: { type: 'breathe', duration: 3200 },
  notGood: { type: 'pulse', duration: 4000 },
  overwhelmed: { type: 'pulse', duration: 3500 },
};

export const RATING_TO_EMOTION: Record<MoodRating, EmotionType> = {
  5: 'great',
  4: 'good',
  3: 'calm',
  2: 'notGood',
  1: 'overwhelmed',
};

export const EMOTION_ORDER: EmotionType[] = [
  'great',
  'good',
  'calm',
  'notGood',
  'overwhelmed',
];

export const EMOTION_LABELS: Record<EmotionType, string> = {
  great: 'Great',
  good: 'Good',
  calm: 'Calm',
  notGood: 'Not good',
  overwhelmed: 'Overwhelmed',
};

export async function triggerEmotionHaptic(): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {

  }
}
