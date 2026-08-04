/**
 * Jouspace — Shared Type Definitions
 *
 * Core application types shared across features.
 * Feature-specific types live in their respective feature folders.
 */

// ─── User ───────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light' | 'auto';
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

// ─── Mood ───────────────────────────────────────────────────────────────

export type MoodRating = 1 | 2 | 3 | 4 | 5;

import type { EmotionType } from '@/constants/emotions';

export const MOOD_MAP: Record<
  MoodRating,
  { label: string; emoji: string; emotion: EmotionType }
> = {
  5: { label: 'Great', emoji: '🤩', emotion: 'great' },
  4: { label: 'Good', emoji: '😊', emotion: 'good' },
  3: { label: 'Okay', emoji: '😌', emotion: 'calm' },
  2: { label: 'Not good', emoji: '😰', emotion: 'notGood' },
  1: { label: 'Awful', emoji: '🤯', emotion: 'overwhelmed' },
};

export function getMoodLabel(rating: MoodRating): string {
  return MOOD_MAP[rating].label;
}

export function getMoodEmoji(rating: MoodRating): string {
  return MOOD_MAP[rating].emoji;
}

/** @deprecated Use `getMoodEmotion` — Unicode emojis are being replaced. */
export function getMoodEmotion(rating: MoodRating): EmotionType {
  return MOOD_MAP[rating].emotion;
}

export interface Mood {
  id: string;
  rating: MoodRating;
  note: string;
  timestamp: Date;
  label?: string;
}

// ─── Chat ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  reasoning?: string;
  conversationId: string | null;
}

// ─── Conversations / Groups ─────────────────────────────────────────────

export type ConversationType = 'group';
export type MessageType = 'text' | 'system';
export type ParticipantRole = 'member' | 'admin';

export interface LastMessagePreview {
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface ConversationMetadata {
  isSupportGroup: boolean;
  category?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  description?: string;
  imageURL?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  participantIds: string[];
  lastMessage?: LastMessagePreview;
  metadata?: ConversationMetadata;
  memberCount: number;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  replyTo?: string;
  readBy: string[];
}

export interface ConversationParticipant {
  id: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastReadAt: Date;
  mutedUntil?: Date;
}

export interface UserConversation {
  id: string;
  lastReadAt: Date;
  lastMessageAt: Date;
  isPinned: boolean;
  isMuted: boolean;
  lastMessagePreview: string;
}

// ─── Navigation ─────────────────────────────────────────────────────────

export type TabName = 'home' | 'chat' | 'journal' | 'profile';
export type AuthScreen = 'login' | 'signup' | 'onboarding';
