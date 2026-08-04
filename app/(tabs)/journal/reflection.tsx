/**
 * Jouspace — AI Reflection (R1 / Sprint 2.6)
 *
 * A dedicated reflection surface. Not chat. Not analysis. Just a quiet Pattern,
 * an Observation, and an open Question — derived locally from the user's own
 * entries (see buildReflection in ReflectionService). The full AI Analysis
 * pipeline (JOURNAL_TECHNICAL_ARCHITECTURE.md) will deepen this later.
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
import { useJournalReflection } from '@/features/reflection/hooks/useJournalReflection';

const CYAN = '#22D3EE';

export default function JournalReflectionScreen() {
  const { colors } = useTheme();
  const { data: reflection, isPending } = useJournalReflection();

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Reflection</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>Today's Reflection</Text>

        {isPending && !reflection ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (
          <>
            <Text style={[styles.kicker, { color: colors.text.tertiary }]}>Pattern</Text>
            <GlassCard themeColor={CYAN} className="mt-2">
              <Text style={[styles.body, { color: colors.text.primary }]}>
                {reflection?.pattern}
              </Text>
            </GlassCard>

            <Text style={[styles.kicker, { color: colors.text.tertiary, marginTop: spacing.lg }]}>
              Observation
            </Text>
            <GlassCard themeColor={CYAN} className="mt-2">
              <Text style={[styles.body, { color: colors.text.primary }]}>
                {reflection?.observation}
              </Text>
            </GlassCard>

            <Text style={[styles.kicker, { color: colors.text.tertiary, marginTop: spacing.lg }]}>
              Question
            </Text>
            <GlassCard themeColor={CYAN} className="mt-2">
              <Text style={[styles.question, { color: colors.text.primary }]}>
                {reflection?.question}
              </Text>
            </GlassCard>

            <Text style={[styles.note, { color: colors.text.tertiary }]}>
              Reflection is derived from your own words in this phase. Deeper,
              model-generated insight arrives with the AI pipeline.
            </Text>
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
    marginBottom: spacing.lg,
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
  question: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
    fontFamily: typography.fontFamily.display,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
});
