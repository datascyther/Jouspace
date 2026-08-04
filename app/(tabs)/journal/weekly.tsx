/**
 * Jouspace — Weekly Review (Sprint 2.7)
 *
 * "Every Sunday." A calm weekly aggregation: journal count, most common mood,
 * biggest lesson, the week's meaningful memory, and the companion reflection —
 * closed with two short tone lines. All derived locally from the week's entries
 * (Phase 1). Presentational: reads useWeeklyReview().
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { GlassCard } from '@/shared/components/GlassCard';
import { SkeletonCard } from '@/shared/components/SkeletonLoader';
import { useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/core/config/routes';
import { spacing, typography } from '@/core/theme';
import { useWeeklyReview } from '@/features/reflection/hooks/useWeeklyReview';
import type { EmotionType } from '@/constants/emotions';

const CYAN = '#22D3EE';

const MOOD_EMOJI: Record<EmotionType, string> = {
  great: '😄',
  good: '🙂',
  calm: '😌',
  notGood: '😕',
  overwhelmed: '😣',
};

export default function JournalWeeklyScreen() {
  const { colors } = useTheme();
  const { data: week, isPending } = useWeeklyReview();

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={26} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Weekly Review</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>This Week</Text>

        {isPending && !week ? (
          <>
            <SkeletonCard lines={1} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (
          <>
            {/* ── Journal count ──────────────────────────────────────── */}
            <Text style={[styles.count, { color: colors.text.primary }]}>
              {week?.count ?? 0} {week?.count === 1 ? 'Journal' : 'Journals'}
            </Text>

            {/* ── Most common mood ───────────────────────────────────── */}
            <View style={styles.row}>
              <Text style={styles.rowIcon}>😊</Text>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text.secondary }]}>
                  Most common mood
                </Text>
                <Text style={[styles.rowValue, { color: colors.text.primary }]}>
                  {week?.mostCommonMood
                    ? `${MOOD_EMOJI[week.mostCommonMood]} ${week.mostCommonMoodLabel}`
                    : 'No moods logged yet'}
                </Text>
              </View>
            </View>

            {/* ── Biggest lesson ─────────────────────────────────────── */}
            <View style={styles.row}>
              <Text style={styles.rowIcon}>🌱</Text>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text.secondary }]}>
                  Biggest lesson
                </Text>
                <Text style={[styles.rowValue, { color: colors.text.primary }]}>
                  {week?.biggestLesson}
                </Text>
              </View>
            </View>

            {/* ── Meaningful memory ───────────────────────────────────── */}
            <View style={styles.row}>
              <Text style={styles.rowIcon}>⭐</Text>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text.secondary }]}>
                  Meaningful memory
                </Text>
                {week?.meaningfulMemory ? (
                  <Pressable
                    onPress={() =>
                      router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', week.meaningfulMemory!.id))
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Open memory ${week.meaningfulMemory.title}`}
                  >
                    <Text style={[styles.rowLink, { color: CYAN }]}>
                      {week.meaningfulMemory.title}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.rowValue, { color: colors.text.primary }]}>
                    No meaningful memory yet
                  </Text>
                )}
              </View>
            </View>

            {/* ── AI Reflection ───────────────────────────────────────── */}
            <Text style={[styles.kicker, { color: colors.text.tertiary, marginTop: spacing.lg }]}>
              ✨ AI Reflection
            </Text>
            <GlassCard themeColor={CYAN} className="mt-2">
              <Text style={[styles.body, { color: colors.text.primary }]}>
                {week?.reflection}
              </Text>
            </GlassCard>

            {/* ── Tone lines ──────────────────────────────────────────── */}
            <View style={styles.tone}>
              <Text style={[styles.toneLine, { color: colors.text.primary }]}>
                {week?.toneA}
              </Text>
              <Text style={[styles.toneLine, { color: colors.text.primary }]}>
                {week?.toneB}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: typography.fontFamily.display,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.sm,
  },
  count: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: typography.fontFamily.sans,
  },
  rowValue: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.fontFamily.sans,
  },
  rowLink: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: typography.fontFamily.sans,
  },
  tone: {
    marginTop: spacing.lg,
  },
  toneLine: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    lineHeight: 30,
  },
});
