/**
 * Jouspace — AI Runtime: Weather Tool (capability WEATHER)
 *
 * Open-Meteo (free) — current weather + air quality. Coordinates come from
 * ToolInput.location (forwarded by the client from device/profile later).
 */

import type { Tool, ToolInput } from './Tool';
import { Capability, type ToolResult } from '../types';
import type { CacheManager } from '../cache/CacheManager';
import { OpenMeteoProvider, toCitation as wxCite } from './providers/OpenMeteoProvider';

export class WeatherTool implements Tool {
  readonly capability = Capability.WEATHER;
  readonly name = 'WeatherTool';

  constructor(
    private cache: CacheManager,
    private meteo = new OpenMeteoProvider(),
  ) {}

  async run(input: ToolInput): Promise<ToolResult> {
    let { lat, lon } = input.location ?? {};

    // No coordinates supplied (e.g. the user asked about a city by name) — try
    // to resolve the location from the query text via free Open-Meteo geocoding
    // so real-time weather can still be returned.
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      const geo = await this.meteo.geocode(input.query).catch(() => null);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }

    // Cache key is coordinate + current hour so real-time data stays fresh and
    // a failed lookup is never cached (we only set on success below).
    const hour = new Date().toISOString().slice(0, 13);
    const query = typeof lat === 'number' && typeof lon === 'number'
      ? `current:${lat.toFixed(2)},${lon.toFixed(2)}:${hour}`
      : `current:${hour}`;

    const cached = this.cache.get<ToolResult>(this.capability, query);
    if (cached) return cached;

    const r = await this.meteo.getWeather(lat, lon);
    const citations = r ? [wxCite(r)] : [];
    const payload = r ? `${r.title}: ${r.content}` : '';

    const result: ToolResult = {
      capability: this.capability,
      success: citations.length > 0,
      confidence: citations.length ? citations[0].confidence : 0,
      timestamp: new Date().toISOString(),
      sources: citations,
      payload,
    };
    // Only cache successful lookups; failures fall through next time.
    if (result.success) this.cache.set(this.capability, query, result);
    return result;
  }
}
