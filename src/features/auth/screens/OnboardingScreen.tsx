import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/core/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { authService } from '@/services/auth';
import { spacing, typography } from '@/theme/tokens';

export function OnboardingScreen() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  const setEmailVerified = useAppStore((state) => state.setEmailVerified);
  const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);
  const { colors } = useTheme();

  const handleGetStarted = async () => {
    // Enter guest mode via Supabase anonymous auth (falls back to a local
    // profile if anonymous sign-in is unavailable).
    const guestProfile = await authService.signInAsGuest();
    setUser(guestProfile);
    setEmailVerified(true);
    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <Image
          source={require('@/shared/assets/jouspace-logo.png')}
          style={{
            width: 120,
            height: 120,
            resizeMode: 'contain',
            marginBottom: spacing.md
          }}
        />
        <Text style={{ ...typography.headingLarge, color: colors.text.primary, textAlign: 'center' }}>
          Welcome to Jouspace
        </Text>
        <Text style={{ ...typography.textSecondary, textAlign: 'center', marginVertical: spacing.md }}>
          Your personal AI wellness companion
        </Text>
        <Pressable
          onPress={handleGetStarted}
          style={{
            backgroundColor: colors.brand.primary,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <Text style={{ color: colors.brand.contrastText, fontSize: 16, fontWeight: '600' }}>
            Get Started
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default OnboardingScreen;