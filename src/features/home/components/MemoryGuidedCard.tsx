import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography, spacing } from '@/core/theme';
import { PrimaryCard } from './PrimaryCard';
import { MemoryLabel } from './MemoryLabel';
import { PrimaryButton } from './PrimaryButton';
import { TextAction } from './TextAction';

export interface MemoryGuidedCardProps {
  /** @deprecated Empty-state is no longer used on Home; kept for call-site compat. */
  isNewUser?: boolean;
  topic?: string | null;
  isEmpty?: boolean;
  onContinue: () => void;
  onNewEntry: () => void;
  testID?: string;
}

const DEFAULT_TOPIC = 'discipline, pressure, and starting again';

export function MemoryGuidedCard({
  topic,
  isEmpty = false,
  onContinue,
  onNewEntry,
  testID,
}: MemoryGuidedCardProps) {
  const { colors } = useTheme();

  const bodyTopic = topic?.trim() || DEFAULT_TOPIC;
  const title = isEmpty ? 'Start your journal' : 'Continue your journal';
  const subtitle = isEmpty
    ? 'Begin your first entry.'
    : `You were writing about ${bodyTopic}.`;
  const primaryLabel = isEmpty ? 'Start writing' : 'Continue writing';
  const onPrimary = isEmpty ? onNewEntry : onContinue;

  return (
    <PrimaryCard style={styles.card} testID={testID}>
      <MemoryLabel label="Memory-guided" />

      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        {subtitle}
      </Text>

      <View style={styles.actions}>
        <PrimaryButton
          title={primaryLabel}
          onPress={onPrimary}
          icon={<Pencil size={22} color={colors.brand.onPrimary} />}
        />

        {!isEmpty && (
          <TextAction label="New entry" onPress={onNewEntry} />
        )}
      </View>
    </PrimaryCard>
  );
}

const styles = StyleSheet.create({
  card: {
    // greetingToMainCard
    marginTop: spacing.xxl,
  },
  title: {
    fontSize: 31,
    fontWeight: '500',
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: typography.fontSize['body-lg'],
    fontWeight: '400',
    fontFamily: typography.fontFamily.sans,
    lineHeight: 26,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});

export default MemoryGuidedCard;
