// src/features/home/components/HomeSkeleton.tsx
//
// Full-screen shimmer placeholder shown ONLY on a cold start (no cached data).
// On warm opens, useHomeState serves the previous cache instantly, so this is
// rarely seen. Kept intentionally light + cohesive so it never feels cluttered.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SkeletonLoader } from '@/shared/components/SkeletonLoader';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/core/theme';

export function HomeSkeleton() {
  const { colors } = useTheme();

  const card = {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <SkeletonLoader width={36} height={36} borderRadius={12} />
          <View style={styles.spacer} />
          <SkeletonLoader width={28} height={28} borderRadius={14} />
        </View>

        {/* Hero */}
        <View style={[card, { marginTop: 16 }]}>
          <SkeletonLoader width="75%" height={22} borderRadius={8} className="mb-3" />
          <SkeletonLoader width="55%" height={14} borderRadius={6} className="mb-4" />
          <SkeletonLoader width={90} height={32} borderRadius={10} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.quickAction}>
              <SkeletonLoader width={56} height={56} borderRadius={28} />
            </View>
          ))}
        </View>

        {/* Two stacked content cards */}
        <View style={[card, { marginTop: 28 }]}>
          <SkeletonLoader width="60%" height={16} borderRadius={6} className="mb-3" />
          <SkeletonLoader width="100%" height={14} borderRadius={6} className="mb-2" />
          <SkeletonLoader width="80%" height={14} borderRadius={6} />
        </View>

        <View style={[card, { marginTop: 16 }]}>
          <SkeletonLoader width="45%" height={16} borderRadius={6} className="mb-3" />
          <SkeletonLoader width="100%" height={48} borderRadius={10} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacer: { flex: 1 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
});

export default HomeSkeleton;
