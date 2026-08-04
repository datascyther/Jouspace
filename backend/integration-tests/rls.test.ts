import { describe, it, expect, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { journeyRepository } from '../repositories/JourneyRepository';
import { authRepository } from '../repositories/AuthRepository';
import { createTestUser, deleteTestUser } from './helpers';

/**
 * S0.9 — RLS enforcement (CRITICAL). Own-data isolation.
 *
 * 1. Sign in as user A, create a journey. Switch the shared client to user B.
 * 2. Via the repository (authenticated as B) assert list()/get() return NO rows
 *    belonging to A — this is the app-layer isolation guarantee.
 * 3. Additionally perform a raw, DB-level RLS check: build a Supabase client
 *    authenticated with B's JWT and SELECT directly. The Postgres RLS policy
 *    must itself hide A's row — proving the isolation is enforced by the
 *    database, independent of the repository's own user_id filter.
 */
describe('RLS enforcement — own-data isolation', () => {
  let userA: string | null = null;
  let userB: string | null = null;
  let journeyAId: string | null = null;

  afterAll(async () => {
    if (userA) await deleteTestUser(userA).catch(() => {});
    if (userB) await deleteTestUser(userB).catch(() => {});
  });

  it('user B cannot read user A journey data (repository + raw RLS)', async () => {
    // --- User A creates a journey ---
    const a = await createTestUser();
    userA = a.userId;
    const journey = await journeyRepository.create({
      title: 'A confidential journey',
      category: 'general',
      status: 'active',
    });
    journeyAId = journey.id;

    // Sanity: A can read it.
    const aSees = await journeyRepository.get(journey.id);
    expect(aSees).toBeTruthy();
    expect(aSees!.user_id).toBe(userA);

    // --- Switch to User B ---
    const b = await createTestUser();
    userB = b.userId;

    // 1) Repository-level isolation (client authenticated as B)
    const bListed = await journeyRepository.list();
    expect(bListed.find((j) => j.id === journeyAId)).toBeUndefined();
    expect(bListed.every((j) => j.user_id === userB)).toBe(true);

    const bGot = await journeyRepository.get(journeyAId);
    expect(bGot).toBeNull();

    // 2) Raw DB-level RLS check with B's JWT (independent of repo filtering)
    const session = await authRepository.getSession();
    expect(session).toBeTruthy();
    const url =
      process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const anonKey =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      '';
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();

    const bClient: SupabaseClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${session!.access_token}` } },
    });
    const { data, error } = await bClient
      .from('journeys')
      .select('id, user_id');
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    // B must see only their own rows (none were created by B) and never A's.
    expect(data!.every((r) => r.user_id === userB)).toBe(true);
    expect(data!.find((r) => r.id === journeyAId)).toBeUndefined();
  });
});
