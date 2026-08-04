/**
 * AuthGuard — Route protection component
 *
 * Controls navigation based on authentication state.
 * Renders appropriate screens based on auth status:
 *   - Not initialized → Splash
 *   - Not authenticated → Auth Stack (Login/Signup/ForgotPassword)
 *   - Authenticated + Email not verified → Email Verification
 *   - Authenticated + Onboarding incomplete → Onboarding
 *   - Authenticated + Onboarding complete → App (children)
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth, useIsAuthenticated, useOnboardingCompleted } from '@/shared/hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Component to render for auth screens */
  authScreen: React.ComponentType<{ onComplete: () => void }>;
  /** Component to render for email verification */
  verificationScreen: React.ComponentType<{ onComplete: () => void; onSkip: () => void }>;
  /** Component to render for onboarding */
  onboardingScreen: React.ComponentType<{ onComplete: () => void }>;
  /** Component to render while loading */
  loadingComponent?: React.ComponentType;
}

export function AuthGuard({
  children,
  authScreen: AuthScreen,
  verificationScreen: VerificationScreen,
  onboardingScreen: OnboardingScreen,
  loadingComponent: LoadingComponent,
}: AuthGuardProps) {
  const { initialized, loading, error, initialize, restoreSession } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const onboardingCompleted = useOnboardingCompleted();

  useEffect(() => {
    if (!initialized) {
      initialize().catch(console.error);
    }
  }, [initialized, initialize]);

  // Show loading while initializing
  if (!initialized || loading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    return (
      <View className="flex-1 bg-background-primary items-center justify-center">
        <LoadingSpinner size={48} />
        <Text className="text-text-secondary text-body-sm mt-4">
          Loading...
        </Text>
      </View>
    );
  }

  // Show error state with retry
  if (error && !isAuthenticated) {
    return (
      <View className="flex-1 bg-surface-dark items-center justify-center px-6">
        <Text className="text-status-error text-body mb-4 text-center">
          {error}
        </Text>
        <Text
          className="text-jouspace-purple-400 text-body-sm underline"
          onPress={() => {
            restoreSession().catch(console.error);
          }}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  // Not authenticated → Show auth screens
  if (!isAuthenticated) {
    return <AuthScreen onComplete={() => {}} />;
  }

  // Authenticated → Render children (app content)
  return <>{children}</>;
}

export default AuthGuard;