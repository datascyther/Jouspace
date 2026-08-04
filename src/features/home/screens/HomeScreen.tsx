/**
 * HomeScreen — Minimal, premium, AI-native journal Home.
 *
 * Sections (in scroll order):
 *   1. HomeHeader           (brand + notifications + avatar)
 *   2. GreetingBlock        (calm greeting + last-wrote subtitle)
 *   3. MemoryGuidedCard     (continue / new entry surface)
 *   4. AIReflectionCard     (quiet "Jouspace noticed" insight)
 *   5. RecentEntriesList    (lightweight rows)
 *
 * Bottom navigation is provided by the tab layout (shared BottomNavigation).
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/core/config/routes';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAppStore } from '@/core/store/useAppStore';

import { HomeHeader } from '../components/HomeHeader';
import { GreetingBlock } from '../components/GreetingBlock';
import { MemoryGuidedCard } from '../components/MemoryGuidedCard';
import { AIReflectionCard } from '../components/AIReflectionCard';
import { RecentEntriesList } from '../components/RecentEntriesList';
import { useHomeData } from '../hooks/useHomeData';

export function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const addToast = useAppStore((s) => s.addToast);

  const {
    greeting,
    displayName,
    lastWroteLabel,
    recentTopic,
    recentEntries,
    insight,
    isInsightLoading,
  } = useHomeData();

  const handleContinue = useCallback(() => {
    const first = recentEntries[0];
    if (first && !first.id.startsWith('demo-')) {
      router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', first.id));
    } else {
      router.push(ROUTES.JOURNAL.NEW);
    }
  }, [recentEntries, router]);

  const handleNewEntry = useCallback(() => {
    router.push(ROUTES.JOURNAL.NEW);
  }, [router]);

  const handleReflect = useCallback(() => {
    router.push(ROUTES.JOURNAL.REFLECTION);
  }, [router]);

  const handleEntryPress = useCallback(
    (entry: { id: string }) => {
      if (entry.id.startsWith('demo-')) {
        router.push(ROUTES.JOURNAL.NEW);
        return;
      }
      router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', entry.id));
    },
    [router],
  );

  const handleNotificationPress = useCallback(() => {
    addToast({ type: 'info', message: 'Notifications are on their way.' });
  }, [addToast]);

  const handleAvatarPress = useCallback(() => {
    router.push('/(tabs)/profile');
  }, [router]);

  const onRefresh = useCallback(() => {
    if (uid) {
      void queryClient.invalidateQueries({ queryKey: ['journals_list', uid] });
    }
    void queryClient.invalidateQueries({ queryKey: ['homeAiInsight'] });
  }, [uid, queryClient]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        <HomeHeader
          onNotificationPress={handleNotificationPress}
          onAvatarPress={handleAvatarPress}
          unreadCount={0}
        />

        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <GreetingBlock
            greeting={greeting}
            name={displayName}
            subtitle={lastWroteLabel}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <MemoryGuidedCard
            topic={recentTopic}
            onContinue={handleContinue}
            onNewEntry={handleNewEntry}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <AIReflectionCard
            insight={insight}
            isLoading={isInsightLoading}
            onReflect={handleReflect}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <RecentEntriesList
            entries={recentEntries}
            onEntryPress={handleEntryPress}
          />
        </Animated.View>

        {/* recentToBottomNav breathing room above floating nav */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 110,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;
