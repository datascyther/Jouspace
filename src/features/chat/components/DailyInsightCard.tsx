/**
 * DailyInsightCard
 *
 * Legacy insight card used for the 'insight' message type.
 * Upgraded to match the Phase 2 block anatomy: accent bar,
 * emoji+label chip, highlighted callout box, and footer text.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { chat, spacing, borderRadius as radius } from '@/core/theme/tokens';
import { SparkleMark } from '@/components/emotion';

interface DailyInsightCardProps {
  title?: string;
  content?: string;
}

function parseInsightContent(content: string) {
  const lines = content.split('\n').filter(Boolean);
  const title = lines[0] || undefined;
  const insight = lines.slice(1).join('\n').trim() || undefined;
  return { title, insight };
}

const ACCENT = chat.blocks.insight; // lavender insight accent (#B99BE8)

export const DailyInsightCard = React.memo(function DailyInsightCard({
  title: propTitle,
  content,
}: DailyInsightCardProps) {
  const { colors } = useTheme();
  const parsed = content ? parseInsightContent(content) : { title: undefined, insight: undefined };
  const title = propTitle || parsed.title || 'Daily Insight';
  const insight = parsed.insight || content || undefined;

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
          <Text style={[styles.chipLabel, { color: ACCENT }]}>Insight</Text>
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>

        {insight ? (
          <View
            style={[
              styles.callout,
              {
                backgroundColor: `${ACCENT}12`,
                borderColor: `${ACCENT}40`,
              },
            ]}
          >
            <Text style={[styles.insightText, { color: colors.text.primary }]}>{insight}</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: colors.text.secondary }]}>Reflect on this insight</Text>
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
    marginBottom: spacing.sm,
  },
  callout: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  footer: {
    fontSize: chat.typography.supporting.fontSize,
    lineHeight: chat.typography.supporting.lineHeight,
  },
});

export default DailyInsightCard;
