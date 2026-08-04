import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography, spacing } from '@/core/theme';
import { PrimaryCard } from './PrimaryCard';
import { MemoryLabel } from './MemoryLabel';
import { TextAction } from './TextAction';
import type { AIInsight } from '@/features/home/hooks/useHomeData';

export interface AIInsightCardProps {
  insight: AIInsight;
  isLoading?: boolean;
  onReflect: () => void;
  testID?: string;
}

export function AIInsightCard({
  insight,
  isLoading = false,
  onReflect,
  testID,
}: AIInsightCardProps) {
  const { colors } = useTheme();

  const actionLabel = insight.actionLabel.includes('→')
    ? insight.actionLabel
    : `${insight.actionLabel} →`;

  return (
    <PrimaryCard style={styles.card} testID={testID}>
      <MemoryLabel label={insight.label} />

      <Text
        style={[
          styles.insight,
          { color: isLoading ? colors.text.muted : colors.text.primary },
        ]}
      >
        {insight.insight}
      </Text>

      {!isLoading && (
        <TextAction label={actionLabel} onPress={onReflect} />
      )}
    </PrimaryCard>
  );
}

const styles = StyleSheet.create({
  card: {
    // mainCardToAICard
    marginTop: spacing.xxl,
    minHeight: 180,
  },
  insight: {
    fontSize: typography.fontSize['body-lg'],
    fontWeight: '400',
    fontFamily: typography.fontFamily.sans,
    lineHeight: 28,
    flexGrow: 1,
  },
});

export default AIInsightCard;
