import React from 'react';
import type { ViewStyle } from 'react-native';
import { EmotionAvatar } from './EmotionAvatar';
import type { EmotionType } from '@/constants/emotions';

export interface EmotionBadgeProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  showGlow?: boolean;
  style?: ViewStyle;
}

export function EmotionBadge({
  emotion,
  size = 20,
  animated = false,
  showGlow = false,
  style,
}: EmotionBadgeProps) {
  return (
    <EmotionAvatar
      emotion={emotion}
      size={size}
      animated={animated}
      showGlow={showGlow}
      showLabel={false}
    />
  );
}

export default EmotionBadge;
