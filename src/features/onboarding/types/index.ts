/**
 * Jouspace — Onboarding Feature Types
 *
 * Centralised type definitions for the onboarding flow.
 */

export type OnboardingStep =
  | 'welcome'
  | 'goals'
  | 'mood'
  | 'displayName'
  | 'reminder'
  | 'notification'
  | 'privacy'
  | 'preparing';

export interface GoalOption {
  value: string;
  label: string;
  emoji: string;
  description: string;
}

export interface MoodOption {
  value: string;
  label: string;
  emoji: string;
}

export interface ReminderOption {
  value: string;
  label: string;
  emoji: string;
  description: string;
}

export interface OnboardingData {
  displayName: string;
  primaryGoals: string[];
  initialMood: string;
  reminderPreference: string;
  notificationsEnabled: boolean;
}
