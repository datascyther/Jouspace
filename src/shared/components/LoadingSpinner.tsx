/**
 * LoadingSpinner — Animated loading indicator
 *
 * Uses Reanimated for continuous rotation animation.
 */

import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
  className?: string;
}

export function LoadingSpinner({
  size = 32,
  color,
  strokeWidth = 3,
  className = '',
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color ?? colors.brand.primary;
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        withTiming(0, { duration: 1000, easing: Easing.linear }),
      ),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: strokeWidth,
    borderColor: colors.brand.subtle,
    borderTopColor: spinnerColor,
  }));

  return (
    <View className={`items-center justify-center ${className}`}>
      <Animated.View style={animatedStyle} />
    </View>
  );
}

export default LoadingSpinner;
