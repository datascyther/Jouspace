export type Theme = 'dark' | 'light' | 'auto' | 'system';
export type Tone = 'warm' | 'motivational' | 'soothing' | 'auto';
export type Language = 'en';

export interface UserPreferences {
  theme: Theme;
  notifications: boolean;
  language: Language;
  tone: Tone;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  streakDays: number;
  lastActivityDate: Date;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
  onboardingCompleted?: boolean;
  displayName?: string;
  primaryGoals?: string[];
  initialMood?: string;
  reminderPreference?: string;
  notificationsEnabled?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  name: string;
}

export type AuthMethod = 'email' | 'google' | 'anonymous';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
