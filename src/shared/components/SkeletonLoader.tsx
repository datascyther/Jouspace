/**
 * SkeletonLoader — Loading placeholder with shimmer animation
 *
 * Uses Reanimated for the shimmer sweep effect.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
}: SkeletonLoaderProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.ease }),
        withTiming(0, { duration: 1500, easing: Easing.ease }),
      ),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: width as any,
          height,
          borderRadius,
        },
      ]}
      className={`bg-jouspace-glass-highlight ${className}`}
    />
  );
}

// Convenience: SkeletonCard with consistent layout
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View className="bg-jouspace-glass-dark/20 rounded-glass-lg p-5 border border-jouspace-glass-border">
      <SkeletonLoader width="60%" height={22} borderRadius={6} className="mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? '40%' : '100%'}
          height={14}
          borderRadius={4}
          className="mb-2"
        />
      ))}
    </View>
  );
}

export default SkeletonLoader;
