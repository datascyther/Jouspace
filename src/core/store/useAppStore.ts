/**
 * Jouspace — Global Application Store (Zustand)
 *
 * Manages UI state only. Server state belongs in TanStack Query.
 * NEVER duplicate server data inside this store.
 *
 * State separation:
 *   Zustand → UI state (current view, theme, loading flags, auth session)
 *   TanStack Query → Server state (moods, chats, exercises, profile)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/services/auth/types';
import { authService } from '@/services/auth';
import { profileRepository } from '../../../backend/repositories/ProfileRepository';

// ─── Types ───────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'auto';
export type Tone = 'warm' | 'motivational' | 'soothing' | 'auto';

export interface UIState {
  /** Currently active tab/screen */
  currentTab: 'home' | 'chat' | 'journey' | 'profile';
  /** Theme preference */
  theme: ThemeMode;
  /** Global loading flag */
  isLoading: boolean;
  /** Toast message queue */
  toasts: Toast[];
  /** Modal state */
  activeModal: string | null;
  /** Whether AI responses should be spoken aloud (opt-in, default OFF) */
  voiceEnabled: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface SessionState {
  /** Authenticated Supabase user */
  user: UserProfile | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether the auth module has initialized */
  initialized: boolean;
  /** Whether the user's email is verified */
  emailVerified: boolean;
  /** Whether onboarding is complete */
  onboardingCompleted: boolean;
  /** Auth loading state */
  authLoading: boolean;
  /** Auth error message */
  authError: string | null;
  /** Previous guest UID (transient — cleared after migration) */
  previousGuestUid: string | null;
}

export interface LastCheckIn {
  rating: number;
  label: string;
  emoji: string;
  timestamp: string;
}

export interface AppStore {
  // ─── Check-in Presence ─────────────────────────────────────────────
  /** Latest mood check-in, shared reactively across screens (client-side). */
  lastCheckIn: LastCheckIn | null;
  setLastCheckIn: (payload: LastCheckIn) => void;
  clearLastCheckIn: () => void;

  // ─── UI State ────────────────────────────────────────────────────────
  ui: UIState;
  setCurrentTab: (tab: UIState['currentTab']) => void;
  setTheme: (theme: ThemeMode) => void;
  setLoading: (isLoading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setActiveModal: (modal: string | null) => void;
  setVoiceEnabled: (v: boolean) => void;

  // ─── Session State ──────────────────────────────────────────────────
  session: SessionState;
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setPreviousGuestUid: (uid: string | null) => void;
  clearSession: () => void;

  // ─── Auth Actions ──────────────────────────────────────────────────────
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  completeOnboarding: (data?: Record<string, unknown>) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;

  // ─── Actions ─────────────────────────────────────────────────────────
  reset: () => void;
}

// ─── Initial State ──────────────────────────────────────────────────────

const initialUIState: UIState = {
  currentTab: 'home',
  theme: 'light',
  isLoading: false,
  toasts: [],
  activeModal: null,
  voiceEnabled: false,
};

const initialSessionState: SessionState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  emailVerified: false,
  onboardingCompleted: false,
  authLoading: false,
  authError: null,
  previousGuestUid: null,
};

// ─── Store ──────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ─── Check-in Presence ─────────────────────────────────────────────
      lastCheckIn: null,

      setLastCheckIn: (payload) =>
        set(() => ({ lastCheckIn: payload })),

      clearLastCheckIn: () =>
        set(() => ({ lastCheckIn: null })),

      // ─── UI State ──────────────────────────────────────────────────
      ui: { ...initialUIState },

      setCurrentTab: (currentTab) =>
        set((state) => ({ ui: { ...state.ui, currentTab } })),

      setTheme: (theme) =>
        set((state) => ({ ui: { ...state.ui, theme } })),

      setLoading: (isLoading) =>
        set((state) => ({ ui: { ...state.ui, isLoading } })),

      addToast: (toast) =>
        set((state) => ({
          ui: {
            ...state.ui,
            toasts: [
              ...state.ui.toasts,
              { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, ...toast },
            ],
          },
        })),

      removeToast: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            toasts: state.ui.toasts.filter((t) => t.id !== id),
          },
        })),

      setActiveModal: (activeModal) =>
        set((state) => ({ ui: { ...state.ui, activeModal } })),

      setVoiceEnabled: (voiceEnabled) =>
        set((state) => ({ ui: { ...state.ui, voiceEnabled } })),

      // ─── Session State ─────────────────────────────────────────────
      session: { ...initialSessionState },

      setUser: (user) =>
        set((state) => ({
          session: {
            ...state.session,
            user,
            isAuthenticated: !!user,
          },
        })),

      setAuthenticated: (isAuthenticated) =>
        set((state) => ({
          session: { ...state.session, isAuthenticated },
        })),

      setOnboardingCompleted: (onboardingCompleted) =>
        set((state) => ({
          session: { ...state.session, onboardingCompleted },
        })),

      setEmailVerified: (emailVerified) =>
        set((state) => ({
          session: { ...state.session, emailVerified },
        })),

      setAuthInitialized: (initialized) =>
        set((state) => ({
          session: { ...state.session, initialized },
        })),

      setAuthLoading: (authLoading) =>
        set((state) => ({
          session: { ...state.session, authLoading },
        })),

      setAuthError: (authError) =>
        set((state) => ({
          session: { ...state.session, authError },
        })),

      setPreviousGuestUid: (previousGuestUid) =>
        set((state) => ({
          session: { ...state.session, previousGuestUid },
        })),

      clearSession: () =>
        set(() => ({
          session: { ...initialSessionState, initialized: true },
        })),

      // ─── Auth Actions ─────────────────────────────────────────────────

      initialize: async () => {
        const state = get();
        if (state.session.initialized) return;

        state.setAuthLoading(true);
        try {
          await authService.waitForInitialization();
          const user = authService.getProfile();
          const emailVerified = authService.isEmailVerified();
          const onboardingCompleted = await authService.isOnboardingCompleted();

          set({
            session: {
              user,
              isAuthenticated: !!user,
              initialized: true,
              emailVerified,
              onboardingCompleted: user ? onboardingCompleted : false,
              authLoading: false,
              authError: null,
            },
          });
        } catch (error) {
          set({
            session: {
              ...get().session,
              initialized: true,
              authLoading: false,
              authError: error instanceof Error ? error.message : 'Initialization failed',
            },
          });
        }
      },

      login: async (email: string, password: string) => {
        const state = get();
        state.setAuthLoading(true);
        state.setAuthError(null);
        try {
          const user = await authService.signInWithEmail({ email, password });
          const emailVerified = authService.isEmailVerified();
          set({
            session: {
              ...state.session,
              user,
              isAuthenticated: true,
              authLoading: false,
              emailVerified,
            },
          });
        } catch (error) {
          set({
            session: {
              ...get().session,
              authLoading: false,
              authError: error instanceof Error ? error.message : 'Login failed',
            },
          });
          throw error;
        }
      },

      signup: async (name: string, email: string, password: string) => {
        const state = get();
        state.setAuthLoading(true);
        state.setAuthError(null);
        try {
          const user = await authService.signUp({ name, email, password });

          const previousGuestUid = state.session.previousGuestUid;
          if (previousGuestUid && user.uid !== previousGuestUid) {
            await authService.migrateGuestAccount(previousGuestUid, user.uid);
          }

          set({
            session: {
              ...state.session,
              user,
              isAuthenticated: true,
              authLoading: false,
              emailVerified: false,
              previousGuestUid: null,
            },
          });
        } catch (error) {
          set({
            session: {
              ...get().session,
              authLoading: false,
              authError: error instanceof Error ? error.message : 'Signup failed',
            },
          });
          throw error;
        }
      },

      logout: async () => {
        const state = get();
        state.setAuthLoading(true);
        try {
          await authService.signOut();
          set({ session: { ...initialSessionState, initialized: true } });
        } catch (error) {
          set({
            session: {
              ...state.session,
              authLoading: false,
              authError: error instanceof Error ? error.message : 'Logout failed',
            },
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        const state = get();
        state.setAuthLoading(true);
        state.setAuthError(null);
        try {
          await authService.resetPassword(email);
          state.setAuthLoading(false);
        } catch (error) {
          state.setAuthLoading(false);
          state.setAuthError(error instanceof Error ? error.message : 'Password reset failed');
          throw error;
        }
      },

      restoreSession: async () => {
        const state = get();
        state.setAuthLoading(true);
        try {
          const user = await authService.restoreSession();
          const emailVerified = authService.isEmailVerified();
          const onboardingCompleted = user ? await authService.isOnboardingCompleted() : false;
          set({
            session: {
              ...state.session,
              user,
              isAuthenticated: !!user,
              initialized: true,
              emailVerified,
              onboardingCompleted: user ? onboardingCompleted : false,
              authLoading: false,
            },
          });
        } catch (error) {
          set({
            session: {
              ...get().session,
              initialized: true,
              authLoading: false,
            },
          });
        }
      },

      completeOnboarding: async (_data?: Record<string, unknown>) => {
        const state = get();
        state.setAuthLoading(true);
        try {
          await authService.markOnboardingCompleted();
          set({
            session: {
              ...state.session,
              onboardingCompleted: true,
              authLoading: false,
            },
          });
        } catch (error) {
          state.setAuthLoading(false);
          throw error;
        }
      },

      updateUserProfile: async (updates: Partial<UserProfile>) => {
        const state = get();
        const currentUser = state.session.user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates } as UserProfile;
        set((s) => ({ session: { ...s.session, user: updatedUser } }));

        try {
          await authService.updateProfile(updates);
        } catch (error) {
          console.warn('[useAppStore] Profile update failed:', error);
        }
      },

      sendVerificationEmail: async () => {
        await authService.sendVerificationEmail();
      },

      checkEmailVerified: async () => {
        const verified = await authService.checkEmailVerified();
        get().setEmailVerified(verified);
        return verified;
      },

      // ─── Reset ─────────────────────────────────────────────────────
      reset: () =>
        set({
          ui: { ...initialUIState },
          session: { ...initialSessionState },
        }),
    }),
    {
      name: 'jouspace-app-store',
      partialize: (state) => ({
        session: {
          onboardingCompleted: state.session.onboardingCompleted,
        },
        ui: {
          theme: state.ui.theme,
          voiceEnabled: state.ui.voiceEnabled,
        },
      }),
      merge: (persistedState: any, currentState: AppStore) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          ui: {
            ...currentState.ui,
            ...(persistedState.ui || {}),
          },
          session: {
            ...currentState.session,
            ...(persistedState.session || {}),
          },
        };
      },
      storage: createJSONStorage(() => {
        const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
        if (isWeb && window.localStorage) {
          return {
            getItem: (name: string) => window.localStorage.getItem(name),
            setItem: (name: string, value: string) => window.localStorage.setItem(name, value),
            removeItem: (name: string) => window.localStorage.removeItem(name),
          };
        }
        try {
          const secureStore = require('expo-secure-store');
          if (secureStore) {
            return {
              getItem: (name: string) => secureStore.getItemAsync(name),
              setItem: (name: string, value: string) => secureStore.setItemAsync(name, value),
              removeItem: (name: string) => secureStore.deleteItemAsync(name),
            };
          }
        } catch {}
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);

export default useAppStore;
