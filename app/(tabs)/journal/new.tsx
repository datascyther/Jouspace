/**
 * Jouspace — Journal Editor (J2 / Sprint 2.2)
 *
 * The heart of Jouspace: a full-screen, distraction-free writing surface. Writing
 * first, AI never interrupts. Mood and Tags are captured locally and stashed in
 * the `attachments` JSON column (no schema migration); Voice is a future hook.
 * Drafts auto-save so the Hub's "Continue Draft" can reopen them.
 *
 * Rules honoured here: full-screen writing, zero distractions, no AI
 * interrupting, auto-save, user always owns the writing.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { useUserId } from '@/shared/hooks/useAuth';
import { useAppStore } from '@/core/store/useAppStore';
import { spacing, typography } from '@/core/theme';
import { useSaveJournal } from '@/features/reflection/hooks/useSaveJournal';
import {
  loadDraft,
  saveDraft,
  clearDraft,
} from '@/features/reflection/persistence/draftStorage';
import { EMOTION_COLORS } from '@/constants/emotions';
import type { EmotionType } from '@/constants/emotions';
import { relativeDayLabel } from '@/features/reflection/services/ReflectionService';

const MOODS: { type: EmotionType; emoji: string }[] = [
  { type: 'great', emoji: '😄' },
  { type: 'good', emoji: '🙂' },
  { type: 'calm', emoji: '😌' },
  { type: 'notGood', emoji: '😕' },
  { type: 'overwhelmed', emoji: '😣' },
];

const EDITOR_RULES = [
  'Full-screen writing',
  'Zero distractions',
  'No AI interrupting',
  'Auto-save',
  'You always own the writing',
];

export default function NewJournalScreen() {
  const { colors } = useTheme();
  const uid = useUserId();
  const addToast = useAppStore((s) => s.addToast);
  const saveJournal = useSaveJournal();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyHeight, setBodyHeight] = useState(160);
  const [mood, setMood] = useState<EmotionType | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadedRef = useRef(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(new Date());

  // Prefill from an existing local draft (Continue Draft).
  useEffect(() => {
    let cancelled = false;
    if (!uid) return;
    loadDraft(uid).then((draft) => {
      if (cancelled || !draft) return;
      setTitle(draft.title);
      setBody(draft.body);
      setMood(draft.mood ?? null);
      setTags(draft.tags ?? []);
      loadedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Autosave draft (debounced) once the initial load has settled.
  useEffect(() => {
    if (!loadedRef.current || !uid) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      void saveDraft(uid, {
        title,
        body,
        mood,
        tags,
        updatedAt: Date.now(),
      });
    }, 500);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [title, body, mood, tags, uid]);

  const canSave = title.trim().length > 0 || body.trim().length > 0;
  const wordCount = body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0;

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = () => {
    if (!canSave || isSaving || !uid) return;
    setIsSaving(true);
    saveJournal.mutate(
      {
        uid,
        input: {
          title: title.trim() || null,
          body: body.trim() || null,
          attachments: { mood: mood ?? null, tags } as any,
        },
      },
      {
        onSuccess: async () => {
          await clearDraft(uid);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          addToast({ type: 'success', message: 'Journal saved' });
          router.back();
        },
        onError: () => {
          addToast({ type: 'error', message: 'Could not save your entry' });
          setIsSaving(false);
        },
      },
    );
  };

  const timeLabel = startedAt.current.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateLabel = relativeDayLabel(startedAt.current.toISOString());

  return (
    <ScreenContainer edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kb}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header: Back + Save ─────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={26} color={colors.text.primary} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!canSave || isSaving}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Save journal"
          >
            <Text
              style={[
                styles.saveText,
                { color: canSave && !isSaving ? colors.brand.primary : colors.text.tertiary },
              ]}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Title (display) ───────────────────────────────────────── */}
          <TextInput
            style={[styles.titleInput, { color: colors.text.primary }]}
            placeholder="Untitled Journal"
            placeholderTextColor={colors.text.tertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            accessibilityLabel="Journal title"
          />

          {/* ── Timestamp ─────────────────────────────────────────────── */}
          <Text style={[styles.timestamp, { color: colors.text.tertiary }]}>
            {dateLabel} • {timeLabel}
          </Text>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <TextInput
            style={[
              styles.bodyInput,
              { color: colors.text.primary, height: Math.max(160, bodyHeight) },
            ]}
            placeholder="What's on your mind today?"
            placeholderTextColor={colors.text.tertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            onContentSizeChange={(e) => setBodyHeight(e.nativeEvent.contentSize.height)}
            accessibilityLabel="Journal body"
          />

          {/* ── Mood ──────────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>Mood</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const selected = mood === m.type;
              const accent = EMOTION_COLORS[m.type].glow;
              return (
                <Pressable
                  key={m.type}
                  onPress={() => setMood(selected ? null : m.type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mood ${EMOTION_COLORS[m.type].label}`}
                  style={[
                    styles.moodChip,
                    {
                      borderColor: selected ? accent : colors.border.default,
                      backgroundColor: selected ? `${accent}1A` : colors.surface.secondary,
                    },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: colors.text.secondary, fontWeight: selected ? '700' : '400' },
                    ]}
                  >
                    {EMOTION_COLORS[m.type].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Tags ──────────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>Tags</Text>
          <View style={styles.tagsRow}>
            {tags.map((t) => (
              <Pressable
                key={t}
                onPress={() => removeTag(t)}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${t}`}
                style={[styles.tagChip, { borderColor: colors.border.default }]}
              >
                <Text style={[styles.tagText, { color: colors.text.primary }]}>{t}</Text>
                <Text style={[styles.tagX, { color: colors.text.tertiary }]}>×</Text>
              </Pressable>
            ))}
            <TextInput
              style={[styles.tagInput, { color: colors.text.primary }]}
              placeholder={tags.length ? 'Add another' : 'Add a tag'}
              placeholderTextColor={colors.text.tertiary}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              blurOnSubmit={false}
              accessibilityLabel="Add tag"
            />
          </View>

          {/* ── Voice (Future) ────────────────────────────────────────── */}
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel="Voice input, coming soon"
            style={[styles.futureChip, { borderColor: colors.border.default }]}
          >
            <Text style={[styles.futureText, { color: colors.text.tertiary }]}>
              🎤 Voice (Future)
            </Text>
          </Pressable>

          {/* ── Rules ─────────────────────────────────────────────────── */}
          <View style={styles.rules}>
            {EDITOR_RULES.map((rule) => (
              <Text key={rule} style={[styles.ruleText, { color: colors.text.tertiary }]}>
                • {rule}
              </Text>
            ))}
          </View>

          <Text style={[styles.wordCount, { color: colors.text.tertiary }]}>
            {wordCount} words · saved automatically
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kb: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: typography.fontFamily.display,
    paddingVertical: spacing.xs,
  },
  timestamp: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily.sans,
  },
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: typography.fontFamily.sans,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.sans,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  moodLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.sans,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.sans,
  },
  tagX: {
    fontSize: 15,
    marginLeft: 6,
    fontFamily: typography.fontFamily.sans,
  },
  tagInput: {
    flex: 1,
    minWidth: 120,
    fontSize: 14,
    paddingVertical: 6,
    fontFamily: typography.fontFamily.sans,
  },
  futureChip: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'flex-start',
  },
  futureText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.sans,
  },
  rules: {
    marginTop: spacing.lg,
  },
  ruleText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.fontFamily.sans,
  },
  wordCount: {
    fontSize: 12,
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.sans,
  },
});
