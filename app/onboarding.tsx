/**
 * Jouspace — Onboarding Screen
 *
 * Phase 3 target: Full multi-step onboarding flow.
 * Current: Placeholder screen.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import OnboardingFlow from '@/features/onboarding/screens/OnboardingFlow';

export default function OnboardingScreen() {
  return <OnboardingFlow />;
}
