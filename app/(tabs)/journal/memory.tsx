/**
 * Jouspace — Memory Library (M1 / Sprint 2.5)
 *
 * "Not every journal becomes a memory. Only meaningful ones."
 *
 * A curated library of named memories the user keeps. AI can SUGGEST candidates
 * (derived from substantial entries), but the user always confirms — nothing is
 * added without an explicit tap. Memories persist locally (Phase 1; the Pinecone
 * Memory engine arrives in Phase 2+). Presentational: reads useMemoryLibrary().
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { GlassCard } from '@/shared/components/GlassCard';
import { SkeletonCard } from '@/shared/components/SkeletonLoader';
import { useTheme } from '@/hooks/useTheme';
import { useUserId } from '@/shared/hooks/useAuth';
import { useAppStore } from '@/core/store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/core/config/routes';
import { spacing, typography } from '@/core/theme';
import { useMemoryLibrary, JOURNAL_MEMORY_QUERY_KEY } from '@/features/reflection/hooks/useMemoryLibrary';
import { addMemory, removeMemory } from '@/features/reflection/persistence/memoryStorage';
import type { MemoryItem } from '@/features/reflection/persistence/memoryStorage';

const CYAN = '#22D3EE';

export default function JournalMemoryScreen() {
  const { colors } = useTheme();
  const uid = useUserId();
  const addToast = useAppStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data, isPending } = useMemoryLibrary();

  const [confirmSuggestion, setConfirmSuggestion] = useState<{
    entryId: string;
    title: string;
    snippet: string;
  } | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const openConfirm = (s: { entryId: string; title: string; snippet: string }) => {
    setDraftTitle(s.title);
    setConfirmSuggestion(s);
  };

  const confirmAdd = async () => {
    if (!uid || !confirmSuggestion) return;
    const title = draftTitle.trim() || confirmSuggestion.title;
    await addMemory(uid, {
      title,
      entryId: confirmSuggestion.entryId,
      snippet: confirmSuggestion.snippet,
      source: 'ai-suggested',
    });
    await queryClient.invalidateQueries({ queryKey: JOURNAL_MEMORY_QUERY_KEY(uid) });
    addToast({ type: 'success', message: 'Saved to your memories' });
    setConfirmSuggestion(null);
  };

  const handleRemove = async (id: string) => {
    if (!uid) return;
    await removeMemory(uid, id);
    await queryClient.invalidateQueries({ queryKey: JOURNAL_MEMORY_QUERY_KEY(uid) });
  };

  const memories = data?.memories ?? [];
  const suggestions = data?.suggestions ?? [];

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Memories</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.text.secondary }]}>
          Not every journal becomes a memory. Only meaningful ones.
        </Text>

        {/* ── Meaningful Memories ─────────────────────────────────────── */}
        <Text style={[styles.kicker, { color: colors.text.secondary, marginTop: spacing.lg }]}>
          Meaningful Memories
        </Text>
        {isPending && !data ? (
          <>
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
          </>
        ) : memories.length === 0 ? (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            No memories yet. Promote a meaningful moment from the suggestions below.
          </Text>
        ) : (
          memories.map((m: MemoryItem) => (
            <GlassCard
              key={m.id}
              themeColor={CYAN}
              onPress={m.entryId ? () => router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', m.entryId as string)) : undefined}
              className="mt-2"
            >
              <View style={styles.memRow}>
                <Text style={styles.memIcon}>⭐</Text>
                <View style={styles.memText}>
                  <Text style={[styles.memTitle, { color: colors.text.primary }]}>{m.title}</Text>
                  {m.snippet ? (
                    <Text style={[styles.memSnippet, { color: colors.text.tertiary }]} numberOfLines={1}>
                      {m.snippet}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleRemove(m.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove memory ${m.title}`}
                >
                  <Text style={[styles.memRemove, { color: colors.text.tertiary }]}>×</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))
        )}

        {/* ── AI suggestions (user confirms) ──────────────────────────── */}
        <Text style={[styles.kicker, { color: colors.text.secondary, marginTop: spacing.lg }]}>
          Suggested by your writing
        </Text>
        {suggestions.length === 0 ? (
          <Text style={[styles.empty, { color: colors.text.tertiary }]}>
            No suggestions right now. Keep writing meaningful moments and they will surface here.
          </Text>
        ) : (
          suggestions.map((s) => (
            <GlassCard key={s.entryId} themeColor={CYAN} className="mt-2">
              <Text style={[styles.suggTitle, { color: colors.text.primary }]}>
                {s.title}
              </Text>
              <Text style={[styles.suggSnippet, { color: colors.text.secondary }]} numberOfLines={2}>
                {s.snippet}
              </Text>
              <Pressable
                onPress={() => openConfirm(s)}
                accessibilityRole="button"
                accessibilityLabel={`Save ${s.title} as a memory`}
                style={[styles.addBtn, { borderColor: CYAN }]}
              >
                <Text style={[styles.addBtnText, { color: CYAN }]}>+ Save memory</Text>
              </Pressable>
            </GlassCard>
          ))
        )}

        <Text style={[styles.note, { color: colors.text.tertiary }]}>
          AI can suggest memories. You always confirm.
        </Text>
      </ScrollView>

      {/* ── Confirm suggestion ───────────────────────────────────────── */}
      <Modal
        visible={!!confirmSuggestion}
        animationType="slide"
        transparent
        onRequestClose={() => setConfirmSuggestion(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setConfirmSuggestion(null)}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Pressable onPress={() => {}} style={[styles.confirmCard, { backgroundColor: colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>
              Save this as a memory?
            </Text>
            <TextInput
              style={[styles.titleInput, { color: colors.text.primary, borderColor: colors.border.default }]}
              placeholder="Name this memory"
              placeholderTextColor={colors.text.tertiary}
              value={draftTitle}
              onChangeText={setDraftTitle}
              maxLength={80}
              accessibilityLabel="Memory title"
            />
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmCancel, { borderColor: colors.border.default }]}
                onPress={() => setConfirmSuggestion(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.confirmCancelText, { color: colors.text.primary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmSave, { backgroundColor: CYAN }]}
                onPress={confirmAdd}
                accessibilityRole="button"
                accessibilityLabel="Save memory"
              >
                <Text style={styles.confirmSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  intro: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.sans,
    marginTop: spacing.sm,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.sans,
  },
  memRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  memText: {
    flex: 1,
  },
  memTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  memSnippet: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamily.sans,
  },
  memRemove: {
    fontSize: 20,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.sans,
  },
  suggTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  suggSnippet: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    fontFamily: typography.fontFamily.sans,
  },
  addBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamily.sans,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  confirmCard: {
    borderRadius: 20,
    padding: spacing.lg,
    margin: spacing.lg,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.md,
  },
  titleInput: {
    fontSize: 16,
    fontFamily: typography.fontFamily.sans,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  confirmSave: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#06222B',
    fontFamily: typography.fontFamily.sans,
  },
});
