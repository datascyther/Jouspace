import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/core/theme';

interface ThemeChipProps {
  label: string;
  testID?: string;
}

/** Soft lavender pill with brand-primary text. */
export function ThemeChip({ label, testID }: ThemeChipProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.chip, { backgroundColor: colors.brand.tint }]}
      testID={testID}
    >
      <Text style={[styles.text, { color: colors.brand.primary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 2,
  },
  text: {
    fontSize: typography.fontSize.caption,
    fontWeight: '500',
    fontFamily: typography.fontFamily.sans,
  },
});

export default ThemeChip;
