import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/core/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  testID?: string;
}

/** Filled brand button: rounded 14, h-56, optional left icon. */
export function PrimaryButton({ title, onPress, icon, testID }: PrimaryButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.brand.primary },
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: colors.brand.onPrimary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
});

export default PrimaryButton;
