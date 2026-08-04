import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, RefreshCw, LogOut, CheckCircle2, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/Button';
import { GlassCard } from '@/shared/components/GlassCard';
import { useAppStore } from '@/core/store/useAppStore';
import { AUTH_STRINGS } from '@/features/auth/constants';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/theme/tokens';

const { width } = Dimensions.get('window');

export function EmailVerificationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    user,
    sendVerificationEmail,
    checkEmailVerified,
    logout,
    loading,
    error,
    clearError,
  } = useAuth();

  const addToast = useAppStore((state) => state.addToast);
  const [cooldown, setCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-check verification status every 5 seconds while on this screen
  useEffect(() => {
    checkInterval.current = setInterval(async () => {
      try {
        const verified = await checkEmailVerified();
        if (verified) {
          clearInterval(checkInterval.current!);
          addToast({
            type: 'success',
            message: 'Email successfully verified!',
          });
          router.replace('/onboarding');
        }
      } catch (err) {
        // Silent fail for background check
      }
    }, 5000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [checkEmailVerified, router, addToast]);

  // Cooldown countdown timer for resending verification email
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      clearError();
      await sendVerificationEmail();
      setCooldown(30); // 30 seconds cooldown
      addToast({
        type: 'success',
        message: AUTH_STRINGS.VERIFICATION_RESENT,
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : AUTH_STRINGS.ERROR_GENERIC,
      });
    }
  }, [sendVerificationEmail, cooldown, clearError, addToast]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearError();
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        addToast({
          type: 'success',
          message: 'Email successfully verified!',
        });
        router.replace('/onboarding');
      } else {
        addToast({
          type: 'warning',
          message: 'Email is not verified yet. Please check your inbox and try again.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : AUTH_STRINGS.ERROR_GENERIC,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [checkEmailVerified, clearError, router, addToast]);

  const handleSkip = useCallback(() => {
    router.replace('/onboarding');
  }, [router]);

  const handleSignOut = useCallback(async () => {
    try {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      await logout();
      router.replace('/auth/login');
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to sign out.',
      });
    }
  }, [logout, router, addToast]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Branding / Logo */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={{ alignItems: 'center', marginBottom: spacing.md }}
        >
          <View className="w-20 h-20 rounded-full bg-brand-primary/10 border border-border-default items-center justify-center mb-4">
            <Mail size={40} color={colors.brand.primary} />
          </View>
          <Text className="text-4xl font-bold text-text-primary tracking-tight font-display">
            {AUTH_STRINGS.SPLASH_TITLE}
          </Text>
        </Animated.View>

        {/* Verification Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
          <GlassCard intensity="medium" className="p-6 mb-6">
            <Text
              className="text-text-primary text-section-title font-semibold mb-2"
              accessibilityRole="header"
            >
              {AUTH_STRINGS.VERIFICATION_TITLE}
            </Text>

            <Text className="text-text-secondary text-body mb-6 leading-6">
              {AUTH_STRINGS.VERIFICATION_SUBTITLE}
            </Text>

            {user?.email && (
              <View className="bg-surface-secondary border border-border-default rounded-xl p-4 mb-6 items-center">
                <Text className="text-text-secondary text-caption font-medium mb-1">
                  Sent to:
                </Text>
                <Text className="text-brand-primary font-semibold text-body">
                  {user.email}
                </Text>
              </View>
            )}

            {error && (
              <View className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3 mb-6">
                <Text className="text-danger text-body-sm font-medium">{error}</Text>
              </View>
            )}

            <Button
              title={AUTH_STRINGS.VERIFICATION_REFRESH}
              onPress={handleRefresh}
              loading={isRefreshing}
              variant="primary"
              size="lg"
              className="w-full mb-3"
              icon={<RefreshCw size={16} color={colors.brand.contrastText} />}
              accessibilityLabel="Check if verified"
              accessibilityHint="Checks if you have verified your email via the link sent"
            />

            <Button
              title={
                cooldown > 0
                  ? `${AUTH_STRINGS.VERIFICATION_RESEND} (${cooldown}s)`
                  : AUTH_STRINGS.VERIFICATION_RESEND
              }
              onPress={handleResend}
              disabled={cooldown > 0 || loading}
              variant="secondary"
              size="lg"
              className="w-full"
              accessibilityLabel="Resend verification email"
            />

            {/* Footer Actions */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500).springify()}
              style={{ alignItems: 'center', marginTop: spacing.md, gap: spacing.sm }}
            >
              <Pressable
                className="flex-row items-center py-2 active:opacity-70"
                onPress={handleSkip}
                accessibilityRole="link"
                accessibilityLabel="Skip verification"
              >
                <Text className="text-text-secondary text-body-sm font-semibold mr-1">
                  {AUTH_STRINGS.VERIFICATION_SKIP}
                </Text>
                <ArrowRight size={14} color={colors.text.secondary} />
              </Pressable>

              <Pressable
                className="flex-row items-center py-2 active:opacity-70"
                onPress={handleSignOut}
                accessibilityRole="link"
                accessibilityLabel="Sign out of your account"
              >
                <LogOut size={14} color={colors.danger} className="mr-2" />
                <Text className="text-danger text-body-sm font-medium">
                  Sign Out / Edit Email
                </Text>
              </Pressable>
            </Animated.View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default EmailVerificationScreen;