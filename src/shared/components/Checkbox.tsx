import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  error?: string;
}

export function Checkbox({ checked, onPress, label, error }: CheckboxProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start py-1.5 active:opacity-80"
    >
      <View
        className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
          checked
            ? 'bg-brand-primary border-brand-primary'
            : 'bg-surface-primary border-border-default'
        }`}
      >
        {checked && <Check size={12} color={colors.brand.onPrimary} strokeWidth={3} />}
      </View>
      <View className="flex-1">
        {label && (
          <Text className="text-body-sm leading-5 text-text-secondary font-medium">
            {label}
          </Text>
        )}
        {error && (
          <Text className="text-danger text-caption mt-1 font-medium">
            {error}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default Checkbox;
