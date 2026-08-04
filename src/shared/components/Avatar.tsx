/**
 * Avatar — User avatar component
 *
 * Displays user photo, initials fallback, or default icon.
 * Sizes: sm | md | lg | xl
 */

import React from 'react';
import { View, Text, Image } from 'react-native';
import { User } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTheme } from '@/hooks/useTheme';

const avatarVariants = cva('items-center justify-center rounded-full', {
  variants: {
    size: {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const textVariants = cva('font-semibold text-white', {
  variants: {
    size: {
      sm: 'text-label',
      md: 'text-body-sm',
      lg: 'text-body',
      xl: 'text-section-title',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 36,
};

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  photoURL?: string | null;
  name?: string | null;
  className?: string;
}

export function Avatar({ photoURL, name, size, className = '' }: AvatarProps) {
  const { colors } = useTheme();
  const initials = React.useMemo(() => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const iconSize = iconSizes[size || 'md'];

  if (photoURL) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        className={`${avatarVariants({ size })} overflow-hidden ${className}`}
      >
        <Image
          source={{ uri: photoURL }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </Animated.View>
    );
  }

  if (name) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        className={`${avatarVariants({ size })} ${className}`}
        style={{ backgroundColor: colors.text.disabled }}
      >
        <Text className={`${textVariants({ size })}`}>{initials}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={`${avatarVariants({ size })} bg-jouspace-glass-highlight ${className}`}
    >
      <User size={iconSize} color={colors.text.muted} />
    </Animated.View>
  );
}

export default Avatar;
