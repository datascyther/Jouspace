/**
 * Button — Primary call-to-action component
 *
 * Variants: primary | secondary | ghost | destructive
 * Sizes: sm | md | lg
 */

import React from 'react';
import { Pressable, Text, ActivityIndicator, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'className'> {
  title: string;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  size = 'md',
  className = '',
  ...pressableProps
}: ButtonProps) {
  const { colors } = useTheme();

  // Dynamic style resolution for accessibility & contrast
  const isButtonDisabled = disabled || loading;

  let containerStyles = 'flex-row items-center justify-center rounded-xl font-semibold transition-all duration-200 ';
  let textStyles = 'font-semibold ';

  if (variant === 'primary') {
    containerStyles += isButtonDisabled
      ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
      : 'bg-brand-primary active:opacity-90';
    textStyles += isButtonDisabled
      ? 'text-slate-600 dark:text-slate-300'
      : 'text-brand-contrastText';
  } else if (variant === 'secondary') {
    containerStyles += isButtonDisabled
      ? 'bg-transparent border border-slate-200 dark:border-slate-800'
      : 'bg-surface-secondary border border-border-default active:bg-surface-primary';
    textStyles += isButtonDisabled
      ? 'text-slate-500 dark:text-slate-400'
      : 'text-text-primary';
  } else if (variant === 'ghost') {
    containerStyles += 'bg-transparent';
    textStyles += isButtonDisabled
      ? 'text-slate-500 dark:text-slate-400'
      : 'text-brand-primary';
  } else if (variant === 'destructive') {
    containerStyles += isButtonDisabled
      ? 'bg-danger/5 border border-danger/10'
      : 'bg-danger/10 border border-danger/25 active:bg-danger/20';
    textStyles += isButtonDisabled
      ? 'text-danger/40'
      : 'text-danger';
  }

  const sizeStyles = {
    sm: 'px-4 py-2.5 text-body-sm',
    md: 'px-6 py-3.5 text-body',
    lg: 'px-8 py-4 text-body-lg',
  }[size];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      // Subtle scale response when pressing
      transform: [{ scale: 1 }],
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isButtonDisabled}
      className={`${containerStyles} ${sizeStyles} ${className}`}
      style={animatedStyle}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.brand.contrastText : colors.brand.primary}
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={textStyles}>
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

export default Button;
