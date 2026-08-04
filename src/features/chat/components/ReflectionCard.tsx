/**
 * ReflectionCard
 *
 * Legacy reflection card used for the 'reflection' message type.
 * Upgraded to match the Phase 2 block anatomy: accent bar,
 * emoji+label chip, body, and action button.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { chat, spacing, borderRadius as radius } from '@/core/theme/tokens';
import { SparkleMark } from '@/components/emotion';

interface ReflectionCardProps {
  title?: string;
  description?: string;
  actionLabel?: string;
}

const ACCENT = chat.blocks.reflection; // lavender reflection accent (#9A78D0)

export const ReflectionCard = React.memo(function ReflectionCard({
  title = "Today's Reflection",
  description,
  actionLabel = 'Save Reflection',
}: ReflectionCardProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(350).springify().damping(18)}
      style={[
        styles.card,
        { backgroundColor: colors.surface.secondary, borderColor: `${ACCENT}30` },
      ]}
    >
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: ACCENT }]} />

      <View style={styles.content}>
        {/* Header chip */}
        <View style={styles.chip}>
          <SparkleMark size={14} />
          <Text style={[styles.chipLabel, { color: ACCENT }]}>Reflection</Text>
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>

        {description ? (
          <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
        ) : null}

        <View style={[styles.divider, { backgroundColor: `${ACCENT}20` }]} />

        <Pressable
          onPress={handlePress}
          style={[styles.actionButton, { backgroundColor: ACCENT }]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingLeft: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.sm,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: chat.typography.blockLabel.fontSize,
    fontWeight: chat.typography.blockLabel.fontWeight,
    letterSpacing: chat.typography.blockLabel.letterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  actionButton: {
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReflectionCard;
