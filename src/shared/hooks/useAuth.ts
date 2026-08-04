/**
 * useAuth — Complete auth hook for screens.
 *
 * Exposes all auth operations without exposing Firebase directly.
 * Screens should use this hook exclusively for auth interactions.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/core/store/useAppStore';

/**
 * Main auth hook — returns all auth state and actions.
 */
export function useAuth() {
  const session = useAppStore((state) => state.session);
  const initialize = useAppStore((state) => state.initialize);
  const login = useAppStore((state) => state.login);
  const signup = useAppStore((state) => state.signup);
  const logout = useAppStore((state) => state.logout);
  const resetPassword = useAppStore((state) => state.resetPassword);
  const restoreSession = useAppStore((state) => state.restoreSession);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const sendVerificationEmail = useAppStore((state) => state.sendVerificationEmail);
  const checkEmailVerified = useAppStore((state) => state.checkEmailVerified);
  const setAuthError = useAppStore((state) => state.setAuthError);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, [setAuthError]);

  return {
    // State
    user: session.user,
    profile: session.user,
    loading: session.authLoading,
    error: session.authError,
    isAuthenticated: session.isAuthenticated,
    initialized: session.initialized,
    emailVerified: session.emailVerified,
    onboardingCompleted: session.onboardingCompleted,

    // Actions
    initialize,
    login: useCallback(
      (email: string, password: string) => login(email, password),
      [login]
    ),
    signup: useCallback(
      (name: string, email: string, password: string) => signup(name, email, password),
      [signup]
    ),
    logout: useCallback(() => logout(), [logout]),
    resetPassword: useCallback(
      (email: string) => resetPassword(email),
      [resetPassword]
    ),
    restoreSession: useCallback(() => restoreSession(), [restoreSession]),
    completeOnboarding: useCallback(
      (data?: Record<string, unknown>) => completeOnboarding(data),
      [completeOnboarding]
    ),
    updateUserProfile: useCallback(
      (updates: Parameters<typeof updateUserProfile>[0]) => updateUserProfile(updates),
      [updateUserProfile]
    ),
    sendVerificationEmail: useCallback(
      () => sendVerificationEmail(),
      [sendVerificationEmail]
    ),
    checkEmailVerified: useCallback(
      () => checkEmailVerified(),
      [checkEmailVerified]
    ),
    clearError,
  };
}

// ─── Individual selectors for granular subscriptions ─────────────────────

export function useUserId(): string | null {
  const user = useAppStore((state) => state.session.user);
  if (!user) return null;
  return user.uid;
}

export function useIsAuthenticated(): boolean {
  return useAppStore((state) => state.session.isAuthenticated);
}

export function useUser(): ReturnType<typeof useAppStore.getState>['session']['user'] {
  return useAppStore((state) => state.session.user);
}

export function useUserDisplayName(): string {
  const user = useAppStore((state) => state.session.user);
  return user?.name || 'User';
}

export function useUserEmail(): string {
  const user = useAppStore((state) => state.session.user);
  return user?.email || '';
}

export function useOnboardingCompleted(): boolean {
  return useAppStore((state) => state.session.onboardingCompleted);
}

export default useAuth;
