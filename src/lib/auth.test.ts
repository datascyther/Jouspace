import { describe, it, expect, beforeEach } from 'vitest';
import {
  NoAccountUser,
  isNoAccountUser,
  loadSession,
  saveSession,
  clearSession,
  signUp,
  signIn,
  isFirebaseConfigured,
} from './auth';

// The test environment has no Firebase web keys, so `signUp`/`signIn` exercise
// their input-validation paths and the "not configured" branch.

describe('auth: NoAccountUser + isNoAccountUser', () => {
  it('treats NoAccountUser as the no-account placeholder', () => {
    expect(isNoAccountUser(NoAccountUser)).toBe(true);
  });

  it('returns false for null and for a normal user', () => {
    expect(isNoAccountUser(null)).toBe(false);
    expect(
      isNoAccountUser({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'A',
        joinedDate: '',
        verified: false,
      }),
    ).toBe(false);
  });
});

describe('auth: session mirror', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadSession returns null when nothing is persisted', () => {
    expect(loadSession()).toBeNull();
  });

  it('saveSession + loadSession round-trip the user', () => {
    const user = {
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ada',
      joinedDate: 'August 2026',
      verified: true,
    };
    saveSession(user);
    expect(loadSession()).toEqual(user);
  });

  it('clearSession removes the persisted mirror', async () => {
    saveSession({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ada',
      joinedDate: '',
      verified: false,
    });
    await clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe('auth: signUp input validation', () => {
  it('rejects an empty name', async () => {
    const res = await signUp('', 'a@b.com', 'secret123');
    expect(res.ok).toBe(false);
  });

  it('rejects an invalid email', async () => {
    const res = await signUp('Ada', 'not-an-email', 'secret123');
    expect(res.ok).toBe(false);
  });

  it('rejects a short password', async () => {
    const res = await signUp('Ada', 'a@b.com', '123');
    expect(res.ok).toBe(false);
  });

  it('reports not-configured when Firebase keys are absent', async () => {
    if (isFirebaseConfigured) return; // guarded; real SDK path not tested here
    const res = await signUp('Ada', 'a@b.com', 'secret123');
    expect(res.ok).toBe(false);
  });
});

describe('auth: signIn input validation', () => {
  it('reports not-configured rather than throwing with bad input', async () => {
    if (isFirebaseConfigured) return;
    const res = await signIn('a@b.com', 'secret123');
    expect(res.ok).toBe(false);
  });
});
