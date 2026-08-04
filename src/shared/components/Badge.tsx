/**
 * Badge — Small label/tag component
 *
 * Variants: default | success | warning | error | info
 */

import React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'px-2.5 py-1 rounded-full self-start',
  {
    variants: {
      variant: {
        default: 'bg-brand-subtle',
        success: 'bg-successSubtle',
        warning: 'bg-warningSubtle',
        error: 'bg-dangerSubtle',
        info: 'bg-infoSubtle',
        purple: 'bg-brand-subtle',
        cyan: 'bg-infoSubtle',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const textVariants = cva('text-caption font-medium', {
  variants: {
    variant: {
      default: 'text-text-secondary',
      success: 'text-successText',
      warning: 'text-warningText',
      error: 'text-dangerText',
      info: 'text-infoText',
      purple: 'text-brand-primaryDeep',
      cyan: 'text-infoText',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
}

export function Badge({ label, variant, className = '' }: BadgeProps) {
  return (
    <View className={`${badgeVariants({ variant })} ${className}`}>
      <Text className={textVariants({ variant })}>{label}</Text>
    </View>
  );
}

export default Badge;
