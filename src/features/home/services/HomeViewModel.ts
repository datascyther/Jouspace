// src/features/home/services/HomeViewModel.ts
//
// Single aggregation point for the Home screen.
// HomeScreen → useHomeViewModel → HomeViewModel → [services] → Supabase
//
// Rules:
//  - No UI imports here. Pure async data.
//  - All derived fields (greeting, streak, narrativeMoment) are computed here
//    so HomeScreen is 100% presentational.

import { moodService } from '../../../../backend/services/MoodService';
import { recommendationService } from '../../../../backend/services/RecommendationService';
import { analyticsService } from '../../../../backend/services/AnalyticsService';
import { profileService } from '../../../../backend/services/ProfileService';

import type { MoodRow } from '../../../../backend/services/MoodService';
import type { RecommendationRow } from '../../../../backend/services/RecommendationService';
import type { AnalyticsRow } from '../../../../backend/services/AnalyticsService';
import type { ProfileRow } from '../../../../backend/services/ProfileService';

import type { Mood, MoodRating } from '@/shared/types';
import { getTimeOfDay } from '@/features/home/utils/adaptiveContext';
import type { TimeOfDay } from '@/features/home/utils/adaptiveContext';

// ─── Narrative Moment ─────────────────────────────────────────────────────────

export type NarrativeMoment =
  | 'morning_fresh'    // <10am, no check-in yet
  | 'afternoon_active' // 10am–5pm
  | 'evening_wind_down'// ≥5pm
  | 'post_lesson'      // completed a lesson today
  | 'missed_days'      // no check-in for 2+ days
  | 'streak_active'    // 3+ day streak
  | 'default';

export interface AdaptiveContent {
  headline: string;
  subline: string;
  ctaLabel: string;
}

// ─── Smart Welcome Card (MODULE 1) ─────────────────────────────────────────────
//
// The greeting becomes a "living dashboard": instead of a single static message,
// the most salient message for *today* is chosen from a priority ladder.
//
// Detection source: `analyticsService.list(50)` → `recentEvents` (AnalyticsRow[]).
// Each row has `{ event_name, created_at, properties }`.
//
// Event-name taxonomy (analytics `event_name` strings):
//   • `meditation_completed`   — REAL, existing string (src/services/analytics/index.ts).
//                                Used here as the breathing proxy because no dedicated
//                                breathing event exists yet (see ASSUMPTIONS below).
//   • `breathing_session_completed` — PROPOSED canonical string for a finished
//                                breathing/paced-breathing session. Add this emit at
//                                the end of every breathing session.
//   • `cbt_lesson_completed`   — PROPOSED canonical string for a finished CBT lesson.
//                                No lesson-completion analytics event exists yet.
//
// NOTE: detection only honors events whose `created_at` is *today*.

const BREATHING_COMPLETED_EVENTS = [
  'breathing_session_completed', // proposed (canonical)
  'meditation_completed', // real, existing proxy
] as const;

const CBT_LESSON_COMPLETED_EVENTS = [
  'cbt_lesson_completed', // proposed (canonical)
] as const;

// Streak count at/above which we treat the streak as a "milestone" worth celebrating.
const STREAK_MILESTONE = 1;

function isSameDay(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

function didEventHappenToday(events: AnalyticsRow[], names: readonly string[]): boolean {
  return events.some((e) => names.includes(e.event_name) && isSameDay(e.created_at));
}

/**
 * PRIORITY LADDER (most → least salient):
 *   1. breathing session completed today   → "Nice work."
 *   2. CBT lesson completed today           → "You've completed another CBT lesson."
 *   3. streak milestone reached             → "Day {streak}"
 *   4. time-of-day base greeting (fallback) → Good Morning / Afternoon / Evening
 *
 * Only headline + subline are returned here. The CTA label stays owned by
 * `buildAdaptiveContent` (keyed off `narrativeMoment`) so the check-in / journey
 * CTA logic is preserved untouched.
 */
function buildSmartGreeting(ctx: {
  timeOfDay: TimeOfDay;
  streak: number;
  didBreathingToday: boolean;
  didCbtToday: boolean;
  hasCheckedInToday: boolean;
  firstName: string | null;
  reflectedYesterday?: boolean;
}): { headline: string; subline: string } {
  if (ctx.didBreathingToday) {
    return {
      headline: 'Nice work.',
      subline: "Your breathing session lowered today's stress.",
    };
  }
  if (ctx.didCbtToday) {
    return {
      headline: "You've completed another CBT lesson.",
      subline: 'Momentum matters.',
    };
  }
  if (ctx.streak >= STREAK_MILESTONE) {
    return {
      headline: `Day ${ctx.streak}`,
      subline: ctx.streak >= 7
        ? "You're building something real."
        : "Don't break the chain.",
    };
  }
  switch (ctx.timeOfDay) {
    case 'morning':
      return {
        headline: 'Good Morning',
        subline: ctx.reflectedYesterday
          ? "You reflected yesterday. Let's continue."
          : "Let's continue your story.",
      };
    case 'afternoon':
      return {
        headline: 'Good Afternoon',
        subline: ctx.hasCheckedInToday
          ? "You've already made progress today."
          : 'Welcome back.',
      };
    case 'evening':
      return {
        headline: 'Good Evening',
        subline: ctx.hasCheckedInToday
          ? "You've already made progress today."
          : 'Welcome back.',
      };
    case 'night':
    default:
      return {
        headline: 'Good Night',
        subline: "Let's continue your story.",
      };
  }
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

const LEVEL_TO_RATING: Record<string, MoodRating> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

function moodRowToMood(row: MoodRow): Mood {
  return {
    id: row.id,
    rating: (LEVEL_TO_RATING[row.level] ?? 3) as MoodRating,
    note: row.note ?? '',
    timestamp: new Date(row.recorded_at ?? row.created_at),
  };
}

// ─── Shape ────────────────────────────────────────────────────────────────────

export type HomeScreenData = {
  // Derived display
  greeting: string;
  dayCount: number;
  streak: number;
  narrativeMoment: NarrativeMoment;
  adaptiveContent: AdaptiveContent;
  recommendationReason: string | null;
  intention: string;

  // Mood
  todayMood: Mood | null;
  moodEntries: Mood[];

  // Data
  recommendations: RecommendationRow[];
  recentEvents: AnalyticsRow[];
  profile: ProfileRow | null;
};

// ─── Intentions ───────────────────────────────────────────────────────────────
const INTENTIONS: Record<TimeOfDay, string[]> = {
  morning: [
    'Stay present.',
    'Notice what went well.',
    'Capture one thought.',
    'Embrace small progress.',
  ],
  afternoon: [
    'Keep the momentum.',
    'Write what matters.',
    'Be kind to yourself.',
    'Acknowledge your progress.',
  ],
  evening: [
    'Let go of today.',
    'Rest is progress.',
    'Embrace the quiet.',
    'Reflect on one positive thing.',
  ],
  night: [
    'End with gratitude.',
    'Rest is earned.',
    'Reflect on the day.',
    'You showed up today.',
  ],
};

function getDailyIntention(timeOfDay: TimeOfDay): string {
  const day = new Date().getDate();
  const list = INTENTIONS[timeOfDay] || INTENTIONS.morning;
  return list[day % list.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(profile: ProfileRow | null): string | null {
  if (!profile) return null;
  const name = profile.display_name || profile.username;
  if (!name) return null;
  return name.split(' ')[0];
}

function buildGreeting(profile: ProfileRow | null): string {
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = getFirstName(profile);
  return firstName ? `${salutation}, ${firstName}` : salutation;
}

function calcDayCount(profile: ProfileRow | null): number {
  if (!profile?.created_at) return 0;
  return Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

function calcStreak(entries: Mood[]): number {
  if (entries.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 365; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayStr = day.toDateString();
    const hasEntry = entries.some(
      (e) => new Date(e.timestamp).toDateString() === dayStr,
    );
    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      // Allow today to be incomplete; only break on past days
      break;
    }
  }
  return streak;
}

function calcDaysSinceLastCheckIn(entries: Mood[]): number {
  if (entries.length === 0) return 999;
  const last = entries.reduce((a, b) =>
    new Date(a.timestamp) > new Date(b.timestamp) ? a : b,
  );
  const diffMs = Date.now() - new Date(last.timestamp).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getTodayMood(entries: Mood[]): Mood | null {
  const todayStr = new Date().toDateString();
  const todayEntries = entries.filter(
    (e) => new Date(e.timestamp).toDateString() === todayStr,
  );
  return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
}

function deriveMoment(
  entries: Mood[],
  streak: number,
  daysSinceLast: number,
): NarrativeMoment {
  const hour = new Date().getHours();
  const hasCheckedInToday = !!getTodayMood(entries);

  if (daysSinceLast >= 2 && !hasCheckedInToday) return 'missed_days';
  if (streak >= 3) return 'streak_active';
  if (hour < 10 && !hasCheckedInToday) return 'morning_fresh';
  if (hour >= 17) return 'evening_wind_down';
  if (hour >= 10) return 'afternoon_active';
  return 'default';
}

function buildAdaptiveContent(
  moment: NarrativeMoment,
  firstName: string | null,
  streak: number,
  hasCheckedInToday: boolean,
): AdaptiveContent {
  const name = firstName ?? 'there';

  // Dynamic CTA based on user state
  const dynamicCta = hasCheckedInToday
    ? 'Continue'
    : 'Complete Today\'s Check-in';

  const MAP: Record<NarrativeMoment, AdaptiveContent> = {
    morning_fresh: {
      headline: `Good morning, ${name}`,
      subline: 'Ready to start today?',
      ctaLabel: hasCheckedInToday ? 'Continue' : 'Begin check-in',
    },
    afternoon_active: {
      headline: `Hey, ${name}`,
      subline: "Let's keep the momentum going.",
      ctaLabel: dynamicCta,
    },
    evening_wind_down: {
      headline: `Good evening, ${name}`,
      subline: "Let's slow down and reflect.",
      ctaLabel: hasCheckedInToday ? 'Reflect now' : 'Check in',
    },
    post_lesson: {
      headline: `Nice work, ${name}`,
      subline: 'One more lesson unlocks tomorrow.',
      ctaLabel: 'See progress',
    },
    missed_days: {
      headline: `Welcome back, ${name}`,
      subline: "Let's restart gently. No pressure.",
      ctaLabel: 'Check in now',
    },
    streak_active: {
      headline: `Day ${streak}`,
      subline: "You're building something real.",
      ctaLabel: dynamicCta,
    },
    default: {
      headline: `Hello, ${name}`,
      subline: "Here's your day at a glance.",
      ctaLabel: dynamicCta,
    },
  };

  return MAP[moment];
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

class HomeViewModel {
  async getHomeScreenData(): Promise<HomeScreenData> {
    const [moodRows, recommendations, recentEvents, profile] =
      await Promise.all([
        moodService.list(30),
        recommendationService.list('pending'),
        analyticsService.list(50),
        profileService.getCurrent(),
      ]);

    const moodEntries = moodRows
      .map(moodRowToMood)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const streak = calcStreak(moodEntries);
    const daysSinceLast = calcDaysSinceLastCheckIn(moodEntries);
    const firstName = getFirstName(profile);
    const hasCheckedInToday = !!getTodayMood(moodEntries);

    // Smart Welcome Card: pick the most salient message for *today*.
    const didBreathingToday = didEventHappenToday(
      recentEvents,
      BREATHING_COMPLETED_EVENTS,
    );
    const didCbtToday = didEventHappenToday(
      recentEvents,
      CBT_LESSON_COMPLETED_EVENTS,
    );

    let narrativeMoment = deriveMoment(moodEntries, streak, daysSinceLast);
    if (didCbtToday) {
      narrativeMoment = 'post_lesson';
    } else if (streak >= 1 && narrativeMoment !== 'missed_days') {
      narrativeMoment = 'streak_active';
    }

    // CTA label is owned by buildAdaptiveContent (moment-based) — kept intact.
    const baseAdaptive = buildAdaptiveContent(
      narrativeMoment,
      firstName,
      streak,
      hasCheckedInToday,
    );

    const smart = buildSmartGreeting({
      timeOfDay: getTimeOfDay(),
      streak,
      didBreathingToday,
      didCbtToday,
      hasCheckedInToday,
      firstName,
      reflectedYesterday: false, // TODO: wire up from journal data
    });

    const adaptiveContent: AdaptiveContent = {
      ...baseAdaptive,
      headline: smart.headline,
      subline: smart.subline,
    };

    // Build recommendation reason from recent activity
    const recommendationReason =
      recommendations.length > 0
        ? 'Based on your recent activity'
        : null;

    const timeOfDay = getTimeOfDay();
    const intention = getDailyIntention(timeOfDay);

    return {
      greeting: buildGreeting(profile),
      dayCount: calcDayCount(profile),
      streak,
      narrativeMoment,
      adaptiveContent,
      recommendationReason,
      intention,
      todayMood: getTodayMood(moodEntries),
      moodEntries,
      recommendations,
      recentEvents,
      profile,
    };
  }
}

export const homeViewModel = new HomeViewModel();
export default homeViewModel;
