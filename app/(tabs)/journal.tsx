/**
 * Jouspace — Journal Hub (J1)
 *
 * The home of the Journal pillar. Per the frozen Wireframe 1 (JOURNAL_FOUNDATION,
 * Sprint 1.10) the Hub is a calm, low-pressure surface:
 *   • greeting + "Your thoughts matter."
 *   • New Journal (primary CTA)
 *   • Continue Draft (only when a local draft exists)
 *   • AI Reflection (derived, cyan — the companion's noticing voice)
 *   • Recent Journal (user content, purple)
 *   • Memories (derived, cyan)
 *   • Timeline preview
 *
 * The screen is 100% presentational: all data comes from `useJournalHub()`.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';

import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { GlassCard } from '@/shared/components/GlassCard';
import { GradientButton } from '@/shared/components/GradientButton';
import { SectionHeader } from '@/shared/components/SectionHeader';
import { SkeletonCard } from '@/shared/components/SkeletonLoader';
import { useTheme } from '@/hooks/useTheme';
import { useUserDisplayName } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/core/config/routes';
import { spacing, typography } from '@/core/theme';
import { useJournalHub } from '@/features/reflection/hooks/useJournalHub';
import { readJournalMeta } from '@/features/reflection';
import {
  isToday,
  relativeDayLabel,
  wordCount,
} from '@/features/reflection/services/ReflectionService';

const CYAN = '#22D3EE';

const MOOD_EMOJI: Record<string, string> = {
  great: '😄',
  good: '🙂',
  calm: '😌',
  notGood: '😕',
  overwhelmed: '😣',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function JournalHubScreen() {
  const { colors } = useTheme();
  const firstName = useUserDisplayName();
  const { data: hub, isPending } = useJournalHub();

  const greeting = getGreeting();
  const entries = hub?.entries ?? [];

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const now = new Date();
  const todayCount = entries.filter((e) => isToday(e.created_at)).length;
  const yesterdayCount = entries.filter((e) => {
    const diff = Math.round((startOfDay(now) - startOfDay(new Date(e.created_at))) / 86_400_000);
    return diff === 1;
  }).length;
  const weekCount = entries.filter((e) => {
    const diff = (startOfDay(now) - startOfDay(new Date(e.created_at))) / 86_400_000;
    return diff >= 2 && diff <= 7;
  }).length;

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.text.primary }]}>Journal</Text>
          <Pressable
            onPress={() => router.push(ROUTES.JOURNAL.SEARCH)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Search journal"
          >
            <Search size={22} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* ── Greeting ────────────────────────────────────────────────── */}
        <Text style={[styles.greeting, { color: colors.text.primary }]}>
          {greeting}, {firstName}
        </Text>
        <Text style={[styles.tagline, { color: colors.text.secondary }]}>
          Your thoughts matter.
        </Text>

        {/* ── New Journal (primary CTA) ───────────────────────────────── */}
        <GradientButton
          title="+  New Journal"
          onPress={() => router.push(ROUTES.JOURNAL.NEW)}
          size="lg"
        />

        {/* ── Continue Draft ──────────────────────────────────────────── */}
        {hub?.draft && (
          <GlassCard
            themeColor={colors.brand.primary}
            onPress={() => router.push(ROUTES.JOURNAL.DRAFTS)}
            className="mt-3"
          >
            <View style={styles.draftRow}>
              <Text style={styles.draftIcon}>📝</Text>
              <View style={styles.draftText}>
                <Text style={[styles.draftTitle, { color: colors.text.primary }]}>
                  Continue Draft
                </Text>
                <Text style={[styles.draftMeta, { color: colors.text.secondary }]}>
                  {relativeDayLabel(new Date(hub.draft.updatedAt).toISOString())} •{' '}
                  {wordCount(hub.draft.body)} words
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* ── AI Reflection (derived, cyan) ───────────────────────────── */}
        <Text style={[styles.sectionKicker, { color: colors.text.tertiary }]}>
          ✨ AI Reflection
        </Text>
        {isPending && !hub ? (
          <SkeletonCard lines={2} />
        ) : (
          <GlassCard
            themeColor={CYAN}
            onPress={() => router.push(ROUTES.JOURNAL.REFLECTION)}
            className="mt-2"
          >
            <Text style={[styles.aiText, { color: colors.text.primary }]}>
              {hub?.aiReflection}
            </Text>
          </GlassCard>
        )}

        {/* ── Recent Journal (user content, purple) ───────────────────── */}
        <SectionHeader
          title="Recent Journal"
          style={styles.sectionHeader}
        />
        {isPending && !hub ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : entries.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            No entries yet. Your first line is the hardest — and the most worth writing.
          </Text>
        ) : (
          entries.slice(0, 6).map((entry) => (
            <GlassCard
              key={entry.id}
              themeColor={colors.brand.primary}
              onPress={() =>
                router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', entry.id))
              }
              className="mt-2"
            >
              <Text style={[styles.entryDay, { color: colors.text.secondary }]}>
                {readJournalMeta(entry.attachments).mood ? `${MOOD_EMOJI[readJournalMeta(entry.attachments).mood!]}  ` : ''}
                {relativeDayLabel(entry.created_at)}
              </Text>
              <Text
                style={[styles.entrySnippet, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {entry.body || entry.title || 'Untitled entry'}
              </Text>
              <Text style={[styles.entryMeta, { color: colors.text.tertiary }]}>
                {wordCount(entry.body)} words
              </Text>
            </GlassCard>
          ))
        )}

        {/* ── Memories (derived, cyan) ────────────────────────────────── */}
        <GlassCard
          themeColor={CYAN}
          onPress={() => router.push(ROUTES.JOURNAL.MEMORY)}
          className="mt-4"
        >
          <Text style={styles.memEyebrow}>🧠 Memories</Text>
          <Text style={[styles.memText, { color: colors.text.primary }]}>
            {hub?.memoryCount ?? 0} saved {hub?.memoryCount === 1 ? 'memory' : 'memories'}
          </Text>
        </GlassCard>

        {/* ── Weekly Reflection ─────────────────────────────────────── */}
        <GlassCard
          themeColor={CYAN}
          onPress={() => router.push(ROUTES.JOURNAL.WEEKLY)}
          className="mt-4"
        >
          <Text style={styles.memEyebrow}>🌿 Weekly Reflection</Text>
          <Text style={[styles.memText, { color: colors.text.primary }]}>
            Your week, gently summed up
          </Text>
        </GlassCard>

        {/* ── Timeline preview ────────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push(ROUTES.JOURNAL.TIMELINE)}
          accessibilityRole="button"
          accessibilityLabel="View full history"
        >
          <View style={styles.timelineHeader}>
            <Text style={[styles.timelineHeaderTitle, { color: colors.text.primary }]}>
              Timeline
            </Text>
            <Text style={[styles.timelineSeeAll, { color: colors.brand.primary }]}>
              See all ›
            </Text>
          </View>
        </Pressable>
        <View style={styles.timelineRow}>
          <TimelineChip label="Today" count={todayCount} colors={colors} onPress={() => router.push(ROUTES.JOURNAL.HISTORY)} />
          <TimelineChip label="Yesterday" count={yesterdayCount} colors={colors} onPress={() => router.push(ROUTES.JOURNAL.HISTORY)} />
          <TimelineChip label="Last Week" count={weekCount} colors={colors} onPress={() => router.push(ROUTES.JOURNAL.HISTORY)} />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function TimelineChip({
  label,
  count,
  colors,
  onPress,
}: {
  label: string;
  count: number;
  colors: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${count} entries`}
      style={[
        styles.timelineChip,
        { backgroundColor: colors.surface.secondary, borderColor: colors.border.default },
      ]}
    >
      <Text style={[styles.timelineCount, { color: colors.text.primary }]}>{count}</Text>
      <Text style={[styles.timelineLabel, { color: colors.text.secondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: typography.fontSize['hero'] ?? 32,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: typography.fontFamily.display,
  },
  tagline: {
    fontSize: 15,
    marginTop: spacing.xs / 2,
    marginBottom: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
  sectionKicker: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  aiText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.sans,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.sans,
    marginTop: spacing.sm,
  },
  entryDay: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs / 2,
    fontFamily: typography.fontFamily.sans,
  },
  entrySnippet: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.fontFamily.sans,
  },
  entryMeta: {
    fontSize: 12,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  draftText: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  draftMeta: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamily.sans,
  },
  memEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
    fontFamily: typography.fontFamily.sans,
  },
  memText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.sans,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  timelineHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.display,
  },
  timelineSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  timelineChip: {
    flex: 1,
    marginRight: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  timelineCount: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
  },
  timelineLabel: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamily.sans,
  },
});
