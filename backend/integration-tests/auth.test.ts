import { describe, it, expect, afterAll } from 'vitest';
import { authRepository } from '../repositories/AuthRepository';
import { authService } from '../services/AuthService';
import { createTestUser, deleteTestUser } from './helpers';

/**
 * S0.9 — Authentication integration.
 * Uses anonymous sign-in as the throwaway identity (see helpers.ts note).
 * Covers: sign-in, getSession, session restore via init(), refresh, signOut.
 */
describe('Authentication lifecycle', () => {
  let userId: string | null = null;

  afterAll(async () => {
    if (userId) await deleteTestUser(userId).catch(() => {});
  });

  it('signs in (throwaway identity), exposes a session, restores it via init() and refreshSession()', async () => {
    const { user } = await authRepository.signInAnonymously();
    expect(user).toBeTruthy();
    userId = user!.id;

    const session = await authRepository.getSession();
    expect(session).toBeTruthy();
    expect(session!.user.id).toBe(userId);

    // init() restores the (in-memory under Node) persisted session.
    await authService.init();
    expect(authService.getSession()).toBeTruthy();
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getSession()!.user.id).toBe(userId);

    // Explicit refresh returns a (non-null) session without throwing.
    const refreshed = await authService.refreshSession();
    expect(refreshed).toBeTruthy();
    expect(refreshed!.user.id).toBe(userId);
  });

  it('signOut() clears the session', async () => {
    await authRepository.signOut();
    const session = await authRepository.getSession();
    expect(session).toBeNull();
  });
});
