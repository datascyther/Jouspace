/**
 * Auth Repository
 *
 * Thin typed wrapper around Supabase Auth. The DB trigger `handle_new_user()`
 * auto-creates a `profiles` row on sign-up, so callers can fetch the profile
 * afterwards via `ProfileRepository.getCurrent()`.
 */

import {
  BaseRepository,
  RepositoryError,
  toRepositoryError,
  type AuthErrorType,
  type AuthSession,
  type AuthSubscription,
  type AuthUser,
} from './baseRepository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

type AuthResponse = {
  user: AuthUser | null;
  session: AuthSession | null;
};

/** OAuth providers exposed by the app. Subset of Supabase's `Provider`. */
export type OAuthProvider =
  | 'google'
  | 'apple'
  | 'github'
  | 'azure'
  | 'twitter'
  | 'gitlab'
  | 'bitbucket'
  | 'discord'
  | 'slack'
  | 'spotify'
  | 'twitch'
  | 'linkedin'
  | 'notion';

export type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export type AuthStateCallback = (
  event: AuthChangeEvent,
  session: AuthSession | null,
) => void;

export class AuthRepository extends BaseRepository<'profiles'> {
  constructor() {
    super('profiles');
  }

  private mapAuthError(error: AuthErrorType, context: string): never {
    if (error) {
      throw new RepositoryError(`${context}: ${error.message}`, {
        code: error.code ?? String(error.status ?? ''),
        details: error,
      });
    }
    throw new RepositoryError(`${context}: Unknown auth error.`);
  }

  /** Create a new account. The `profiles` row is created by a DB trigger. */
  async signUp(
    email: string,
    password: string,
    meta?: { display_name?: string; username?: string; [key: string]: unknown },
  ): Promise<AuthResponse> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: meta ? { data: meta } : undefined,
    });
    if (error) this.mapAuthError(error, 'signUp');
    return { user: data.user ?? null, session: data.session ?? null };
  }

  /** Sign in with email + password. */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) this.mapAuthError(error, 'signIn');
    return { user: data.user ?? null, session: data.session ?? null };
  }

  /** Start an OAuth sign-in flow (redirect-based). */
  async signInWithProvider(
    provider: OAuthProvider,
    options: { redirectTo?: string; skipBrowserRedirect?: boolean } = {},
  ): Promise<{ url: string | null }> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        ...(options.redirectTo ? { redirectTo: options.redirectTo } : {}),
        ...(options.skipBrowserRedirect ? { skipBrowserRedirect: true } : {}),
      },
    });
    if (error) this.mapAuthError(error, 'signInWithProvider');
    return { url: data.url ?? null };
  }

  /** Convenience: Google OAuth sign-in (MVP requirement). */
  async signInWithGoogle(redirectTo?: string): Promise<{ url: string | null }> {
    return this.signInWithProvider('google', { redirectTo });
  }

  /**
   * Exchange an OAuth redirect URL (returned to the app's deep link after a
   * browser-based sign-in) for a Supabase session. Handles both the implicit
   * grant (tokens in the URL fragment) and the PKCE flow (`?code=`). Used by
   * the Expo/`expo-web-browser` Google sign-in flow.
   */
  async getSessionFromUrl(url: string): Promise<AuthSession | null> {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let code: string | null = null;
    try {
      const parsed = new URL(url);
      const fromHash = parsed.hash.startsWith('#')
        ? new URLSearchParams(parsed.hash.slice(1))
        : null;
      const get = (key: string): string | null =>
        (fromHash?.get(key) ?? null) ?? parsed.searchParams.get(key) ?? null;
      accessToken = get('access_token');
      refreshToken = get('refresh_token');
      code = get('code');
    } catch (error) {
      throw new RepositoryError(
        `getSessionFromUrl: ${error instanceof Error ? error.message : 'invalid redirect url'}`,
        { code: 'invalid_redirect' },
      );
    }

    if (accessToken && refreshToken) {
      const { data, error } = await this.client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) this.mapAuthError(error, 'getSessionFromUrl');
      return data.session ?? null;
    }

    if (code) {
      const { data, error } = await this.client.auth.exchangeCodeForSession(code);
      if (error) this.mapAuthError(error, 'getSessionFromUrl');
      return data.session ?? null;
    }

    throw new RepositoryError(
      'getSessionFromUrl: redirect url contained no access tokens or code.',
      { code: 'invalid_redirect' },
    );
  }

  /**
   * Anonymous guest sign-in (MVP optional requirement). Creates an ephemeral
   * user with no email; the `profiles` trigger still provisions a profile row.
   * The account can later be linked to a real credential via `linkIdentity`.
   */
  async signInAnonymously(): Promise<AuthResponse> {
    const { data, error } = await this.client.auth.signInAnonymously();
    if (error) this.mapAuthError(error, 'signInAnonymously');
    // `signInAnonymously` types only expose `user`; the session is present at
    // runtime, so read it defensively.
    const session = (data as { session?: AuthSession | null }).session ?? null;
    return { user: data.user ?? null, session };
  }

  /** Sign out the current session. */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) this.mapAuthError(error, 'signOut');
  }

  /**
   * Password reset. Sends a reset email with a link back into the app.
   * `redirectTo` should be a deep link handled by the app's auth callback.
   */
  async resetPassword(email: string, redirectTo?: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) this.mapAuthError(error, 'resetPassword');
  }

  /** Set a new password for the currently authenticated user. */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) this.mapAuthError(error, 'updatePassword');
  }

  /**
   * Promote the current anonymous (guest) session into a permanent
   * email/password account, keeping the same `auth.uid()`. All RLS-scoped rows
   * written during the guest session (recommendations, progress, moods, ...) are
   * therefore inherited rather than orphaned.
   */
  async convertAnonymousToEmail(
    email: string,
    password: string,
    meta?: { display_name?: string; name?: string; [key: string]: unknown },
  ): Promise<AuthResponse> {
    const { data, error } = await this.client.auth.updateUser({
      email,
      password,
      data: meta,
    });
    if (error) this.mapAuthError(error, 'convertAnonymousToEmail');
    // `updateUser` returns the user but not a fresh session; the existing
    // anonymous session is preserved in place.
    return { user: data.user ?? null, session: null };
  }

  /** True when the active session is an anonymous (guest) Supabase user. */
  async isAnonymous(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user && (user as { is_anonymous?: boolean }).is_anonymous === true;
  }

  /**
   * Resend the email verification / signup confirmation email.
   * (Supabase: `resend` with type `'signup'`.)
   */
  async resendVerificationEmail(email: string, redirectTo?: string): Promise<void> {
    const { error } = await this.client.auth.resend({
      type: 'signup',
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : {},
    });
    if (error) this.mapAuthError(error, 'resendVerificationEmail');
  }

  /**
   * Refresh the access token using the stored refresh token. Supabase also
   * auto-refreshes when `autoRefreshToken` is enabled (set on the client), but
   * this is the explicit manual trigger used by the AuthService on app resume.
   */
  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.refreshSession();
    if (error) this.mapAuthError(error, 'refreshSession');
    return data.session ?? null;
  }

  /** Get the active session (may be null when signed out). */
  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) this.mapAuthError(error, 'getSession');
    return data.session ?? null;
  }

  /** Get the currently authenticated user (may be null). */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) this.mapAuthError(error, 'getCurrentUser');
    return data.user ?? null;
  }

  /** Subscribe to auth state changes. Returns the subscription to unsubscribe. */
  onAuthStateChange(callback: AuthStateCallback): AuthSubscription {
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      callback(event as AuthChangeEvent, session);
    });
    return data.subscription;
  }

  /**
   * Delete the current user's account.
   *
   * Supabase only allows account deletion through the admin API, which
   * requires the service_role key. The caller must provide a service-role
   * client; this method does NOT work with the anon (RLS-scoped) client.
   * In production this should be called from a server/edge function.
   */
  async deleteAccount(adminClient?: SupabaseClient<Database>): Promise<void> {
    const userId = await this.getCurrentUserId();
    const client = adminClient ?? this.client;
    const admin = (client.auth as unknown as {
      admin?: { deleteUser: (id: string) => Promise<{ error: AuthErrorType }> };
    }).admin;
    if (!admin) {
      throw new RepositoryError(
        'deleteAccount requires a service-role admin client. ' +
        'Call `createServiceRoleClient()` from backend/client and pass the result.',
        { code: 'admin_required' },
      );
    }
    const { error } = await admin.deleteUser(userId);
    if (error) this.mapAuthError(error, 'deleteAccount');
  }
}

export const authRepository = new AuthRepository();
export default authRepository;
