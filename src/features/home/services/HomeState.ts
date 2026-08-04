// src/features/home/services/HomeState.ts
//
// The single, typed shape returned by HomeService.fetchHomeState().
// Every section the Home screen renders is represented here so HomeScreen
// becomes a pure projection of this object.

import type { NarrativeMoment, AdaptiveContent } from './HomeViewModel';
import type { Mood } from '@/shared/types';

import type { RecommendationRow } from '../../../../backend/services/RecommendationService';
import type { ProgressRow } from '../../../../backend/services/ProgressService';
import type { NotificationRow } from '../../../../backend/services/NotificationService';
import type { JournalRow } from '../../../../backend/services/JournalService';
import type { MissionRow } from '../../../../backend/services/MissionService';
import type { AnalyticsRow } from '../../../../backend/services/AnalyticsService';

export interface GreetingSection {
  text: string;
  firstName: string | null;
  moment: NarrativeMoment;
  adaptive: AdaptiveContent;
  intention: string;
}

export interface TodaysMissionSection {
  id: string;
  title: string;
  description: string | null;
  source: string;
  status: string;
  programId: string | null;
  lessonId: string | null;
  reason?: string;
  estimatedTime?: string;
}

export interface ReflectionSection {
  latest: JournalRow | null;
  reflectedToday: boolean;
  prompt?: string;
}

export interface MoodSection {
  today: Mood | null;
  entries: Mood[];
  streak: number;
  dayCount: number;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  source: string;
  reason: string;
}

export interface RecommendationSection {
  primary: RecommendationItem | null;
  all: RecommendationRow[];
  reason: string | null;
  salient?: boolean;
}

export interface ProgressSummary {
  rows: ProgressRow[];
  completedLessons: number;
  completedExercises: number;
  completedPrograms: number;
  streakDays: number;
}

export interface NotificationsSection {
  items: NotificationRow[];
  unreadCount: number;
}

/** The full Home Intelligence Layer state. */
export interface HomeState {
  greeting: GreetingSection;
  todaysMission: TodaysMissionSection | null;
  reflection: ReflectionSection;
  mood: MoodSection;
  recommendation: RecommendationSection;
  progress: ProgressSummary;
  notifications: NotificationsSection;
  recentEvents: AnalyticsRow[];
}

export type { MissionRow };
