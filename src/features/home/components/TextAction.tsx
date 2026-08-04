import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/core/theme';

interface TextActionProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

/** Right-aligned purple text action (no background). */
export function TextAction({ label, onPress, testID }: TextActionProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.text, { color: colors.brand.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    marginTop: 20,
  },
  text: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    fontFamily: typography.fontFamily.sans,
  },
});

export default TextAction;
