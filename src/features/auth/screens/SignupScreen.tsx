import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, AlertCircle, ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { analyticsService } from '@/services/analytics';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';
import { PasswordField } from '@/shared/components/PasswordField';
import { Checkbox } from '@/shared/components/Checkbox';
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter';
import { signupSchema, type SignupFormData } from '@/features/auth/validators';
import { AUTH_STRINGS } from '@/features/auth/constants';

const { width } = Dimensions.get('window');

const ROLE_OPTIONS = [
  'Individual User',
  'Health Practitioner',
  'Wellness Coach',
  'Researcher',
  'Other',
];

export function SignupScreen() {
  const router = useRouter();
  const {
    signup,
    loading,
    error,
    clearError,
    isAuthenticated,
    emailVerified,
  } = useAuth();

  const hasNavigated = useRef(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Individual User');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as any,
      acceptPrivacy: false as any,
    },
  });

  const password = watch('password') || '';

  useEffect(() => {
    if (isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;
      if (!emailVerified) {
        router.replace('/auth/email-verification');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, emailVerified, router]);

  const onSubmit = useCallback(
    async (data: SignupFormData) => {
      try {
        clearError();
        analyticsService.trackEvent('auth_signup', { action: 'attempt', role: selectedRole });
        await signup(data.name, data.email, data.password);
        analyticsService.trackEvent('auth_signup', { action: 'success' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Signup failed';
        analyticsService.trackEvent('auth_signup', { action: 'failed', reason: msg });
      }
    },
    [signup, clearError, selectedRole]
  );

  const { colors } = useTheme();

  const handleSignIn = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="signup-scroll-view"
        >
          {/* Header Row: Back button + Title */}
          <Animated.View
            entering={FadeInDown.duration(600).springify()}
            className="flex-row items-center mb-8 mt-2"
          >
            <Pressable
              onPress={() => router.back()}
              className="mr-4 p-1 rounded-full active:bg-surface-secondary border border-border-default/40"
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <ArrowLeft size={24} color={colors.text.primary} />
            </Pressable>
            <Text className="text-text-primary text-page-title font-bold tracking-tight">
              Create Account
            </Text>
          </Animated.View>

          {/* Form Fields Directly on Light Canvas */}
          <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
            {error && (
              <View
                className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3 mb-4 flex-row items-center"
                accessibilityRole="alert"
              >
                <AlertCircle size={16} color={colors.danger} className="mr-2" />
                <Text className="text-danger text-body-sm flex-1 font-medium">{error}</Text>
              </View>
            )}

            {/* Full Name */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={AUTH_STRINGS.SIGNUP_NAME_LABEL}
                  placeholder={AUTH_STRINGS.SIGNUP_NAME_PLACEHOLDER}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  editable={!loading}
                  leftIcon={<User size={18} color={colors.text.secondary} />}
                  accessibilityLabel={AUTH_STRINGS.SIGNUP_NAME_LABEL}
                  accessibilityHint="Enter your full name"
                />
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Work Email"
                  placeholder="nathan.roberts@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!loading}
                  leftIcon={<Mail size={18} color={colors.text.secondary} />}
                  accessibilityLabel="Work Email"
                  accessibilityHint="Enter your email address"
                />
              )}
            />

            {/* Role Dropdown Selector */}
            <Pressable
              onPress={() => setShowRolePicker(true)}
              className="mb-5"
              accessibilityRole="combobox"
              accessibilityLabel="Role"
            >
              <Text className="text-body-sm font-semibold mb-2 text-text-secondary">
                Role
              </Text>
              <View className="flex-row items-center justify-between rounded-xl border border-border-default px-4 py-3.5 bg-surface-primary">
                <Text className="text-text-primary text-body font-medium">
                  {selectedRole}
                </Text>
                <ChevronDown size={18} color={colors.text.secondary} />
              </View>
            </Pressable>

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  secureTextEntry
                  label={AUTH_STRINGS.SIGNUP_PASSWORD_LABEL}
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="next"
                  editable={!loading}
                  leftIcon={<Lock size={18} color={colors.text.secondary} />}
                  accessibilityLabel={AUTH_STRINGS.SIGNUP_PASSWORD_LABEL}
                  accessibilityHint="Create a password of at least 8 characters"
                />
              )}
            />

            {password.length > 0 && (
              <PasswordStrengthMeter password={password} />
            )}

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordField
                  label={AUTH_STRINGS.SIGNUP_CONFIRM_PASSWORD_LABEL}
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  editable={!loading}
                  leftIcon={<Lock size={18} color={colors.text.secondary} />}
                  accessibilityLabel={AUTH_STRINGS.SIGNUP_CONFIRM_PASSWORD_LABEL}
                  accessibilityHint="Confirm your password by entering it again"
                />
              )}
            />

            {/* Unified Terms & Privacy Checkbox */}
            <View className="mt-4">
              <Controller
                control={control}
                name="acceptTerms"
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    checked={value}
                    onPress={() => {
                      const nextVal = !value;
                      onChange(nextVal);
                      // Update acceptPrivacy concurrently to satisfy zod validation
                      setValue('acceptPrivacy', nextVal as any, { shouldValidate: true });
                    }}
                    label="I agree to the Terms & Conditions and Privacy Policy"
                    error={errors.acceptTerms?.message}
                  />
                )}
              />
            </View>

            {/* Primary Submit Button */}
            <Button
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
              loading={loading}
              variant="primary"
              className="w-full mt-8"
              accessibilityLabel="Create Account"
            />
          </Animated.View>

          {/* Bottom Redirect */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            className="items-center mt-8 mb-6"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-text-secondary text-body-sm font-medium">
                {AUTH_STRINGS.SIGNUP_HAS_ACCOUNT}{' '}
              </Text>
              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="link"
                accessibilityLabel={AUTH_STRINGS.SIGNUP_LOGIN_CTA}
              >
                <Text className="text-brand-primary text-body-sm font-bold">
                  {AUTH_STRINGS.SIGNUP_LOGIN_CTA}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Bottom Selection Modal for Role */}
      <Modal
        visible={showRolePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRolePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setShowRolePicker(false)} />
          <View className="bg-surface-primary rounded-t-2xl px-6 pt-4 pb-10 max-h-[50%] border-t border-border-default">
            {/* Sheet Handle Indicator */}
            <View className="w-12 h-1 bg-border-default rounded-full align-self-center mx-auto mb-4" />
            
            {/* Title */}
            <Text className="text-text-primary text-card-title font-bold mb-4 font-display">
              Select Role
            </Text>

            {/* List options */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {ROLE_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setSelectedRole(option);
                    setShowRolePicker(false);
                  }}
                  className="py-4 border-b border-border-default flex-row justify-between items-center active:bg-surface-secondary"
                >
                  <Text className={`text-text-primary text-body font-semibold ${selectedRole === option ? 'text-brand-primary' : ''}`}>
                    {option}
                  </Text>
                  {selectedRole === option && (
                    <Check size={16} color={colors.brand.primary} strokeWidth={3} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default SignupScreen;
