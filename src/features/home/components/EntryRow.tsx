import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/core/theme';
import { ThemeChip } from './ThemeChip';

export interface EntryRowProps {
  dateLabel: string;
  title: string;
  tag?: string;
  onPress?: () => void;
  testID?: string;
}

export function EntryRow({
  dateLabel,
  title,
  tag,
  onPress,
  testID,
}: EntryRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      testID={testID}
    >
      <Text style={[styles.date, { color: colors.text.tertiary }]}>
        {dateLabel}
      </Text>
      <Text
        style={[styles.title, { color: colors.text.primary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {tag ? <ThemeChip label={tag} /> : null}
      <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 62,
    minHeight: 44,
  },
  date: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: typography.fontFamily.sans,
    width: 70,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: typography.fontFamily.sans,
  },
});

export default EntryRow;
