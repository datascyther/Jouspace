// src/features/home/utils/adaptiveContext.ts
//
// Pure helper — takes HomeScreenData and returns UI-ready context.
// No React imports. Fully testable.

import type { NarrativeMoment } from '@/features/home/services/HomeViewModel';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function getTimeEmoji(timeOfDay: TimeOfDay): string {
  const map: Record<TimeOfDay, string> = {
    morning: 'sunny',
    afternoon: 'sun',
    evening: 'moon',
    night: 'stars',
  };
  return map[timeOfDay];
}

/** Maps a NarrativeMoment to a background gradient pair for HeroCard */
export function getHeroGradient(moment: NarrativeMoment): [string, string, string] {
  const map: Record<NarrativeMoment, [string, string, string]> = {
    morning_fresh:     ['#18103c', '#2c1654', '#3f1f72'],
    afternoon_active:  ['#091d3c', '#112c58', '#1a417b'],
    evening_wind_down: ['#0f0a1c', '#1c1032', '#32144f'],
    post_lesson:       ['#081d11', '#10351e', '#1a4c2d'],
    missed_days:       ['#180f2e', '#241640', '#331f54'],
    streak_active:     ['#1a1233', '#2a1a4e', '#3a2466'],
    default:           ['#0c0b16', '#17142b', '#241f44'],
  };
  return map[moment];
}

/** Derives a short progress label for the hero card */
export function buildStreakLabel(streak: number): string | null {
  if (streak === 0) return null;
  if (streak === 1) return 'Day 1 · Just getting started';
  if (streak < 7) return `Day ${streak} · Building the habit`;
  if (streak < 30) return `Day ${streak} · Strong momentum`;
  return `Day ${streak} · Remarkable dedication`;
}
