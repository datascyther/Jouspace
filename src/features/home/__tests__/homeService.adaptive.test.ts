/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from 'vitest';

// HomeService depends on backend services + homeViewModel; we mock the
// aggregation layer so we can exercise fetchHomeState's adaptive wiring
// (recommendation.salient + todaysMission passthrough) in isolation.
vi.mock('@/features/home/services/HomeViewModel', () => ({
  homeViewModel: {
    getHomeScreenData: vi.fn(async () => ({
      greeting: 'Welcome',
      profile: null,
      narrativeMoment: 'default',
      adaptiveContent: { headline: 'Hi', subline: 'Day' },
      intention: '',
      todayMood: null,
      moodEntries: [],
      streak: 0,
      dayCount: 0,
      recommendations: [],
      recentEvents: [],
    })),
  },
}));

vi.mock('../../../../backend/services/MissionService', () => ({
  missionService: { ensureTodaysMission: vi.fn(async () => null) },
}));
vi.mock('../../../../backend/services/JournalService', () => ({
  journalService: { list: vi.fn(async () => []) },
}));
vi.mock('../../../../backend/services/ProgressService', () => ({
  progressService: { list: vi.fn(async () => []) },
}));
vi.mock('../../../../backend/services/NotificationService', () => ({
  notificationService: { list: vi.fn(async () => []) },
}));

function load() {
  return import('@/features/home/services/HomeService');
}

function dayAt(hour: number, rating: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return { id: `m-${hour}`, rating, note: '', timestamp: d };
}

describe('HomeService.fetchHomeState — adaptive layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the recommendation salient for a low-mood check-in', async () => {
    const { homeService } = await load();
    // Mock mood entries via the view model mock is not directly possible
    // here, so we instead assert the generator through a controlled path:
    // inject a stress mood by overriding getHomeScreenData mid-test.
    const { homeViewModel } = await import('@/features/home/services/HomeViewModel');
    (homeViewModel.getHomeScreenData as any).mockResolvedValueOnce({
      greeting: 'Welcome',
      profile: null,
      narrativeMoment: 'default',
      adaptiveContent: { headline: 'Hi', subline: 'Day' },
      intention: '',
      todayMood: dayAt(10, 2) as any,
      moodEntries: [dayAt(10, 2) as any],
      streak: 0,
      dayCount: 1,
      recommendations: [],
      recentEvents: [],
    });
    const state = await homeService.fetchHomeState();
    expect(state.recommendation.primary).toBeTruthy();
    expect(state.recommendation.salient).toBe(true);
  });

  it('marks the recommendation non-salient in the generic/default branch', async () => {
    const { homeService } = await load();
    // No mood logged and hour chosen to avoid morning/night branches is not
    // deterministic; instead assert the default path via a controlled injection.
    const { homeViewModel } = await import('@/features/home/services/HomeViewModel');
    (homeViewModel.getHomeScreenData as any).mockResolvedValueOnce({
      greeting: 'Welcome',
      profile: null,
      narrativeMoment: 'default',
      adaptiveContent: { headline: 'Hi', subline: 'Day' },
      intention: '',
      todayMood: null,
      moodEntries: [],
      streak: 0,
      dayCount: 0,
      recommendations: [],
      recentEvents: [],
    });
    // Force the generic branch by stubbing Date to a midday hour with no moods.
    const realNow = Date.now;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 14, 0, 0));
    try {
      const state = await homeService.fetchHomeState();
      expect(state.recommendation.primary).toBeTruthy();
      expect(state.recommendation.salient).toBe(false);
    } finally {
      vi.useRealTimers();
      Date.now = realNow;
    }
  });

  it('passes through todaysMission (null when no active journey)', async () => {
    const { homeService } = await load();
    const state = await homeService.fetchHomeState();
    expect(state.todaysMission).toBeNull();
  });
});
