import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/core/theme';

interface MemoryLabelProps {
  label: string;
  testID?: string;
}

/** Purple Sparkles eyebrow used by both home cards ("Memory-guided", "Jouspace noticed"). */
export function MemoryLabel({ label, testID }: MemoryLabelProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row} testID={testID}>
      <Sparkles size={14} color={colors.brand.primary} />
      <Text style={[styles.label, { color: colors.brand.primary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
    letterSpacing: 0.3,
  },
});

export default MemoryLabel;
