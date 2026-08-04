/**
 * Jouspace — Auth Feature Types
 *
 * Feature-specific auth types extending the shared auth types.
 * Kept separate from shared types to maintain feature isolation.
 */

import type { UserProfile, AuthCredentials } from '@/services/auth/types';

// ─── Onboarding ─────────────────────────────────────────────────────────

export type WellnessGoal =
  | 'manage_anxiety'
  | 'reduce_stress'
  | 'improve_sleep'
  | 'build_habits'
  | 'practice_mindfulness'
  | 'track_mood'
  | 'general_wellness';

export type DailyReminderTime =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'none';

export interface OnboardingData {
  firstName: string;
  wellnessGoal: WellnessGoal;
  dailyReminder: DailyReminderTime;
  notificationsEnabled: boolean;
  theme: 'dark' | 'light' | 'auto';
}

// ─── Auth Screen State ──────────────────────────────────────────────────

export type AuthScreen =
  | 'splash'
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'email_verification'
  | 'onboarding';

export interface AuthNavigationState {
  currentScreen: AuthScreen;
  pendingEmail?: string;
  pendingPassword?: string;
}

// ─── Auth Error ─────────────────────────────────────────────────────────

export interface AuthError {
  code: string;
  message: string;
  field?: 'email' | 'password' | 'name' | 'confirmPassword' | 'general';
}

// ─── Email Verification ─────────────────────────────────────────────────

export interface EmailVerificationState {
  sent: boolean;
  verified: boolean;
  loading: boolean;
  error: string | null;
}

// ─── Password Reset ─────────────────────────────────────────────────────

export interface PasswordResetState {
  sent: boolean;
  loading: boolean;
  error: string | null;
}
