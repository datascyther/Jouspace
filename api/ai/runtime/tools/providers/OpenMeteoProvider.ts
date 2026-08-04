/**
 * Jouspace — AI Runtime: Open-Meteo Provider (free, no key)
 *
 * Current weather + air quality. No geocoding API key needed — callers pass
 * lat/lon. If absent, we derive a generic wellness note without coordinates.
 */

import type { Citation } from '../../types';

export interface WeatherResult {
  title: string;
  content: string;
  url: string;
  snippet?: string;
  confidence: number;
  source: string;
  publishedAt: string;
}

function describeWeather(t: any, aqi: number | null): string {
  const temp = t?.temperature_2m;
  const code = t?.weather_code;
  const wind = t?.wind_speed_10m;
  const humidity = t?.relative_humidity_2m;
  const parts: string[] = [];
  if (typeof temp === 'number') parts.push(`Temperature is ${Math.round(temp)}°C`);
  if (typeof code === 'number') parts.push(`(weather code ${code})`);
  if (typeof wind === 'number') parts.push(`wind ${Math.round(wind)} km/h`);
  if (typeof humidity === 'number') parts.push(`humidity ${Math.round(humidity)}%`);
  let body = parts.join(', ') + '.';
  if (typeof aqi === 'number') {
    body += ` Air Quality Index is ${aqi} (lower is better; >100 is unhealthy).`;
  }
  return body;
}

export class OpenMeteoProvider {
  readonly name = 'Open-Meteo';

  /**
   * Free geocoding via Open-Meteo (no key). Returns the first match's
   * coordinates so a city name extracted from the user's text can be resolved
   * to a real forecast. Returns null when offline or no match.
   */
  /**
   * Pull a location name out of a free-text question. Handles "in <Place>",
   * "for <Place>", "near <Place>", and a trailing capitalized word/phrase.
   * Returns null when nothing plausible is found.
   */
  private extractLocation(query: string): string | null {
    const q = query.trim();
    const prepositions = q.match(/\b(?:in|for|near|at|of)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/);
    if (prepositions) return prepositions[1].trim();
    const trailing = q.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\s*\?*\s*$/);
    if (trailing) return trailing[1].trim();
    return null;
  }

  async geocode(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
    const place = this.extractLocation(query) ?? query.trim();
    if (!place) return null;
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = res.ok ? await res.json().catch(() => null) : null;
      const hit = data?.results?.[0];
      if (hit && typeof hit.latitude === 'number' && typeof hit.longitude === 'number') {
        return { lat: hit.latitude, lon: hit.longitude, name: hit.name ?? place };
      }
    } catch {}
    return null;
  }

  async getWeather(lat?: number, lon?: number): Promise<WeatherResult | null> {
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;

    const now = new Date().toISOString();
    try {
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
      const wxRes = await fetch(wxUrl, { headers: { Accept: 'application/json' } });
      const wx = wxRes.ok ? await wxRes.json().catch(() => null) : null;

      let aqi: number | null = null;
      try {
        const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;
        const aqRes = await fetch(aqUrl, { headers: { Accept: 'application/json' } });
        const aq = aqRes.ok ? await aqRes.json().catch(() => null) : null;
        aqi = aq?.current?.european_aqi ?? null;
      } catch {
        aqi = null;
      }

      return {
        title: 'Current weather',
        content: describeWeather(wx?.current, aqi),
        url: 'https://open-meteo.com/',
        snippet: describeWeather(wx?.current, aqi).slice(0, 200),
        confidence: 0.92,
        source: this.name,
        publishedAt: now,
      };
    } catch {
      return null;
    }
  }
}

export function toCitation(r: WeatherResult): Citation {
  return {
    title: r.title,
    url: r.url,
    source: r.source,
    publishedAt: r.publishedAt,
    snippet: r.snippet,
    confidence: r.confidence,
  };
}
