import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homeService } from '../HomeService';
import type { HomeScreenData } from '../HomeViewModel';

const baseFixture: HomeScreenData = {
  greeting: 'Good morning, Alex',
  dayCount: 12,
  streak: 3,
  narrativeMoment: 'morning_fresh',
  adaptiveContent: {
    headline: 'Good morning, Alex',
    subline: 'Ready to start today?',
    ctaLabel: 'Begin check-in',
  },
  recommendationReason: 'Based on your recent activity',
  intention: 'Stay present.',
  todayMood: null,
  moodEntries: [],
  recommendations: [
    {
      id: 'rec-1',
      user_id: 'u1',
      reason: 'Because you enjoyed breathing',
      source: 'ai',
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ] as any,
  recentEvents: [],
  profile: {
    id: 'u1',
    display_name: 'Alex Doe',
    username: 'alex',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any,
};

vi.mock('@/features/home/services/HomeViewModel', () => ({
  homeViewModel: {
    getHomeScreenData: vi.fn(),
  },
}));

vi.mock('../../../../../backend/services/MissionService', () => ({
  missionService: {
    ensureTodaysMission: vi.fn(),
    completeMission: vi.fn(),
  },
}));

vi.mock('../../../../../backend/services/JournalService', () => ({
  journalService: {
    list: vi.fn(),
  },
}));

vi.mock('../../../../../backend/services/ProgressService', () => ({
  progressService: {
    list: vi.fn(),
  },
}));

vi.mock('../../../../../backend/services/NotificationService', () => ({
  notificationService: {
    list: vi.fn(),
  },
}));

import { homeViewModel } from '@/features/home/services/HomeViewModel';
import { missionService } from '../../../../../backend/services/MissionService';
import { journalService } from '../../../../../backend/services/JournalService';
import { progressService } from '../../../../../backend/services/ProgressService';
import { notificationService } from '../../../../../backend/services/NotificationService';

describe('HomeService.fetchHomeState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T14:00:00')); // 2:00 PM local time
    vi.clearAllMocks();
    (homeViewModel.getHomeScreenData as any).mockResolvedValue(baseFixture);
    (missionService.ensureTodaysMission as any).mockResolvedValue({
      id: 'm-1',
      user_id: 'u1',
      title: 'Morning Breathing',
      description: 'A 5 minute practice',
      source: 'journey',
      status: 'active',
      program_id: 'prog-1',
      lesson_id: 'lesson-1',
      assigned_for_date: new Date().toISOString().slice(0, 10),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    (journalService.list as any).mockResolvedValue([]);
    (progressService.list as any).mockResolvedValue([
      {
        id: 'p1',
        user_id: 'u1',
        status: 'completed',
        lesson_id: 'l1',
        exercise_id: 'e1',
        program_id: 'prog-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    (notificationService.list as any).mockResolvedValue([
      {
        id: 'n1',
        user_id: 'u1',
        type: 'system',
        channel: 'in_app',
        title: 'Welcome',
        body: '',
        data: {},
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns all 8 Home Intelligence Layer sections', async () => {
    const state = await homeService.fetchHomeState();

    expect(state.greeting.text).toBe('Good morning, Alex');
    expect(state.greeting.firstName).toBe('Alex');
    expect(state.greeting.moment).toBe('morning_fresh');
    expect(state.todaysMission?.title).toBe('Morning Breathing');
    expect(state.reflection.reflectedToday).toBe(false);
    expect(state.mood.streak).toBe(3);
    expect(state.mood.dayCount).toBe(12);
    expect(state.recommendation.primary?.id).toBe('rec_default_breathe');
    expect(state.progress.completedLessons).toBe(1);
    expect(state.progress.completedExercises).toBe(1);
    expect(state.notifications.unreadCount).toBe(1);
    expect(state.notifications.items).toHaveLength(1);
  });

  it('isolates a failing section instead of blanking the whole home', async () => {
    (missionService.ensureTodaysMission as any).mockRejectedValue(new Error('boom'));

    const state = await homeService.fetchHomeState();

    expect(state.todaysMission).toBeNull();
    // Everything else is still present.
    expect(state.greeting.text).toBe('Good morning, Alex');
    expect(state.notifications.unreadCount).toBe(1);
  });
});
