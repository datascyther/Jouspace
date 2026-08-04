import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Mail, Lock, AlertCircle, User } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/shared/hooks/useAuth';
import { authService } from '@/services/auth';
import { analyticsService } from '@/services/analytics';
import { useAppStore } from '@/core/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';
import { PasswordField } from '@/shared/components/PasswordField';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { loginSchema, type LoginFormData } from '@/features/auth/validators';
import { AUTH_STRINGS } from '@/features/auth/constants';
import { spacing, typography, borderRadius } from '@/theme/tokens';

const { width } = Dimensions.get('window');

export function LoginScreen() {
  const router = useRouter();
  const {
    login,
    loading,
    error,
    clearError,
    isAuthenticated,
    emailVerified,
    onboardingCompleted,
  } = useAuth();

  const addToast = useAppStore((state) => state.addToast);
  const setUser = useAppStore((state) => state.setUser);
  const setEmailVerified = useAppStore((state) => state.setEmailVerified);
  const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);

  const [googleLoading, setGoogleLoading] = useState(false);
  const hasNavigated = useRef(false);

  const { control, handleSubmit, formState } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { errors, isValid } = formState;

  useEffect(() => {
    if (isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;

      if (!emailVerified) {
        router.replace('/auth/email-verification');
      } else if (!onboardingCompleted) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, emailVerified, onboardingCompleted, router]);

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      try {
        clearError();
        analyticsService.trackEvent('login_attempt');
        await login(data.email, data.password);
        analyticsService.trackEvent('login_success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        analyticsService.trackEvent('login_failed', { reason: message });
      }
    },
    [login, clearError]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    clearError();
    analyticsService.trackEvent('login_attempt', { action: 'google' });
    try {
      await authService.signInWithGoogle();
      analyticsService.trackEvent('login_success', { method: 'google' });
    } catch (err: any) {
      if (err?.message?.includes('Redirecting')) return;
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      analyticsService.trackEvent('login_failed', { reason: msg });
      addToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setGoogleLoading(false);
    }
  }, [clearError, addToast]);

  const handleGuestMode = useCallback(async () => {
    analyticsService.trackEvent('login_attempt', { action: 'guest' });

    const guestProfile = await authService.signInAsGuest();
    setUser(guestProfile);
    setEmailVerified(true);
    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  }, [setUser, setEmailVerified, setOnboardingCompleted, router]);

  const { colors: themeColors } = useTheme();

  const handleForgotPassword = useCallback(() => {
    analyticsService.trackEvent('login_attempt', { action: 'forgot_password' });
    router.push('/auth/forgot-password');
  }, [router]);

  const handleSignUp = useCallback(() => {
    analyticsService.trackEvent('login_attempt', { action: 'signup' });
    router.push('/auth/signup');
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background.primary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="login-scroll-view"
        >
          <Animated.View
            entering={FadeInDown.duration(600).springify()}
            style={{ justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.md }}
          >
            <View className="flex-row items-center space-x-3">
              <View
                className="w-12 h-12 rounded-full bg-surface-primary items-center justify-center border border-border-default shadow-sm"
                style={{
                  shadowColor: themeColors.brand.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Image
                  source={require('@/shared/assets/jouspace-logo.png')}
                  style={{
                    width: 32,
                    height: 32,
                    resizeMode: 'contain',
                  }}
                />
              </View>
              <Text className="text-text-primary text-body font-bold tracking-tight ml-2">
                Jouspace
              </Text>
              <Text className="text-text-secondary text-caption font-semibold">
                1.0.0 Beta
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
            {error && (
              <View
                className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3 mb-4 flex-row items-center"
                testID="login-error"
                accessibilityRole="alert"
              >
                <AlertCircle size={16} color={themeColors.danger} className="mr-2" />
                <Text className="text-danger text-body-sm flex-1 font-medium">{error}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={AUTH_STRINGS.LOGIN_EMAIL_LABEL}
                  placeholder={AUTH_STRINGS.LOGIN_EMAIL_PLACEHOLDER}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!loading}
                  testID="login-email-input"
                  leftIcon={<Mail size={18} color={themeColors.text.secondary} />}
                  accessibilityLabel={AUTH_STRINGS.LOGIN_EMAIL_LABEL}
                  accessibilityHint="Enter the email associated with your account"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  secureTextEntry
                  label={AUTH_STRINGS.LOGIN_PASSWORD_LABEL}
                  placeholder={AUTH_STRINGS.LOGIN_PASSWORD_PLACEHOLDER}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType="done"
                  editable={!loading}
                  testID="login-password-input"
                  leftIcon={<Lock size={18} color={themeColors.text.secondary} />}
                  accessibilityLabel={AUTH_STRINGS.LOGIN_PASSWORD_LABEL}
                  accessibilityHint="Enter your password"
                />
              )}
            />

            <Pressable
              onPress={handleForgotPassword}
              className="self-center mb-6 py-1"
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="login-forgot-password"
              accessibilityRole="link"
              accessibilityLabel={AUTH_STRINGS.LOGIN_FORGOT_PASSWORD}
            >
              <Text className="text-brand-primary text-body-sm font-semibold">
                {AUTH_STRINGS.LOGIN_FORGOT_PASSWORD}
              </Text>
            </Pressable>

            <Button
              title={loading ? 'Signing In...' : AUTH_STRINGS.LOGIN_BUTTON}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
              loading={loading}
              variant="primary"
              className="w-full mt-2"
              style={{
                backgroundColor: themeColors.brand.primary,
                shadowColor: themeColors.brand.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
              accessibilityLabel={AUTH_STRINGS.LOGIN_BUTTON}
            />

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-border-default" />
              <Text className="text-text-secondary text-caption mx-4 font-semibold uppercase tracking-wider">
                Or
              </Text>
              <View className="flex-1 h-px bg-border-default" />
            </View>

            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading}
            />

            <Pressable
              onPress={handleGuestMode}
              disabled={loading}
              className="flex-row items-center justify-center mt-5 py-3.5 active:opacity-80"
              style={{
                borderRadius: borderRadius.md,
                borderWidth: 1.5,
                borderColor: themeColors.brand.primary + '80',
                backgroundColor: themeColors.brand.primary + '12',
              }}
              accessibilityRole="button"
              accessibilityLabel="Explore as Guest"
            >
              <User color={themeColors.brand.primary} size={18} strokeWidth={2.2} />
              <Text className="text-brand-primary text-body font-semibold ml-2">
                Explore as Guest
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            className="items-center mt-8 mb-6"
          >
            <View className="flex-row items-center justify-center mb-6">
              <Text className="text-text-secondary text-body-sm font-medium">
                {AUTH_STRINGS.LOGIN_NO_ACCOUNT}{' '}
              </Text>
              <Pressable
                onPress={handleSignUp}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="login-signup-link"
                accessibilityRole="link"
                accessibilityLabel={AUTH_STRINGS.LOGIN_SIGNUP_CTA}
              >
                <Text className="text-brand-primary text-body-sm font-bold">
                  {AUTH_STRINGS.LOGIN_SIGNUP_CTA}
                </Text>
              </Pressable>
            </View>

            <Text className="text-text-secondary text-caption text-center px-4 leading-5 font-medium">
              By continuing, you agree to Jouspace'{' '}
              <Text className="underline text-text-primary">Terms of Service</Text> and{' '}
              <Text className="underline text-text-primary">Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;