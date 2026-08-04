import { describe, it, expect, vi, afterEach } from 'vitest';
import { WikipediaProvider } from './WikipediaProvider';
import { OpenMeteoProvider } from './OpenMeteoProvider';
import { GoogleNewsRssProvider } from './GoogleNewsRssProvider';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WikipediaProvider', () => {
  it('returns structured results from the API', async () => {
    vi.stubGlobal('fetch', async () =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              '1': {
                title: 'CBT',
                fullurl: 'https://en.wikipedia.org/wiki/Cognitive_behavioral_therapy',
                extract: 'Cognitive behavioral therapy is a psycho-social intervention.',
              },
            },
          },
        }),
      }) as any,
    );
    const r = await new WikipediaProvider().search('CBT');
    expect(r.length).toBe(1);
    expect(r[0].source).toBe('Wikipedia');
    expect(r[0].url).toContain('wikipedia');
    expect(r[0].confidence).toBeGreaterThan(0);
  });

  it('returns [] on non-ok', async () => {
    vi.stubGlobal('fetch', async () => Promise.resolve({ ok: false }) as any);
    const r = await new WikipediaProvider().search('x');
    expect(r).toEqual([]);
  });
});

describe('OpenMeteoProvider', () => {
  it('describes weather and AQI', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      Promise.resolve({
        ok: true,
        json: async () => {
          if (url.includes('air-quality')) {
            return { current: { european_aqi: 42 } };
          }
          return { current: { temperature_2m: 21, weather_code: 1, wind_speed_10m: 5, relative_humidity_2m: 60 } };
        },
      }) as any,
    );
    const r = await new OpenMeteoProvider().getWeather(35.6, 139.7);
    expect(r).not.toBeNull();
    expect(r!.content).toContain('21');
    expect(r!.content).toContain('Air Quality Index');
    expect(r!.source).toBe('Open-Meteo');
  });

  it('returns null without coordinates', async () => {
    const r = await new OpenMeteoProvider().getWeather();
    expect(r).toBeNull();
  });
});

describe('GoogleNewsRssProvider', () => {
  it('parses RSS items', async () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item><title>AI breakthrough today</title><link>https://news.example/1</link><pubDate>Wed, 17 Jul 2026 10:00:00 GMT</pubDate><source url="https://reuters.com">Reuters</source></item>
      <item><title>Another headline</title><link>https://news.example/2</link><pubDate>Wed, 17 Jul 2026 09:00:00 GMT</pubDate><source url="https://ap.org">AP</source></item>
    </channel></rss>`;
    vi.stubGlobal('fetch', async () => Promise.resolve({ ok: true, text: async () => xml }) as any);
    const r = await new GoogleNewsRssProvider().search('AI');
    expect(r.length).toBe(2);
    expect(r[0].title).toContain('AI breakthrough');
    expect(r[0].source).toBe('Reuters');
    expect(r[0].url).toContain('news.example');
  });
});
