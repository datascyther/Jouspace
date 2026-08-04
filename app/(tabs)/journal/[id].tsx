/**
 * Jouspace — Journal Entry Detail (J3 / Sprint 2.3)
 *
 * Reading mode. The user's words are shown exactly as written; AI analysis is
 * surfaced as a derived "AI Reflection" companion card (Phase 1). Mood (read from
 * the `attachments` JSON column), Key Moments, and Related Memories are all
 * derived from the user's own entries. Edit/Delete remain available as opt-in
 * header actions. Previous/Next walk the journal chronologically.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react-native';

import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { GlassCard } from '@/shared/components/GlassCard';
import { GradientButton } from '@/shared/components/GradientButton';
import { SkeletonCard } from '@/shared/components/SkeletonLoader';
import { useTheme } from '@/hooks/useTheme';
import { useUserId } from '@/shared/hooks/useAuth';
import { useAppStore } from '@/core/store/useAppStore';
import { useSyncStore } from '@/core/store/useSyncStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { journalService } from '../../../backend/services/JournalService';
import type { JournalRow } from '../../../backend/services/JournalService';
import type { JournalPatch } from '../../../backend/repositories/JournalRepository';
import { journalRepository } from '@/repositories/JournalRepository';
import { spacing, typography } from '@/core/theme';
import { ROUTES } from '@/core/config/routes';
import { readJournalMeta } from '@/features/reflection';
import {
  wordCount,
  relativeDayLabel,
  buildReflection,
} from '@/features/reflection/services/ReflectionService';
import { EMOTION_COLORS } from '@/constants/emotions';
import type { EmotionType } from '@/constants/emotions';

const DANGER = '#EF4444';
const CYAN = '#22D3EE';

const MOOD_EMOJI: Record<EmotionType, string> = {
  great: '😄',
  good: '🙂',
  calm: '😌',
  notGood: '😕',
  overwhelmed: '😣',
};

interface DetailData {
  entry: JournalRow | null;
  all: JournalRow[];
}

export default function JournalDetailScreen() {
  const { colors } = useTheme();
  const uid = useUserId();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const addToast = useAppStore((s) => s.addToast);
  const enqueueItem = useSyncStore((state) => state.enqueueItem);

  const { data, isPending } = useQuery<DetailData>({
    queryKey: ['journal', 'detail', id],
    queryFn: async () => {
      const all = [...(await journalRepository.loadEntries(uid ?? ''))].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      let entry = all.find((e) => e.id === id) ?? null;
      if (!entry) {
        try {
          entry = (await journalService.get(id as string)) ?? null;
        } catch {
          // fall through; entry stays null
        }
      }
      return { entry, all };
    },
    enabled: !!uid && !!id,
  });

  // ── Edit sheet state ────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [bodyHeight, setBodyHeight] = useState(160);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close transient sheets when navigating between entries.
  useEffect(() => {
    setEditOpen(false);
    setDeleteOpen(false);
  }, [id]);

  const openEdit = () => {
    setEditTitle(data?.entry?.title ?? '');
    setEditBody(data?.entry?.body ?? '');
    setBodyHeight(160);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (isSaving || !uid || !id) return;
    if (!editTitle.trim() && !editBody.trim()) {
      addToast({ type: 'error', message: 'Write something before saving' });
      return;
    }
    setIsSaving(true);
    const patch: JournalPatch = {
      title: editTitle.trim() || null,
      body: editBody.trim() || null,
    };
    enqueueItem('update_journal_entry', { uid, id, patch }, queryClient)
      .then(() => {
        addToast({ type: 'success', message: 'Entry updated' });
        setEditOpen(false);
      })
      .catch(() => {
        addToast({ type: 'error', message: 'Could not update your entry' });
      })
      .finally(() => setIsSaving(false));
  };

  const handleDelete = () => {
    if (isDeleting || !uid || !id) return;
    setIsDeleting(true);
    enqueueItem('remove_journal_entry', { uid, id }, queryClient)
      .then(() => {
        addToast({ type: 'success', message: 'Entry deleted' });
        setDeleteOpen(false);
        router.back();
      })
      .catch(() => {
        addToast({ type: 'error', message: 'Could not delete your entry' });
        setIsDeleting(false);
        setDeleteOpen(false);
      });
  };

  const entry = data?.entry ?? null;
  const all = data?.all ?? [];

  const idx = all.findIndex((e) => e.id === id);
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const newer = idx > 0 ? all[idx - 1] : null;

  const reflection = buildReflection(all);
  const meta = entry ? readJournalMeta(entry.attachments) : {};
  const moodEmoji = meta.mood ? MOOD_EMOJI[meta.mood] : null;

  const keyMoments = all.filter((e) => e.id !== id && wordCount(e.body) >= 50).slice(0, 4);
  const entryTags = meta.tags ?? [];
  const related = entryTags.length
    ? all
        .filter(
          (e) =>
            e.id !== id &&
            (readJournalMeta(e.attachments).tags ?? []).some((t) => entryTags.includes(t)),
        )
        .slice(0, 4)
    : [];

  const created = entry?.created_at ? new Date(entry.created_at) : null;
  const dateLabel = created
    ? created.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const timeLabel = created
    ? created.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : '';

  const goTo = (otherId: string) =>
    router.push(ROUTES.JOURNAL.DETAIL.replace('[id]', otherId));

  const editWordCount = editBody.trim()
    ? editBody.trim().split(/\s+/).filter(Boolean).length
    : 0;

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
        <View style={styles.headerActions}>
          <Pressable
            onPress={openEdit}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Edit entry"
            disabled={!entry}
          >
            <Pencil size={22} color={entry ? colors.text.primary : colors.text.tertiary} />
          </Pressable>
          <Pressable
            onPress={() => setDeleteOpen(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Delete entry"
            disabled={!entry}
          >
            <Trash2 size={22} color={entry ? DANGER : colors.text.tertiary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isPending ? (
          <>
            <SkeletonCard lines={1} />
            <SkeletonCard lines={4} />
          </>
        ) : !entry ? (
          <Text style={[styles.bodyText, { color: colors.text.secondary }]}>
            This entry could not be found.
          </Text>
        ) : (
          <>
            {entry.title ? (
              <Text style={[styles.title, { color: colors.text.primary }]}>{entry.title}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: colors.text.tertiary }]}>
                {dateLabel}
                {dateLabel && timeLabel ? '  ·  ' : ''}
                {timeLabel}
                {entry.body ? `  ·  ${wordCount(entry.body)} words` : ''}
              </Text>
              {meta.mood ? (
                <View
                  style={[
                    styles.moodChip,
                    { backgroundColor: `${EMOTION_COLORS[meta.mood].glow}1A` },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{moodEmoji}</Text>
                  <Text style={[styles.moodLabel, { color: colors.text.secondary }]}>
                    {EMOTION_COLORS[meta.mood].label}
                  </Text>
                </View>
              ) : null}
            </View>

            {(meta.tags ?? []).length > 0 ? (
              <View style={styles.tagsRow}>
                {(meta.tags ?? []).map((t) => (
                  <View
                    key={t}
                    style={[styles.tagChip, { borderColor: colors.border.default }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text.secondary }]}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={[styles.bodyText, { color: colors.text.primary }]}>
              {entry.body || 'No body text for this entry.'}
            </Text>

            {/* ── AI Reflection (derived) ─────────────────────────────── */}
            <Text style={[styles.kicker, { color: colors.text.tertiary, marginTop: spacing.lg }]}>
              ✨ AI Reflection
            </Text>
            <GlassCard themeColor={CYAN} className="mt-2">
              <Text style={[styles.body, { color: colors.text.primary }]}>
                {reflection.noticing}
              </Text>
            </GlassCard>

            {/* ── Key Moments ─────────────────────────────────────────── */}
            {keyMoments.length > 0 ? (
              <>
                <Text style={[styles.kicker, { color: colors.text.secondary, marginTop: spacing.lg }]}>
                  Key Moments
                </Text>
                {keyMoments.map((m) => (
                  <GlassCard
                    key={m.id}
                    themeColor={CYAN}
                    onPress={() => goTo(m.id)}
                    className="mt-2"
                  >
                    <Text style={[styles.kickerSm, { color: colors.text.tertiary }]}>
                      {relativeDayLabel(m.created_at)}
                    </Text>
                    <Text style={[styles.body, { color: colors.text.primary }]} numberOfLines={2}>
                      {m.body || m.title || 'Untitled entry'}
                    </Text>
                  </GlassCard>
                ))}
              </>
            ) : null}

            {/* ── Related Memories ────────────────────────────────────── */}
            {related.length > 0 ? (
              <>
                <Text style={[styles.kicker, { color: colors.text.secondary, marginTop: spacing.lg }]}>
                  Related Memories
                </Text>
                {related.map((r) => (
                  <GlassCard
                    key={r.id}
                    themeColor={CYAN}
                    onPress={() => goTo(r.id)}
                    className="mt-2"
                  >
                    <Text style={[styles.kickerSm, { color: colors.text.tertiary }]}>
                      {relativeDayLabel(r.created_at)}
                    </Text>
                    <Text style={[styles.body, { color: colors.text.primary }]} numberOfLines={2}>
                      {r.body || r.title || 'Untitled entry'}
                    </Text>
                  </GlassCard>
                ))}
              </>
            ) : null}

            {/* ── Previous / Next ─────────────────────────────────────── */}
            {(older || newer) && (
              <View style={styles.navRow}>
                <Pressable
                  onPress={() => older && goTo(older.id)}
                  disabled={!older}
                  style={[
                    styles.navBtn,
                    { borderColor: colors.border.default, opacity: older ? 1 : 0.4 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Older entry"
                >
                  <Text style={[styles.navText, { color: colors.text.primary }]}>← Older</Text>
                </Pressable>
                <Pressable
                  onPress={() => newer && goTo(newer.id)}
                  disabled={!newer}
                  style={[
                    styles.navBtn,
                    { borderColor: colors.border.default, opacity: newer ? 1 : 0.4 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Newer entry"
                >
                  <Text style={[styles.navText, { color: colors.text.primary }]}>Newer →</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Edit sheet ───────────────────────────────────────────────── */}
      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setEditOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss editor"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheet}
          >
            <Pressable onPress={() => {}}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border.default }]} />
              <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>Edit entry</Text>

              <TextInput
                style={[styles.editTitle, { color: colors.text.primary }]}
                placeholder="Title (optional)"
                placeholderTextColor={colors.text.tertiary}
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={200}
                accessibilityLabel="Entry title"
              />
              <TextInput
                style={[
                  styles.editBody,
                  { color: colors.text.primary, height: Math.max(160, bodyHeight) },
                ]}
                placeholder="Write whatever is on your mind."
                placeholderTextColor={colors.text.tertiary}
                value={editBody}
                onChangeText={setEditBody}
                multiline
                textAlignVertical="top"
                onContentSizeChange={(e) => setBodyHeight(e.nativeEvent.contentSize.height)}
                accessibilityLabel="Entry body"
              />
              <Text style={[styles.editWordCount, { color: colors.text.tertiary }]}>
                {editWordCount} words
              </Text>

              <View style={[styles.sheetFooter, { borderTopColor: colors.border.default }]}>
                <GradientButton
                  title="Save changes"
                  onPress={handleEditSave}
                  disabled={isSaving}
                  loading={isSaving}
                  size="lg"
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      <Modal
        visible={deleteOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setDeleteOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Cancel delete"
        >
          <Pressable onPress={() => {}} style={[styles.confirmCard, { backgroundColor: colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>
              Delete this entry?
            </Text>
            <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
              This removes the entry from your journal. This cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmCancel, { borderColor: colors.border.default }]}
                onPress={() => setDeleteOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.confirmCancelText, { color: colors.text.primary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmDelete, { backgroundColor: DANGER }]}
                onPress={handleDelete}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Delete"
              >
                <Text style={styles.confirmDeleteText}>
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 64,
    justifyContent: 'space-between',
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
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  meta: {
    fontSize: 13,
    fontFamily: typography.fontFamily.sans,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  moodEmoji: {
    fontSize: 15,
    marginRight: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tagChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.sans,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: typography.fontFamily.sans,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  kickerSm: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: typography.fontFamily.sans,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.sans,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  navBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: typography.fontFamily.display,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editBody: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: typography.fontFamily.sans,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editWordCount: {
    fontSize: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
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
    marginBottom: spacing.xs,
  },
  confirmText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.sans,
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
  confirmDelete: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.sans,
  },
});
