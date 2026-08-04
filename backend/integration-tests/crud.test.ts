import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { journeyRepository } from '../repositories/JourneyRepository';
import { moodRepository } from '../repositories/MoodRepository';
import { authRepository } from '../repositories/AuthRepository';
import { createTestUser, deleteTestUser } from './helpers';

/**
 * S0.9 — CRUD round-trip through the repository layer (NOT raw Supabase).
 * Creates a journey + mood as the signed-in user, reads them back, updates,
 * deletes, and asserts the full round-trip against the live prod project.
 */
describe('CRUD round-trip (journeys + moods)', () => {
  let userId: string | null = null;
  const journeyIds: string[] = [];
  const moodIds: string[] = [];

  beforeAll(async () => {
    const u = await createTestUser();
    userId = u.userId;
  });

  afterAll(async () => {
    // Delete owned rows via the (signed-in) anon client, then remove the identity.
    for (const id of journeyIds) await journeyRepository.remove(id).catch(() => {});
    for (const id of moodIds) await moodRepository.remove(id).catch(() => {});
    await authRepository.signOut().catch(() => {});
    if (userId) await deleteTestUser(userId).catch(() => {});
  });

  it('creates → reads → updates → deletes a journey', async () => {
    const created = await journeyRepository.create({
      title: 'Integration Test Journey',
      category: 'general',
      status: 'active',
    });
    expect(created.id).toBeTruthy();
    journeyIds.push(created.id);

    const got = await journeyRepository.get(created.id);
    expect(got).toBeTruthy();
    expect(got!.title).toBe('Integration Test Journey');
    expect(got!.user_id).toBe(userId);

    const updated = await journeyRepository.update(created.id, {
      title: 'Renamed Journey',
      status: 'paused',
    });
    expect(updated.title).toBe('Renamed Journey');
    expect(updated.status).toBe('paused');

    const listed = await journeyRepository.list();
    expect(listed.find((j) => j.id === created.id)).toBeTruthy();

    await journeyRepository.remove(created.id);
    expect(await journeyRepository.get(created.id)).toBeNull();
  });

  it('creates → reads → updates → deletes a mood', async () => {
    const created = await moodRepository.create({ level: 'good', note: 'steady' });
    expect(created.id).toBeTruthy();
    moodIds.push(created.id);
    expect(created.user_id).toBe(userId);

    const got = await moodRepository.get(created.id);
    expect(got!.level).toBe('good');

    const updated = await moodRepository.update(created.id, { note: 'improving' });
    expect(updated.note).toBe('improving');

    await moodRepository.remove(created.id);
    expect(await moodRepository.get(created.id)).toBeNull();
  });
});
