/**
 * Jouspace — Journal History (J5)
 *
 * Full chronological archive of the user's entries, grouped by day. Presentational:
 * reads the Journal Hub cache (`useJournalHub`). Rows open the Detail screen.
 */

import React, { useMemo } from 'react';
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
import { useJournalHub } from '@/features/reflection/hooks/useJournalHub';
import { relativeDayLabel, wordCount } from '@/features/reflection/services/ReflectionService';

interface Group {
  key: string;
  label: string;
  entries: { id: string; snippet: string; words: number }[];
}

export default function JournalHistoryScreen() {
  const { colors } = useTheme();
  const { data: hub, isPending } = useJournalHub();

  const groups = useMemo<Group[]>(() => {
    const entries = hub?.entries ?? [];
    const byDay = new Map<string, Group>();
    for (const entry of entries) {
      const dayKey = new Date(entry.created_at).toDateString();
      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, {
          key: dayKey,
          label: relativeDayLabel(entry.created_at),
          entries: [],
        });
      }
      byDay.get(dayKey)!.entries.push({
        id: entry.id,
        snippet: entry.body || entry.title || 'Untitled entry',
        words: wordCount(entry.body),
      });
    }
    return Array.from(byDay.values());
  }, [hub?.entries]);

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>History</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isPending && !hub ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : groups.length === 0 ? (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            No entries yet. Your story starts with a single line.
          </Text>
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.text.secondary }]}>
                {group.label}
              </Text>
              {group.entries.map((row) => (
                <GlassCard
                  key={row.id}
                  themeColor={colors.brand.primary}
                  onPress={() => router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', row.id))}
                  className="mt-2"
                >
                  <Text
                    style={[styles.snippet, { color: colors.text.primary }]}
                    numberOfLines={2}
                  >
                    {row.snippet}
                  </Text>
                  <Text style={[styles.meta, { color: colors.text.tertiary }]}>
                    {row.words} words
                  </Text>
                </GlassCard>
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
  group: {
    marginTop: spacing.md,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  snippet: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.fontFamily.sans,
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.fontFamily.sans,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
});
