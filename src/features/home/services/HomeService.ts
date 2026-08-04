// src/features/home/services/HomeService.ts
//
// Home Intelligence Layer — the single aggregator for the Home screen.
//
//   HomeScreen → useHomeState → HomeService.fetchHomeState() → [services] → Supabase
//
// Composes the existing HomeViewModel (Greeting / Journey / Mood / Recommendation)
// with the remaining sections:
//   • Today's Mission  ← MissionService
//   • Reflection       ← JournalService
//   • Progress         ← ProgressService
//   • Notifications    ← NotificationService
//
// Each non-base fetch is isolated: a failure in one section never blanks the
// rest of the home.

import { homeViewModel } from './HomeViewModel';
import type {
  HomeState,
  TodaysMissionSection,
  ProgressSummary,
  RecommendationItem,
} from './HomeState';

import { missionService } from '../../../../backend/services/MissionService';
import { journalService } from '../../../../backend/services/JournalService';
import { progressService } from '../../../../backend/services/ProgressService';
import { notificationService } from '../../../../backend/services/NotificationService';
import type { Mood } from '@/shared/types';

import type { MissionRow } from '../../../../backend/services/MissionService';
import type { JournalRow } from '../../../../backend/services/JournalService';
import type { ProgressRow } from '../../../../backend/services/ProgressService';
import type { NotificationRow } from '../../../../backend/services/NotificationService';
import type { ProfileRow } from '../../../../backend/services/ProfileService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a single failed fetch to a safe fallback without breaking the rest. */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error('[HomeService] isolated fetch failure:', err);
    return fallback;
  }
}

function getFirstName(profile: ProfileRow | null): string | null {
  if (!profile) return null;
  const name = profile.display_name || profile.username;
  return name ? name.split(' ')[0] : null;
}

function toMissionSection(row: MissionRow | null, journals: JournalRow[]): TodaysMissionSection | null {
  if (!row) return null;

  const reflectedToday = journals.some(
    (j) => new Date(j.created_at).toDateString() === new Date().toDateString()
  );

  let reason = '• Complete today\'s reflection activity.';
  let estimatedTime = '10 minutes';

  const titleLower = row.title.toLowerCase();
  if (titleLower.includes('mindful minute') || titleLower.includes('reflect')) {
    estimatedTime = '1 minute';
    reason = reflectedToday
      ? '• A daily reflection helps ground your thoughts.'
      : '• You haven\'t reflected today.';
  } else if (titleLower.includes('breathe') || titleLower.includes('breathing')) {
    estimatedTime = '5 minutes';
    reason = '• Deep breathing calms your nervous system.';
  } else if (titleLower.includes('meditat')) {
    estimatedTime = '10 minutes';
    reason = '• Meditation helps build focus and clarity.';
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    source: row.source,
    status: row.status,
    programId: row.program_id ?? null,
    lessonId: row.lesson_id ?? null,
    reason,
    estimatedTime,
  };
}

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

function deriveReflection(journals: JournalRow[]): HomeState['reflection'] {
  const latest = journals[0] ?? null;
  const reflectedToday = journals.some((j) => isToday(j.created_at));

  // Determine prompt
  let prompt = 'Take a moment to capture a thought or feeling.';

  // 1. Check if they haven't journaled in 4 days
  let daysSinceLastJournal = 999;
  if (latest?.created_at) {
    const diffMs = Date.now() - new Date(latest.created_at).getTime();
    daysSinceLastJournal = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  if (daysSinceLastJournal >= 4 && !reflectedToday) {
    prompt = 'You haven\'t journaled in four days. Writing for two minutes may help.';
  } else {
    // 2. Check if work pressure was mentioned three times this week
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weekJournals = journals.filter((j) => j.created_at && new Date(j.created_at) >= sevenDaysAgo);
    
    let workPressureMentions = 0;
    for (const j of weekJournals) {
      const text = `${j.title || ''} ${j.body || ''}`.toLowerCase();
      const hasWork = text.includes('work') || text.includes('job') || text.includes('office') || text.includes('career') || text.includes('project');
      const hasPressure = text.includes('pressure') || text.includes('stress') || text.includes('anxi') || text.includes('overwhelm');
      if (hasWork && hasPressure) {
        workPressureMentions++;
      }
    }

    if (workPressureMentions >= 3) {
      prompt = 'You\'ve mentioned work pressure three times this week. Would you like to reflect on it?';
    }
  }

  return {
    latest,
    reflectedToday,
    prompt,
  };
}

function summarizeProgress(
  rows: ProgressRow[],
  streakDays: number,
): ProgressSummary {
  const completed = rows.filter((r) => r.status === 'completed');
  const lessonIds = new Set(completed.map((r) => r.lesson_id).filter(Boolean));
  const exerciseIds = new Set(completed.map((r) => r.exercise_id).filter(Boolean));
  const programIds = new Set(completed.map((r) => r.program_id).filter(Boolean));
  return {
    rows,
    completedLessons: lessonIds.size,
    completedExercises: exerciseIds.size,
    completedPrograms: programIds.size,
    streakDays,
  };
}

function generateSmartRecommendation(
  moodEntries: Mood[],
  journals: JournalRow[],
  recentEvents: any[]
): { recommendation: RecommendationItem, reason: string, salient: boolean } {
  const now = new Date();
  const hour = now.getHours();

  // Find if user has checked in today and got a low/stress mood
  const todayEntries = moodEntries.filter(
    (e) => new Date(e.timestamp).toDateString() === now.toDateString()
  );
  const latestMood = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;

  // 1. Stress: mood rating <= 2 (Awful, Not Good) — personally relevant
  if (latestMood && latestMood.rating <= 2) {
    return {
      recommendation: {
        id: 'rec_stress_grounding',
        title: 'Grounding Exercise',
        description: 'A 5-4-3-2-1 sensory exercise to bring you back to the present moment.',
        type: 'breathing',
        source: 'AI Counselor',
        reason: 'Recommended for high stress',
      },
      reason: 'Based on your high stress levels logged today',
      salient: true,
    };
  }

  // 2. Low mood: mood rating <= 3 (Okay) — personally relevant
  if (latestMood && latestMood.rating <= 3) {
    return {
      recommendation: {
        id: 'rec_low_mood_cbt',
        title: 'CBT Thought Record',
        description: 'Identify and reframe automatic negative thoughts.',
        type: 'cbt',
        source: 'CBT Program',
        reason: 'Recommended for low mood',
      },
      reason: 'Recommended to help reframe today\'s low mood',
      salient: true,
    };
  }

  // 3. Morning: hour < 12 — time-of-day relevant
  if (hour >= 5 && hour < 12) {
    return {
      recommendation: {
        id: 'rec_morning_breathing',
        title: '5-Minute Breathing',
        description: 'Box breathing to energize your focus and calm your morning mind.',
        type: 'breathing',
        source: 'Quick Action',
        reason: 'Recommended for morning focus',
      },
      reason: 'Start your morning with reflection',
      salient: true,
    };
  }

  // 4. Night: hour >= 20 (8 PM) — time-of-day relevant
  if (hour >= 20 || hour < 5) {
    return {
      recommendation: {
        id: 'rec_night_sleep',
        title: 'Sleep Meditation',
        description: 'Guided wind-down to release physical tension and quiet thoughts.',
        type: 'sleep',
        source: 'Sleep Aids',
        reason: 'Recommended for bedtime',
      },
      reason: 'Wind down for a restful night',
      salient: true,
    };
  }

  // 5. Default recommendation — generic, non-salient (don't surface a card)
  return {
    recommendation: {
      id: 'rec_default_breathe',
      title: 'Breathing Exercise',
      description: 'A quick 2-minute breathing break to align your posture and awareness.',
      type: 'breathing',
      source: 'Mindfulness',
      reason: 'Daily recharge',
    },
    reason: 'Recommended for your daily reflection',
    salient: false,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

class HomeService {
  async fetchHomeState(): Promise<HomeState> {
    // Four sections come from the existing aggregator (kept intact).
    const base = await homeViewModel.getHomeScreenData();

    // Remaining sections — each isolated so one failure is contained.
    const [todaysMission, journals, progressRows, notifications] = await Promise.all([
      safe(missionService.ensureTodaysMission(), null),
      safe(journalService.list(), [] as JournalRow[]),
      safe(progressService.list(), [] as ProgressRow[]),
      safe(notificationService.list(true), [] as NotificationRow[]),
    ]);

    const smartRec = generateSmartRecommendation(
      base.moodEntries,
      journals,
      base.recentEvents
    );

    return {
      greeting: {
        text: base.greeting,
        firstName: getFirstName(base.profile),
        moment: base.narrativeMoment,
        adaptive: base.adaptiveContent,
        intention: base.intention,
      },
      todaysMission: toMissionSection(todaysMission, journals),
      reflection: deriveReflection(journals),
      mood: {
        today: base.todayMood,
        entries: base.moodEntries,
        streak: base.streak,
        dayCount: base.dayCount,
      },
      recommendation: {
        primary: smartRec.recommendation,
        all: base.recommendations,
        reason: smartRec.reason,
        salient: smartRec.salient,
      },
      progress: summarizeProgress(progressRows, base.streak),
      notifications: {
        items: notifications,
        unreadCount: notifications.length,
      },
      recentEvents: base.recentEvents,
    };
  }
}

export const homeService = new HomeService();
export default homeService;
