import { describe, it, expect, afterAll } from 'vitest';
import { journeyRepository } from '../repositories/JourneyRepository';
import { moodRepository } from '../repositories/MoodRepository';
import { authRepository } from '../repositories/AuthRepository';
import { RepositoryError } from '../repositories/baseRepository';
import { createTestUser, deleteTestUser } from './helpers';

/**
 * S0.9 — Error handling.
 * An operation attempted with NO authenticated session must fail fast by throwing
 * the typed `RepositoryError` (raised by getCurrentUserId), not hang or return
 * silently.
 */
describe('Error handling — unauthenticated operations', () => {
  let userId: string | null = null;

  afterAll(async () => {
    if (userId) await deleteTestUser(userId).catch(() => {});
  });

  it('throws RepositoryError when no session is present', async () => {
    await authRepository.signOut().catch(() => {});
    await expect(journeyRepository.list()).rejects.toBeInstanceOf(RepositoryError);
    await expect(moodRepository.list()).rejects.toBeInstanceOf(RepositoryError);
  });

  it('creates a throwaway user and performs a guarded op, then clears session', async () => {
    const u = await createTestUser();
    userId = u.userId;
    const j = await journeyRepository.create({ title: 'err-test' });
    await journeyRepository.remove(j.id).catch(() => {});
    await authRepository.signOut();
    expect(await authRepository.getSession()).toBeNull();
  });
});
