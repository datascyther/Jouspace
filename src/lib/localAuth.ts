/**
 * Local, backend-free mock authentication.
 *
 * This module is the ONLY surface the UI touches for auth. Every function
 * returns a Promise so the call sites already look like real network calls.
 * When the real backend lands, swap the function bodies for fetch/SDK calls —
 * the `AuthUser` shape and the function signatures stay identical, so the
 * AuthScreen and App wiring won't need to change.
 *
 * NOTE: This is a local mock. Passwords are hashed with a trivial, NON-secure
 * hash and stored in localStorage. Do NOT treat any of this as real security —
 * it exists purely so the auth flow can be exercised in the running app before
 * the backend exists.
 */

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  joinedDate: string;
  verified: boolean;
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

const SESSION_KEY = 'jouspace:auth:session';
const USERS_KEY = 'jouspace:auth:users';

interface StoredUser extends AuthUser {
  passwordHash: string;
}

// Simulate network latency so loading states are visible during testing.
const FAKE_LATENCY_MS = 350;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, StoredUser>;
  } catch {
    /* corrupt storage → start fresh */
  }
  return {};
}

function saveUsers(users: Record<string, StoredUser>): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* storage disabled → ignore, session still works in-memory for the run */
  }
}

// Trivial, NON-secure hash — local mock only.
function hash(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (h << 5) - h + password.charCodeAt(i);
    h |= 0;
  }
  return `mock$${h}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Read the persisted session, if any. */
export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    /* ignore */
  }
  return null;
}

/** Persist the active session (and keep the users table in sync). */
export function saveSession(user: AuthUser): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
  const users = loadUsers();
  const existing = users[user.email.toLowerCase()];
  if (existing) {
    users[user.email.toLowerCase()] = { ...existing, ...user, passwordHash: existing.passwordHash };
    saveUsers(users);
  }
}

/** Clear the active session (sign out). */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Create a new account. Returns the (unverified) user on success. */
export async function signUp(
  displayName: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  await wait(FAKE_LATENCY_MS);
  const name = displayName.trim();
  const mail = email.trim().toLowerCase();

  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!isValidEmail(mail)) return { ok: false, error: 'Enter a valid email address.' };
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }

  const users = loadUsers();
  if (users[mail]) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}`,
    email: mail,
    displayName: name,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    verified: false,
    passwordHash: hash(password),
  };
  users[mail] = user;
  saveUsers(users);

  const { passwordHash: _omit, ...safe } = user;
  return { ok: true, user: safe };
}

/** Sign in with existing credentials. */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  await wait(FAKE_LATENCY_MS);
  const mail = email.trim().toLowerCase();
  const users = loadUsers();
  const user = users[mail];
  if (!user || user.passwordHash !== hash(password)) {
    return { ok: false, error: 'Incorrect email or password.' };
  }
  const { passwordHash: _omit, ...safe } = user;
  return { ok: true, user: safe };
}

/**
 * "Send" a verification code. In the mock we don't actually deliver anything —
 * the verify screen just accepts any 6-digit code. Returns ok so the UI can
 * advance to the verify step.
 */
export async function requestVerificationCode(_email: string): Promise<{ ok: true }> {
  await wait(FAKE_LATENCY_MS);
  return { ok: true };
}

/** Verify the email with a 6-digit code. Any 6 digits pass in the mock. */
export async function verifyEmail(user: AuthUser, code: string): Promise<AuthResult> {
  await wait(FAKE_LATENCY_MS);
  if (!/^\d{6}$/.test(code.trim())) {
    return { ok: false, error: 'Enter the 6-digit code we sent.' };
  }
  const verified: AuthUser = { ...user, verified: true };
  saveSession(verified);
  return { ok: true, user: verified };
}

/** "Send" a password reset link (mock — no email is actually sent). */
export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await wait(FAKE_LATENCY_MS);
  const mail = email.trim().toLowerCase();
  if (!isValidEmail(mail)) return { ok: false, error: 'Enter a valid email address.' };
  // We don't reveal whether the account exists (would leak accounts in prod);
  // the mock just pretends it worked.
  return { ok: true };
}
