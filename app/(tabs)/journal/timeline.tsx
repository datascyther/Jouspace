/**
 * Jouspace — Timeline (Sprint 2.4)
 *
 * "See your life, not your files." A month → day timeline that surfaces the
 * facets of a journaling life: ✍️ Journal, 🧠 AI Reflection, ⭐ Memory. All
 * derived locally from the user's own entries (Phase 1). Presentational: reads
 * useJournalTimeline().
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
import { SkeletonCard } from '@/shared/components/SkeletonLoader';
import { useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/core/config/routes';
import { spacing, typography } from '@/core/theme';
import { useJournalTimeline } from '@/features/reflection/hooks/useJournalTimeline';
import type { TimelineMoment } from '@/features/reflection';
import { EMOTION_COLORS } from '@/constants/emotions';
import type { EmotionType } from '@/constants/emotions';

const MOMENT_ICON: Record<TimelineMoment['kind'], string> = {
  journal: '✍️',
  reflection: '🧠',
  memory: '⭐',
};

const MOOD_EMOJI: Record<EmotionType, string> = {
  great: '😄',
  good: '🙂',
  calm: '😌',
  notGood: '😕',
  overwhelmed: '😣',
};

export default function JournalTimelineScreen() {
  const { colors } = useTheme();
  const { data: timeline, isPending } = useJournalTimeline();

  const goToMoment = (moment: TimelineMoment) => {
    if (moment.kind === 'reflection') {
      router.push(ROUTES.JOURNAL.REFLECTION);
    } else {
      router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', moment.id));
    }
  };

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Timeline</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isPending && !timeline ? (
          <>
            <SkeletonCard lines={1} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (timeline?.months.length ?? 0) === 0 ? (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            Your story will appear here as you write. See your life, not your files.
          </Text>
        ) : (
          timeline?.months.map((month) => (
            <View key={month.key} style={styles.month}>
              <Text style={[styles.monthLabel, { color: colors.text.primary }]}>
                {month.label}
              </Text>
              {month.days.map((day) => (
                <View key={day.key} style={styles.day}>
                  <Text style={[styles.dayLabel, { color: colors.text.secondary }]}>
                    {day.label}
                  </Text>
                  <View style={styles.moments}>
                    {day.moments.map((moment, i) => (
                      <Pressable
                        key={`${moment.kind}-${i}`}
                        onPress={() => goToMoment(moment)}
                        accessibilityRole="button"
                        accessibilityLabel={`${moment.label} on ${day.label}`}
                        style={[styles.momentRow, { borderColor: colors.border.default }]}
                      >
                        <Text style={styles.momentIcon}>{MOMENT_ICON[moment.kind]}</Text>
                        <View style={styles.momentText}>
                          <Text style={[styles.momentLabel, { color: colors.text.primary }]}>
                            {moment.label}
                            {moment.count && moment.count > 1 ? ` · ${moment.count} entries` : ''}
                          </Text>
                          {moment.kind === 'journal' && moment.mood ? (
                            <Text style={[styles.momentMood, { color: colors.text.secondary }]}>
                              {MOOD_EMOJI[moment.mood]} {EMOTION_COLORS[moment.mood].label}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))
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
  month: {
    marginTop: spacing.lg,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.sm,
  },
  day: {
    marginBottom: spacing.sm,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  moments: {
    gap: spacing.xs,
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  momentIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  momentText: {
    flex: 1,
  },
  momentLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  momentMood: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: typography.fontFamily.sans,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
});
