/**
 * IconButton — Circular icon-only button
 *
 * Variants: primary | secondary | ghost
 * Sizes: sm | md | lg
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const iconButtonVariants = cva(
  'items-center justify-center rounded-full',
  {
    variants: {
      variant: {
        primary: 'bg-jouspace-purple-600',
        secondary: 'bg-jouspace-glass-highlight border border-jouspace-glass-border',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface IconButtonProps extends VariantProps<typeof iconButtonVariants> {
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  onPress,
  disabled = false,
  variant,
  size,
  className = '',
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${iconButtonVariants({ variant, size })} ${className}`}
      style={({ pressed }) => [
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default IconButton;
