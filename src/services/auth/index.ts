import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  authService as backendAuthService,
  type AuthUser,
  RepositoryError,
} from '../../../backend/services/AuthService';
import { profileRepository } from '../../../backend/repositories/ProfileRepository';
import { userPreferencesService } from '../../../backend/services/UserPreferencesService';
import { storageService } from '@/services/storage';
import { analyticsService } from '@/services/analytics';
import type { UserProfile, AuthCredentials, SignUpData } from './types';
import { supabase } from 'backend/client';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

const SUPABASE_ERROR_MAP: Record<string, string> = {
  'invalid_credentials': 'Invalid email or password.',
  'email_not_confirmed': 'Please verify your email before signing in.',
  'user_not_found': 'No account found with this email.',
  'email_taken': 'An account with this email already exists.',
  'weak_password': 'Password is too weak. Please choose a stronger password.',
  'too_many_requests': 'Too many attempts. Please try again later.',
  'provider_disabled': 'This sign-in method is not available.',
  'OTPExpired': 'The verification code has expired.',
  'over_email_send_rate_limit': 'Too many emails sent. Please try again later.',
  'over_request_rate_limit': 'Too many requests. Please try again later.',
};

function mapSupabaseError(error: unknown): string {
  if (error instanceof RepositoryError) {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return SUPABASE_ERROR_MAP.invalid_credentials;
    if (msg.includes('email not confirmed')) return SUPABASE_ERROR_MAP.email_not_confirmed;
    if (msg.includes('user already registered')) return SUPABASE_ERROR_MAP.email_taken;
    if (msg.includes('weak password')) return SUPABASE_ERROR_MAP.weak_password;
    if (msg.includes('rate limit')) return SUPABASE_ERROR_MAP.too_many_requests;
    if (msg.includes('otp expired')) return SUPABASE_ERROR_MAP.OTPExpired;
    return 'Something went wrong. Please try again.';
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code === 'over_email_send_rate_limit') return SUPABASE_ERROR_MAP.over_email_send_rate_limit;
    if (code === 'over_request_rate_limit') return SUPABASE_ERROR_MAP.over_request_rate_limit;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function mapAuthUserToProfile(
  authUser: AuthUser,
  profile: Record<string, any> | null,
): UserProfile {
  return {
    uid: authUser.id,
    name: profile?.display_name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    phoneNumber: authUser.phone || undefined,
    photoURL: profile?.avatar_url || authUser.user_metadata?.avatar_url || undefined,
    createdAt: new Date(profile?.created_at || authUser.created_at),
    updatedAt: new Date(profile?.updated_at || authUser.created_at),
    lastLoginAt: new Date(profile?.last_login_at || authUser.last_sign_in_at || authUser.created_at),
    preferences: {
      theme: (profile?.theme as any) || 'dark',
      notifications: profile?.notifications_enabled !== false,
      language: (profile?.locale as any) || 'en',
      tone: 'auto',
    },
    stats: {
      totalSessions: 0,
      totalMinutes: 0,
      streakDays: 0,
      lastActivityDate: new Date(),
    },
    onboardingCompleted: profile?.onboarding_completed || false,
    displayName: profile?.display_name || authUser.email?.split('@')[0] || 'User',
  };
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private userProfile: UserProfile | null = null;
  private listeners: Array<(user: UserProfile | null) => void> = [];
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private backendUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async hydrateProfile(authUser: AuthUser): Promise<UserProfile> {
    try {
      const profileRow = await profileRepository.getCurrent();
      let preferences: Record<string, any> = {};
      try {
        const prefs = await userPreferencesService.get();
        if (prefs) preferences = prefs;
      } catch {
        // preferences may not exist yet
      }

      const profile = mapAuthUserToProfile(authUser, {
        ...profileRow,
        ...preferences,
      });

      if ((authUser as any)?.is_anonymous) {
        profile.onboardingCompleted = true;
      }

      return profile;
    } catch {
      const profile = mapAuthUserToProfile(authUser, null);
      if ((authUser as any)?.is_anonymous) {
        profile.onboardingCompleted = true;
      }
      return profile;
    }
  }

  private async initialize(): Promise<void> {
    try {
      await backendAuthService.init();
      this.syncState();
    } catch {
      // initialization failed silently
    }

    this.backendUnsubscribe = backendAuthService.subscribe((session, user) => {
      this.currentUser = user;
      if (user) {
        void this.hydrateProfile(user)
          .then((profile) => {
            this.userProfile = profile;
            this.notifyListeners(this.userProfile);
          })
          .catch((err) => {
            // Never let a failed profile hydration become an unhandled rejection
            // (which can silently terminate the app, e.g. on guest sign-in).
            console.warn('[auth] hydrateProfile failed:', err);
          });
      } else {
        this.userProfile = null;
        this.notifyListeners(null);
      }
    });

    this.initialized = true;
  }

  private syncState(): void {
    const user = backendAuthService.getCurrentUser();
    this.currentUser = user;
    if (user) {
      void this.hydrateProfile(user)
        .then((profile) => {
          this.userProfile = profile;
          this.notifyListeners(this.userProfile);
        })
        .catch((err) => {
          console.warn('[auth] hydrateProfile (syncState) failed:', err);
        });
    }
  }

  isConfigured(): boolean {
    return true;
  }

  async waitForInitialization(): Promise<void> {
    if (this.initialized) return;
    await this.initializationPromise;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async signInWithEmail({ email, password }: AuthCredentials): Promise<UserProfile> {
    try {
      const { user } = await backendAuthService.signIn(email, password);
      if (!user) throw new Error('Sign in failed: no user returned.');

      this.currentUser = user;
      this.userProfile = await this.hydrateProfile(user);

      if (this.userProfile) {
        try {
          await profileRepository.update(user.id, {
            last_login_at: new Date().toISOString(),
          });
          this.userProfile.lastLoginAt = new Date();
        } catch {
          // non-critical
        }
      }

      this.notifyListeners(this.userProfile);
      analyticsService.trackEvent('auth_signin', { method: 'email' });

      if (!this.userProfile) throw new Error('Failed to load profile');
      return this.userProfile;
    } catch (error) {
      throw new Error(mapSupabaseError(error));
    }
  }

  async signInWithGoogle(): Promise<UserProfile> {
    // Build the post-auth redirect target. On web we use the browser origin; on
    // native we use the app's deep link (e.g. `jouspace://auth/callback`).
    const redirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : Linking.createURL('auth/callback');

    if (Platform.OS === 'web') {
      try {
        const { url } = await backendAuthService.signInWithGoogle(redirectTo);

        if (url) {
          window.location.href = url;
          throw new Error('Redirecting to Google sign-in...');
        }

        throw new Error('Failed to start Google sign-in.');
      } catch (error: any) {
        if (error?.message?.includes('Redirecting')) throw error;
        throw new Error(mapSupabaseError(error));
      }
    }

    // Native (Expo): open the provider URL in an in-app browser and capture the
    // redirect back to our deep link, then exchange it for a session.
    try {
      const { url } = await backendAuthService.signInWithProvider('google', {
        redirectTo,
        skipBrowserRedirect: true,
      });
      if (!url) throw new Error('Failed to start Google sign-in.');

      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google sign-in was cancelled.');
      }
      if (result.type !== 'success' || !result.url) {
        throw new Error('Google sign-in did not complete.');
      }

      await backendAuthService.getSessionFromUrl(result.url);

      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) throw new Error('Google sign-in failed: no user returned.');

      this.currentUser = user;
      this.userProfile = await this.hydrateProfile(user);

      this.notifyListeners(this.userProfile);
      analyticsService.trackEvent('auth_signin' as never, { method: 'google' });

      if (!this.userProfile) throw new Error('Failed to load profile');
      return this.userProfile;
    } catch (error: any) {
      if (error?.message?.includes('cancelled')) throw error;
      throw new Error(mapSupabaseError(error));
    }
  }

  async signInAnonymously(): Promise<UserProfile> {
    try {
      const { user } = await backendAuthService.signInAnonymously();
      if (!user) throw new Error('Anonymous sign-in failed: no user returned.');

      this.currentUser = user;
      const profile = await this.hydrateProfile(user);
      profile.onboardingCompleted = true;

      // Persist in DB and storage
      try {
        await profileRepository.update(user.id, {
          onboarding_completed: true,
        });
      } catch (err) {
        console.warn('[auth] Failed to mark guest onboarding completed in DB:', err);
      }

      try {
        await storageService.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      } catch (err) {
        console.warn('[auth] Failed to save onboarding completed in storage:', err);
      }

      this.userProfile = profile;
      this.notifyListeners(this.userProfile);
      analyticsService.trackEvent('auth_guest' as never, { method: 'anonymous' });

      return this.userProfile;
    } catch (error) {
      throw new Error(mapSupabaseError(error));
    }
  }

  /**
   * Enter guest mode via Supabase anonymous auth so guest data persists under
   * RLS (recommendations, progress, ...). If anonymous sign-in is unavailable
   * (e.g. not enabled in the Supabase project) it falls back to a purely local
   * guest profile, keeping the app usable with degraded (non-persisted) data.
   */
  async signInAsGuest(): Promise<UserProfile> {
    try {
      return await this.signInAnonymously();
    } catch {
      const fallback: UserProfile = {
        uid: `guest-${Date.now()}`,
        name: 'Guest User',
        email: `guest-${Date.now()}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: { theme: 'light', notifications: false, language: 'en', tone: 'auto' },
        stats: { totalSessions: 1, totalMinutes: 0, streakDays: 0, lastActivityDate: new Date() },
        onboardingCompleted: true,
      };
      this.currentUser = null;
      this.userProfile = fallback;
      this.notifyListeners(this.userProfile);
      return this.userProfile;
    }
  }

  async signUp(data: SignUpData): Promise<UserProfile> {
    try {
      // If the current session is an anonymous (guest) one, promote it in place
      // so all RLS-scoped guest data (recommendations, progress, ...) is kept
      // and re-attached to the now-real account. Otherwise create a new account.
      const isAnon = await backendAuthService.isAnonymous();
      const result = isAnon
        ? await backendAuthService.convertAnonymousToEmail(data.email, data.password, {
            display_name: data.name,
            name: data.name,
          })
        : await backendAuthService.signUp(data.email, data.password, {
            display_name: data.name,
            name: data.name,
          });

      if (result.user) {
        this.currentUser = result.user;
      }

      if (result.session) {
        this.userProfile = await this.hydrateProfile(result.user!);
      } else {
        // Email confirmation required — build a partial profile so the
        // verification screen can reference the user's email.
        this.userProfile = {
          uid: result.user?.id || 'pending',
          name: data.name,
          email: data.email,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          preferences: { theme: 'dark', notifications: true, language: 'en', tone: 'auto' },
          stats: { totalSessions: 0, totalMinutes: 0, streakDays: 0, lastActivityDate: new Date() },
          onboardingCompleted: false,
        };
      }

      this.notifyListeners(this.userProfile);
      analyticsService.trackEvent('auth_signup', { method: 'email' });

      return this.userProfile;
    } catch (error) {
      throw new Error(mapSupabaseError(error));
    }
  }

  async signOut(): Promise<void> {
    try {
      await backendAuthService.signOut();
      this.userProfile = null;
      this.currentUser = null;
      this.notifyListeners(null);
      analyticsService.trackEvent('auth_signout');
    } catch (error) {
      throw new Error(mapSupabaseError(error));
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
      await backendAuthService.resetPassword(email, redirectTo);
      analyticsService.trackEvent('password_reset', {});
    } catch (error) {
      throw new Error(mapSupabaseError(error));
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No user logged in');
    }

    const dbUpdates: Record<string, any> = {};
    if (updates.name) dbUpdates.display_name = updates.name;
    if (updates.photoURL !== undefined) dbUpdates.avatar_url = updates.photoURL;
    if (updates.onboardingCompleted !== undefined) {
      dbUpdates.onboarding_completed = updates.onboardingCompleted;
    }

    if (Object.keys(dbUpdates).length > 0) {
      try {
        await profileRepository.update(this.currentUser.id, dbUpdates);
      } catch {
        // non-critical
      }
    }

    // Update preferences if needed
    if (updates.preferences) {
      try {
        await userPreferencesService.upsert({
          theme: updates.preferences.theme,
          notifications_enabled: updates.preferences.notifications,
          settings: { tone: updates.preferences.tone, language: updates.preferences.language },
        });
      } catch {
        // non-critical
      }
    }

    this.userProfile = { ...this.userProfile, ...updates };
    this.notifyListeners(this.userProfile);
  }

  async sendVerificationEmail(): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');
    const email = this.currentUser.email;
    if (!email) throw new Error('No email address on file.');
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
      await backendAuthService.resendVerificationEmail(email, redirectTo);
    } catch (error) {
      throw new Error(mapSupabaseError(error));
    }
  }

  async checkEmailVerified(): Promise<boolean> {
    if (!this.currentUser) return false;
    if ((this.currentUser as any)?.is_anonymous) return true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at != null;
    } catch {
      return false;
    }
  }

  isEmailVerified(): boolean {
    if ((this.currentUser as any)?.is_anonymous) return true;
    return this.currentUser?.email_confirmed_at != null;
  }

  async restoreSession(): Promise<UserProfile | null> {
    if (this.currentUser && this.userProfile) {
      return this.userProfile;
    }
    if (!this.initialized) {
      await this.waitForInitialization();
    }
    return this.userProfile;
  }

  async isOnboardingCompleted(): Promise<boolean> {
    if (this.userProfile?.onboardingCompleted) return true;
    const stored = await storageService.get(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return stored === 'true';
  }

  async markOnboardingCompleted(): Promise<void> {
    await storageService.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    if (this.currentUser) {
      try {
        await profileRepository.update(this.currentUser.id, {
          onboarding_completed: true,
        });
      } catch {
        // non-critical
      }
    }
    if (this.userProfile) {
      this.userProfile.onboardingCompleted = true;
    }
  }

  getProfile(): UserProfile | null {
    return this.userProfile;
  }

  getCurrentFirebaseUser(): AuthUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(listener: (user: UserProfile | null) => void): () => void {
    this.listeners.push(listener);
    // Guard the immediate invoke too — it runs outside notifyListeners and an
    // unhandled rejection here is the original "guest auto-close" crash.
    if (this.userProfile) this.invokeListenerSafely(listener, this.userProfile);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  async migrateGuestAccount(_guestUid: string, _newUid: string): Promise<void> {
    // Guest accounts are handled directly through Supabase anonymous auth now.
    // The anonymous session is already linked to the user's data in the database.
  }

  private invokeListenerSafely(
    listener: (user: UserProfile | null) => void,
    user: UserProfile | null,
  ): void {
    try {
      const fn = listener as unknown as (u: UserProfile | null) => unknown;
      const result = fn(user);
      // Listeners may be async (e.g. onAuthStateChanged handlers that await
      // storage/profile lookups). A rejected promise here is otherwise an
      // unhandled rejection that silently terminates the app (guest auto-close).
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        (result as Promise<unknown>).catch((err) =>
          console.warn('[auth] listener rejected:', err),
        );
      }
    } catch (err) {
      console.warn('[auth] listener threw:', err);
    }
  }

  private notifyListeners(user: UserProfile | null): void {
    this.listeners.forEach((listener) => this.invokeListenerSafely(listener, user));
  }
}

export const authService = new AuthService();
export default authService;
