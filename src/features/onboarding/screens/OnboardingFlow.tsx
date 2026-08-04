import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { BellIcon } from '@/shared/components/SymbolIcons';
import { Button } from '@/shared/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { TextField } from '@/shared/components/TextField';
import { ProgressRing } from '@/shared/components/ProgressRing';
import { analyticsService } from '@/services/analytics';
import { useOnboarding } from '../hooks/useOnboarding';
import { WELLNESS_GOALS, MOOD_OPTIONS, REMINDER_OPTIONS, TOTAL_ONBOARDING_STEPS, ONBOARDING_STRINGS } from '../constants';
import type { OnboardingStep } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [goals, setGoals] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [name, setName] = useState('');
  const [reminder, setReminder] = useState('morning');
  const [notifications, setNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { finishOnboarding } = useOnboarding();

  const progress = (() => {
    const m: Record<string, number> = {
      welcome: 1,
      goals: 2,
      mood: 3,
      displayName: 4,
      reminder: 5,
      notification: 6,
      privacy: 7,
    };
    return ((m[step] || 1) / TOTAL_ONBOARDING_STEPS) * 100;
  })();

  useEffect(() => {
    analyticsService.trackEvent('onboarding_started');
  }, []);

  const next = (s: OnboardingStep) => setStep(s);

  const back = () => {
    const order: OnboardingStep[] = [
      'welcome',
      'goals',
      'mood',
      'displayName',
      'reminder',
      'notification',
      'privacy',
    ];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const canContinue = () => {
    if (step === 'goals') return goals.length > 0;
    if (step === 'mood') return !!mood;
    if (step === 'displayName') return name.trim().length > 0;
    return true;
  };

  const toggleGoal = (g: string) =>
    setGoals((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : prev.length < 5
        ? [...prev, g]
        : prev
    );

  const submit = async () => {
    setError(null);
    if (step === 'welcome') return next('goals');
    if (step === 'goals') {
      if (!goals.length) return;
      analyticsService.trackEvent('onboarding_step_completed', {
        step: 'goals',
        selections: goals.join(','),
      });
      return next('mood');
    }
    if (step === 'mood') {
      if (!mood) return;
      analyticsService.trackEvent('onboarding_step_completed', {
        step: 'mood',
        mood,
      });
      return next('displayName');
    }
    if (step === 'displayName') {
      if (!name.trim()) return;
      analyticsService.trackEvent('onboarding_step_completed', {
        step: 'displayName',
      });
      return next('reminder');
    }
    if (step === 'reminder') {
      analyticsService.trackEvent('onboarding_step_completed', {
        step: 'reminder',
        reminder,
      });
      return next('notification');
    }
    if (step === 'notification') return next('privacy');
    if (step === 'privacy') {
      try {
        setSaving(true);
        await finishOnboarding({
          displayName: name.trim(),
          primaryGoals: goals,
          initialMood: mood,
          reminderPreference: reminder,
          notificationsEnabled: notifications,
        });
        router.replace('/(tabs)');
      } catch (e) {
        setError('Could not save your profile');
        setSaving(false);
      }
    }
  };

  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  if (saving) {
    return (
      <SafeAreaView className="flex-1 bg-background-primary">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View className="flex-1 items-center justify-center">
          <ProgressRing progress={progress} size={120} strokeWidth={6} />
          <Text className="text-text-primary text-xl font-semibold mt-8">
            {ONBOARDING_STRINGS.PREPARING_TITLE}
          </Text>
          <Text className="text-text-secondary mt-2">
            {ONBOARDING_STRINGS.PREPARING_SUBTITLE}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8">
          <View className="items-center mb-2">
            <ProgressRing
              progress={progress}
              size={40}
              strokeWidth={4}
              showPercentage={false}
            />
          </View>
          <View className="flex-1 justify-center">
            {step === 'welcome' && (
              <AnimatedView
                entering={FadeIn.duration(400)}
                className="items-center justify-center mt-10"
              >
                <View className="w-32 h-32 rounded-full bg-brand-primary/10 border border-border-default/50 items-center justify-center mb-8">
                  <Sparkles size={56} color={colors.brand.primary} />
                </View>
                <Text className="text-text-primary text-3xl font-bold mb-4">
                  {ONBOARDING_STRINGS.WELCOME_TITLE}
                </Text>
                <Text className="text-text-secondary text-center leading-6 max-w-[300px]">
                  {ONBOARDING_STRINGS.WELCOME_DESCRIPTION}
                </Text>
              </AnimatedView>
            )}
            {step === 'goals' && (
              <AnimatedView entering={FadeIn.duration(400)}>
                <Text className="text-text-primary text-2xl font-semibold mb-2">
                  {ONBOARDING_STRINGS.GOALS_TITLE}
                </Text>
                <Text className="text-text-secondary mb-6">
                  {ONBOARDING_STRINGS.GOALS_SUBTITLE}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px]">
                  <View className="flex-row flex-wrap gap-3">
                    {WELLNESS_GOALS.map((g) => {
                      const active = goals.includes(g.value);
                      return (
                        <Pressable
                          key={g.value}
                          onPress={() => toggleGoal(g.value)}
                          className={`px-4 py-3 rounded-2xl border ${
                            active
                              ? 'bg-brand-primary/10 border-brand-primary'
                              : 'bg-surface-primary border border-border-default'
                          }`}
                        >
                          <View className="flex-row items-center gap-2">
                            <Text className="text-2xl">{g.emoji}</Text>
                            <Text
                              className={`font-medium text-sm ${
                                active ? 'text-brand-primary' : 'text-text-secondary'
                              }`}
                            >
                              {g.label}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </AnimatedView>
            )}
            {step === 'mood' && (
              <AnimatedView entering={FadeIn.duration(400)}>
                <Text className="text-text-primary text-2xl font-semibold mb-2">
                  {ONBOARDING_STRINGS.MOOD_TITLE}
                </Text>
                <Text className="text-text-secondary mb-6">
                  {ONBOARDING_STRINGS.MOOD_SUBTITLE}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {MOOD_OPTIONS.map((m) => {
                    const active = mood === m.value;
                    return (
                      <Pressable
                        key={m.value}
                        onPress={() => setMood(m.value)}
                        className={`px-4 py-3 rounded-2xl border ${
                          active
                            ? 'bg-brand-primary/10 border-brand-primary'
                            : 'bg-surface-primary border border-border-default'
                        }`}
                      >
                        <View className="items-center">
                          <Text className="text-2xl mb-1">{m.emoji}</Text>
                          <Text
                            className={`font-medium text-sm ${
                              active ? 'text-brand-primary' : 'text-text-secondary'
                            }`}
                          >
                            {m.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </AnimatedView>
            )}
            {step === 'displayName' && (
              <AnimatedView entering={FadeIn.duration(400)}>
                <Text className="text-text-primary text-2xl font-semibold mb-2">
                  {ONBOARDING_STRINGS.NAME_TITLE}
                </Text>
                <Text className="text-text-secondary mb-6">
                  {ONBOARDING_STRINGS.NAME_SUBTITLE}
                </Text>
                <TextField
                  label=""
                  placeholder={ONBOARDING_STRINGS.NAME_PLACEHOLDER}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  maxLength={50}
                />
              </AnimatedView>
            )}
            {step === 'reminder' && (
              <AnimatedView entering={FadeIn.duration(400)}>
                <Text className="text-text-primary text-2xl font-semibold mb-2">
                  {ONBOARDING_STRINGS.REMINDER_TITLE}
                </Text>
                <Text className="text-text-secondary mb-6">
                  {ONBOARDING_STRINGS.REMINDER_SUBTITLE}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px]">
                  <View className="gap-3">
                    {REMINDER_OPTIONS.map((opt) => {
                      const active = reminder === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setReminder(opt.value)}
                          className={`p-4 rounded-2xl border ${
                            active
                              ? 'bg-brand-primary/10 border-brand-primary'
                              : 'bg-surface-primary border border-border-default'
                          }`}
                        >
                          <View className="flex-row items-center gap-3">
                            <Text className="text-2xl">{opt.emoji}</Text>
                            <View className="flex-1">
                              <Text
                                className={`font-semibold text-body-sm ${
                                  active ? 'text-brand-primary' : 'text-text-primary'
                                }`}
                              >
                                {opt.label}
                              </Text>
                              <Text className="text-text-secondary text-caption mt-0.5">
                                {opt.description}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </AnimatedView>
            )}
            {step === 'notification' && (
              <AnimatedView
                entering={FadeIn.duration(400)}
                className="items-center justify-center mt-10"
              >
                <View className="w-24 h-24 rounded-full bg-brand-primary/10 border border-border-default/50 items-center justify-center mb-6">
                  <BellIcon size={36} />
                </View>
                <Text className="text-text-primary text-2xl font-semibold mb-2 text-center">
                  {ONBOARDING_STRINGS.PERMISSION_TITLE}
                </Text>
                <Text className="text-text-secondary text-center leading-7 mb-8 max-w-[300px]">
                  {ONBOARDING_STRINGS.PERMISSION_SUBTITLE}
                </Text>
                <Button
                  title={ONBOARDING_STRINGS.PERMISSION_BUTTON}
                  onPress={() => setNotifications(true)}
                  size="lg"
                  className="w-full"
                />
                <Pressable
                  onPress={() => setNotifications(false)}
                  className="mt-4 py-2"
                >
                  <Text className="text-text-secondary text-body-sm font-semibold underline">
                    {ONBOARDING_STRINGS.PERMISSION_SKIP}
                  </Text>
                </Pressable>
              </AnimatedView>
            )}
            {step === 'privacy' && (
              <AnimatedView entering={FadeIn.duration(400)}>
                <Text className="text-text-primary text-2xl font-semibold mb-2">
                  {ONBOARDING_STRINGS.PRIVACY_TITLE}
                </Text>
                <Text className="text-text-secondary leading-7 mb-6">
                  {ONBOARDING_STRINGS.PRIVACY_SUBTITLE}
                </Text>
              </AnimatedView>
            )}
          </View>
          <View className="pb-8 pt-4">
            {error && (
              <View className="bg-danger/10 border border-danger/25 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-danger text-body-sm font-medium">{error}</Text>
              </View>
            )}
            <View className="flex-row gap-3">
              {step !== 'welcome' && (
                <Pressable
                  onPress={back}
                  className="px-6 py-4 rounded-2xl border border-border-default bg-surface-secondary active:bg-surface-primary"
                >
                  <Text className="text-text-secondary font-medium">
                    {ONBOARDING_STRINGS.BACK}
                  </Text>
                </Pressable>
              )}
              <Button
                title={
                  step === 'privacy'
                    ? ONBOARDING_STRINGS.GET_STARTED
                    : ONBOARDING_STRINGS.CONTINUE
                }
                onPress={submit}
                disabled={!canContinue()}
                size="lg"
                className={step !== 'welcome' ? 'flex-1' : 'w-full'}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
