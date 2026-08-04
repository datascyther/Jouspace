import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTheme } from '@/hooks/useTheme';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/validators';
import { AUTH_STRINGS } from '@/features/auth/constants';
import { spacing, typography } from '@/theme/tokens';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, loading, error, clearError } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const { colors } = useTheme();

  const handleReset = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        clearError();
        await resetPassword(data.email);
        setIsSuccess(true);
      } catch (err) {
        // Error is set in the Zustand store / useAuth
      }
    },
    [resetPassword, clearError]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-4 py-2 flex-row items-center">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-surface-secondary border border-border-default items-center justify-center active:bg-surface-primary"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to previous screen"
          >
            <ArrowLeft size={20} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            className="items-center mb-8"
          >
            <View className="mb-4">
              <Image
                source={require('@/shared/assets/jouspace-logo.png')}
                style={{
                  width: width * 0.28,
                  height: width * 0.28,
                  resizeMode: 'contain',
                }}
              />
            </View>
            <Text className="text-4xl font-bold text-text-primary tracking-tight font-display">
              {AUTH_STRINGS.SPLASH_TITLE}
            </Text>
          </Animated.View>

          {/* Form / Content Panel */}
          <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
            <GlassCard intensity="medium" className="p-6">
              <Text
                className="text-text-primary text-section-title font-semibold mb-2"
                accessibilityRole="header"
              >
                {AUTH_STRINGS.FORGOT_TITLE}
              </Text>

              {isSuccess ? (
                <Animated.View entering={FadeIn.duration(400)}>
                  <View className="items-center my-6">
                    <View className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 items-center justify-center mb-4">
                      <CheckCircle2 size={36} color={colors.success} />
                    </View>
                    <Text className="text-success font-semibold text-card-title text-center mb-2">
                      {AUTH_STRINGS.FORGOT_SUCCESS_TITLE}
                    </Text>
                    <Text className="text-text-secondary text-body-sm text-center leading-5 px-2">
                      {AUTH_STRINGS.FORGOT_SUCCESS_MESSAGE}
                    </Text>
                  </View>

                  <Button
                    title={AUTH_STRINGS.FORGOT_BACK}
                    onPress={() => router.replace('/auth/login')}
                    size="lg"
                    className="w-full mt-4"
                    icon={<ArrowLeft size={16} color={colors.brand.contrastText} />}
                    accessibilityLabel="Back to sign in page"
                  />
                </Animated.View>
              ) : (
                <>
                  <Text className="text-text-secondary text-body-sm mb-6 leading-5">
                    {AUTH_STRINGS.FORGOT_SUBTITLE}
                  </Text>

                  {error && (
                    <View
                      className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3 mb-4 flex-row items-center"
                      accessibilityRole="alert"
                    >
                      <AlertCircle size={16} color={colors.danger} className="mr-2" />
                      <Text className="text-danger text-body-sm flex-1">{error}</Text>
                    </View>
                  )}

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label={AUTH_STRINGS.FORGOT_EMAIL_LABEL}
                        placeholder={AUTH_STRINGS.FORGOT_EMAIL_PLACEHOLDER}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="done"
                        editable={!loading}
                        leftIcon={<Mail size={18} color={colors.text.secondary} />}
                        accessibilityLabel="Email input"
                        accessibilityHint="Enter the email address associated with your account"
                      />
                    )}
                  />

                  <Button
                    title={AUTH_STRINGS.FORGOT_BUTTON}
                    onPress={handleSubmit(handleReset)}
                    disabled={!isValid || loading}
                    loading={loading}
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    accessibilityLabel="Send password reset link"
                  />

                  <Pressable
                    className="flex-row items-center justify-center mt-6 py-2 active:opacity-70"
                    onPress={handleBack}
                    accessibilityRole="link"
                    accessibilityLabel="Back to sign in screen"
                  >
                    <Text className="text-brand-primary text-body-sm font-medium">
                      {AUTH_STRINGS.FORGOT_BACK}
                    </Text>
                    <ArrowLeft size={16} color={colors.text.primary} />
                  </Pressable>
                </>
              )}
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPasswordScreen;