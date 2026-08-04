/**
 * Shared helpers for the Jouspace integration tests.
 *
 * NOTE ON IDENTITIES: This project's email validator rejects `.test`/plus-address
 * domains, and confirmation emails are rate-limited — so we cannot reliably use
 * email/password `signUp` for throwaway users in CI/live runs. Instead we create
 * throwaway identities via `authRepository.signInAnonymously()`. Each anonymous
 * sign-in produces a DISTINCT, authenticated auth user (with its own `profiles`
 * row created by the `handle_new_user()` trigger), giving equivalent isolation
 * guarantees for integration testing. See the final report / FREEZE.md.
 */
import { authRepository } from '../repositories/AuthRepository';
import { createServiceRoleClient } from 'backend/client';

export const TEST_PASSWORD = 'Jouspace!Test123';

export interface TestUser {
  userId: string;
}

/** Create a throwaway, distinct, authenticated identity (anonymous). */
export async function createTestUser(): Promise<TestUser> {
  const { user } = await authRepository.signInAnonymously();
  if (!user) throw new Error('createTestUser: anonymous sign-in returned no user');
  return { userId: user.id };
}

/**
 * Permanently delete a test identity (and cascade its profile + all owned rows)
 * using the SERVER-ONLY service-role client. Reads the key from `process.env`
 * (loaded by setup.ts from the gitignored `.env`). Never import this into UI.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`deleteTestUser(${userId}) failed: ${error.message}`);
}
