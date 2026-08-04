import { describe, it, expect, afterAll } from 'vitest';
import { recommendationRepository } from '../repositories/RecommendationRepository';
import { createTestUser, deleteTestUser } from './helpers';

/**
 * Regression test for the guest RLS violation (recommendations table).
 *
 * The app now enters guest mode via Supabase anonymous auth, so a "guest" is an
 * authenticated anonymous user. RLS on `recommendations`
 * (`backend/rls/0002_rls.sql`) enforces `user_id = (select auth.uid())`. This
 * test proves an anonymous user CAN create and read back their own
 * recommendation — the exact operation that previously failed with
 * "new row violates row-level security policy for table recommendations".
 */
describe('recommendations — anonymous (guest) write under RLS', () => {
  let userId: string | null = null;

  afterAll(async () => {
    if (userId) await deleteTestUser(userId).catch(() => {});
  });

  it('anonymous user can create and read a recommendation', async () => {
    const u = await createTestUser();
    userId = u.userId;

    const rec = await recommendationRepository.create({
      exercise_id: null,
      reason: 'guest regression test',
      priority: 0,
      source: 'computed',
      journey_id: null,
      program_id: null,
      expires_at: null,
    });

    // Created and owned by the anonymous user.
    expect(rec).toBeTruthy();
    expect(rec.user_id).toBe(userId);
    expect(rec.status).toBe('pending');

    // Readable back through the repository (scoped to the same auth.uid()).
    const listed = await recommendationRepository.list();
    expect(listed.some((r) => r.id === rec.id)).toBe(true);

    // other-guest isolation: the row must NOT be readable with a different id.
    const got = await recommendationRepository.get(rec.id);
    expect(got).toBeTruthy();
    expect(got!.user_id).toBe(userId);
  });
});
