/**
 * Sunrise / sunset scheduling for the "System / Auto" theme mode.
 *
 * When the user picks "System", the active theme follows the time of day:
 * light between sunrise and sunset, dark otherwise. The next transition is
 * computed so the UI flips automatically without polling.
 *
 * A default schedule (6:30 → 18:30 local) is used when no precise location
 * is available. `setSunSchedule` lets callers supply a geolocation-derived
 * sunrise/sunset pair.
 */

import type { ThemeType } from '@/providers/ThemeProvider';

export interface SunSchedule {
  /** "HH:MM" 24h local time */
  sunrise: string;
  /** "HH:MM" 24h local time */
  sunset: string;
}

export const DEFAULT_SUN_SCHEDULE: SunSchedule = {
  sunrise: '06:30',
  sunset: '18:30',
};

let activeSchedule: SunSchedule = { ...DEFAULT_SUN_SCHEDULE };

/** Override the active schedule (e.g. from device geolocation). */
export function setSunSchedule(schedule: SunSchedule) {
  activeSchedule = { ...schedule };
}

export function getSunSchedule(): SunSchedule {
  return { ...activeSchedule };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

/** Light during [sunrise, sunset), dark otherwise. */
export function resolveSunTheme(now: Date, schedule: SunSchedule = activeSchedule): ThemeType {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const sunrise = toMinutes(schedule.sunrise);
  const sunset = toMinutes(schedule.sunset);
  return minutesNow >= sunrise && minutesNow < sunset ? 'light' : 'dark';
}

/**
 * Milliseconds from `now` until the next sunrise/sunset boundary, so the
 * caller can schedule a single timeout that re-resolves the theme.
 */
export function msUntilNextTransition(now: Date, schedule: SunSchedule = activeSchedule): number {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const sunrise = toMinutes(schedule.sunrise);
  const sunset = toMinutes(schedule.sunset);

  let nextBoundaryMinutes: number;
  if (minutesNow < sunrise) {
    nextBoundaryMinutes = sunrise;
  } else if (minutesNow < sunset) {
    nextBoundaryMinutes = sunset;
  } else {
    // after sunset → next sunrise (tomorrow)
    nextBoundaryMinutes = sunrise + 24 * 60;
  }

  const deltaMinutes = nextBoundaryMinutes - minutesNow;
  // add a small buffer so we don't flip a hair early
  return Math.max(1000, deltaMinutes * 60 * 1000 + 1000);
}

/**
 * Compute sunrise/sunset for a given date + latitude/longitude using a
 * compact solar-position approximation (good to a few minutes). Returns
 * times as "HH:MM" local strings. Falls back to the default schedule on
 * invalid input.
 */
export function computeSunSchedule(date: Date, lat: number, lng: number): SunSchedule {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return { ...DEFAULT_SUN_SCHEDULE };
  }

  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Solar declination
  const decl = 23.45 * Math.sin(rad * (360 / 365) * (dayOfYear - 81));
  // Hour angle for sunrise/sunset (solar elevation = -0.83°)
  const cosH =
    (Math.sin(-0.83 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) /
    (Math.cos(lat * rad) * Math.cos(decl * rad));

  if (cosH < -1 || cosH > 1) {
    // Polar day/night — fall back to default
    return { ...DEFAULT_SUN_SCHEDULE };
  }

  const h = (Math.acos(cosH) / rad) / 15; // hours from solar noon
  const solarNoon = 12 - date.getTimezoneOffset() / 60 - lng / 15;
  const sunriseHours = solarNoon - h;
  const sunsetHours = solarNoon + h;

  const fmt = (hours: number) => {
    const wrapped = ((hours % 24) + 24) % 24;
    const hh = Math.floor(wrapped);
    const mm = Math.round((wrapped - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
  };

  return { sunrise: fmt(sunriseHours), sunset: fmt(sunsetHours) };
}
