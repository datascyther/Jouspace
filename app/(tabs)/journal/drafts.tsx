/**
 * Jouspace — Drafts (J4)
 *
 * Shows the single in-progress local draft (see draftStorage). Drafts are a
 * local convenience, never synced. "Continue" reopens the New Journal composer
 * (which prefills from this draft); "Discard" clears it.
 */

import React, { useEffect, useState } from 'react';
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
import { GradientButton } from '@/shared/components/GradientButton';
import { useTheme } from '@/hooks/useTheme';
import { useUserId } from '@/shared/hooks/useAuth';
import { spacing, typography } from '@/core/theme';
import { ROUTES } from '@/core/config/routes';
import {
  loadDraft,
  clearDraft,
} from '@/features/reflection';
import type { JournalDraft } from '@/features/reflection';
import { relativeDayLabel, wordCount } from '@/features/reflection/services/ReflectionService';

export default function JournalDraftsScreen() {
  const { colors } = useTheme();
  const uid = useUserId();

  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!uid) return;
    loadDraft(uid).then((d) => {
      if (cancelled) return;
      const hasContent = !!d && (d.title.trim().length > 0 || d.body.trim().length > 0);
      setDraft(hasContent ? d : null);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const handleDiscard = async () => {
    if (!uid || isDiscarding) return;
    setIsDiscarding(true);
    await clearDraft(uid);
    setDraft(null);
    setIsDiscarding(false);
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Drafts</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {draft ? (
          <>
            <Text style={[styles.kicker, { color: colors.text.tertiary }]}>📝 In progress</Text>
            <GlassCard themeColor={colors.brand.primary} className="mt-2">
              <Text style={[styles.draftTitle, { color: colors.text.primary }]}>
                {draft.title.trim() || 'Untitled draft'}
              </Text>
              <Text style={[styles.draftSnippet, { color: colors.text.secondary }]} numberOfLines={4}>
                {draft.body.trim() || 'No body text yet.'}
              </Text>
              <Text style={[styles.draftMeta, { color: colors.text.tertiary }]}>
                {relativeDayLabel(new Date(draft.updatedAt).toISOString())} •{' '}
                {wordCount(draft.body)} words
              </Text>
            </GlassCard>

            <GradientButton
              title="Continue writing"
              onPress={() => router.push(ROUTES.JOURNAL.NEW)}
              size="lg"
              style={styles.continueBtn}
            />

            <Pressable
              onPress={handleDiscard}
              disabled={isDiscarding}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Discard draft"
            >
              <Text style={[styles.discard, { color: colors.text.tertiary }]}>
                {isDiscarding ? 'Discarding…' : 'Discard draft'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            You have no saved drafts. Start a new journal entry and it will be kept here
            while you write.
          </Text>
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
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.xs,
  },
  draftSnippet: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.fontFamily.sans,
  },
  draftMeta: {
    fontSize: 12,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  continueBtn: {
    marginTop: spacing.lg,
  },
  discard: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.sans,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
});
