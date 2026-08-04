/**
 * Jouspace — Journal Search (J6)
 *
 * Client-side search over the user's entries. Presentational: filters the
 * Journal Hub cache by title/body text.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';

import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/core/config/routes';
import { spacing, typography } from '@/core/theme';
import { useJournalHub } from '@/features/reflection/hooks/useJournalHub';
import { relativeDayLabel, wordCount } from '@/features/reflection/services/ReflectionService';

export default function JournalSearchScreen() {
  const { colors } = useTheme();
  const { data: hub } = useJournalHub();
  const [query, setQuery] = useState('');

  const entries = hub?.entries ?? [];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      `${e.title ?? ''} ${e.body ?? ''}`.toLowerCase().includes(q),
    );
  }, [entries, query]);

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Search</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
        <Search size={18} color={colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search your journal"
          placeholderTextColor={colors.text.tertiary}
          value={query}
          onChangeText={setQuery}
          autoFocus
          accessibilityLabel="Search journal input"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            You have no entries to search yet.
          </Text>
        ) : results.length === 0 ? (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            No entries match “{query}”.
          </Text>
        ) : (
          results.map((entry) => (
            <GlassCard
              key={entry.id}
              themeColor={colors.brand.primary}
              onPress={() => router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', entry.id))}
              className="mt-2"
            >
              <Text style={[styles.day, { color: colors.text.secondary }]}>
                {relativeDayLabel(entry.created_at)}
              </Text>
              <Text
                style={[styles.snippet, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {entry.body || entry.title || 'Untitled entry'}
              </Text>
              <Text style={[styles.meta, { color: colors.text.tertiary }]}>
                {wordCount(entry.body)} words
              </Text>
            </GlassCard>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    fontFamily: typography.fontFamily.sans,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  day: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
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
