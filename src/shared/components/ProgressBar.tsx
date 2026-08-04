import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

export interface ProgressBarProps {
  percent: number; // 0-100
  height?: number;
  color?: string;
  trackColor?: string;
  variant?: 'default' | 'solid' | 'gradient';
  style?: ViewStyle;
  className?: string;
}

export const ProgressBar = React.memo(({
  percent,
  height = 6,
  color,
  trackColor,
  variant = 'default',
  style,
  className = '',
}: ProgressBarProps) => {
  const { colors } = useTheme();
  const barColor = color ?? colors.brand.primary;
  const barTrack = trackColor ?? colors.border.subtle;
  const gradientEnd = colors.brand.secondary;
  const animatedPercent = useSharedValue(0);

  useEffect(() => {
    animatedPercent.value = withSpring(percent, { damping: 18, stiffness: 80 });
  }, [percent, animatedPercent]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.max(0, Math.min(100, animatedPercent.value))}%`,
    };
  });

  const radius = height / 2;

  if (variant === 'gradient') {
    return (
      <View style={[styles.container, style]} className={className}>
        <View style={[styles.track, { height, borderRadius: radius, backgroundColor: barTrack }]}>
          <Animated.View style={[styles.progressBar, progressStyle]}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="sharedProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={barColor} />
                  <Stop offset="100%" stopColor={gradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#sharedProgressGrad)" rx={radius} />
            </Svg>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} className={className}>
        <View style={[styles.track, { height, borderRadius: radius, backgroundColor: barTrack }]}>
          <Animated.View
            style={[
              styles.progressBar,
              progressStyle,
              { backgroundColor: barColor, borderRadius: radius },
            ]}
          />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});

export default ProgressBar;
