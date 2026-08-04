import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/core/theme';

interface PrimaryCardProps {
  children: React.ReactNode;
  style?: object;
  testID?: string;
}

/** Surface card: warm-white bg, default border, 24 radius, 24 padding. */
export function PrimaryCard({ children, style, testID }: PrimaryCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.warm,
          borderColor: colors.border.default,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
  },
});

export default PrimaryCard;
