/**
 * TextField — Text input with label, error, and optional icon
 *
 * Variants: outlined | filled
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface TextFieldProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  value,
  onFocus,
  onBlur,
  containerClassName = '',
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { theme, colors } = useTheme();

  const borderColor = error
    ? 'border-danger'
    : isFocused
    ? 'border-brand-primary'
    : 'border-border-default';

  // withTiming must animate numbers, not color strings — drive a numeric progress
  // and interpolateColor so the label color animates to a valid color.
  const labelColorProgress = useSharedValue(0);
  useEffect(() => {
    const target = error ? 2 : isFocused ? 1 : 0;
    labelColorProgress.value = withTiming(target, { duration: 200 });
  }, [error, isFocused]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      labelColorProgress.value,
      [0, 1, 2],
      [colors.text.secondary, colors.brand.primary, colors.danger]
    ),
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const placeholderColor = colors.text.muted;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Animated.Text
          style={labelAnimatedStyle}
          className="text-body-sm font-semibold mb-2"
        >
          {label}
        </Animated.Text>
      )}

      <View
        className={`flex-row items-center rounded-xl border ${borderColor} px-4 py-3.5 bg-surface-primary`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={placeholderColor}
          className="flex-1 text-body text-text-primary font-medium"
          {...inputProps}
        />

        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>

      {error && (
        <Text className="text-danger text-caption mt-1.5 font-medium">{error}</Text>
      )}

      {hint && !error && (
        <Text className="text-text-secondary text-caption mt-1.5">
          {hint}
        </Text>
      )}
    </View>
  );
}

export default TextField;
