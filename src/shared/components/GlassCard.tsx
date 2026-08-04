/**
 * GlassCard — Frosted glass container component
 *
 * The signature Jouspace visual element.
 * Supports pressable and non-pressable variants.
 */

import React from 'react';
import { View, Pressable, StyleSheet, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { shadows } from '@/core/theme';
import { useTheme } from '@/hooks/useTheme';

import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  intensity?: 'light' | 'medium' | 'dark';
  className?: string;
  themeColor?: string; // Dynamic border highlight and glow tint
}

const intensityStyles = {
  light: 'bg-white/80 dark:bg-surface-primary/40',
  medium: 'bg-white/90 dark:bg-surface-primary/60',
  dark: 'bg-surface-primary dark:bg-surface-secondary/80',
} as const;

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  onPress,
  intensity = 'dark',
  className = '',
  themeColor,
  style,
  onLayout,
  ...viewProps
}: GlassCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  const handleLayout = React.useCallback(
    (event: any) => {
      const { width, height } = event.nativeEvent.layout;
      setDimensions({ width, height });
      if (onLayout) {
        onLayout(event);
      }
    },
    [onLayout]
  );

  // Pressable variant uses onPress directly with no scale/spring jiggle.
  const animatedStyle = useAnimatedStyle(() => ({}));

  // Extract border radius from className to match SVG path exactly
  let rx = 24;
  if (className.includes('rounded-glass-sm')) {
    rx = 12;
  } else if (className.includes('rounded-glass-lg')) {
    rx = 24;
  } else if (className.includes('rounded-glass')) {
    rx = 16;
  }

  const baseStyles = `rounded-glass-lg p-5 ${intensityStyles[intensity]} ${className}`;

  const combinedStyle = [
    styles.shadow,
    themeColor ? { shadowColor: themeColor, shadowOpacity: 0.2, shadowRadius: 16 } : null,
    animatedStyle,
    style as any,
  ];

  const defaultBorderColorStart = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const defaultBorderColorEnd = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';

  const svgBorder = dimensions.width > 0 && dimensions.height > 0 ? (
    <View style={[StyleSheet.absoluteFill, { borderRadius: rx, overflow: 'hidden' }]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`glassBorderGrad-${rx}-${themeColor || 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop
              offset="0%"
              stopColor={themeColor ? themeColor : defaultBorderColorStart}
              stopOpacity={themeColor ? 0.32 : 1.0}
            />
            <Stop
              offset="25%"
              stopColor={themeColor ? themeColor : defaultBorderColorStart}
              stopOpacity={themeColor ? 0.22 : 0.5}
            />
            <Stop offset="60%" stopColor={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'} />
            <Stop offset="100%" stopColor={themeColor ? themeColor : defaultBorderColorEnd} stopOpacity={themeColor ? 0.05 : 1.0} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0.5}
          y={0.5}
          width={dimensions.width - 1}
          height={dimensions.height - 1}
          rx={rx - 0.5}
          ry={rx - 0.5}
          fill="none"
          stroke={`url(#glassBorderGrad-${rx}-${themeColor || 'default'})`}
          strokeWidth={1}
        />
      </Svg>
    </View>
  ) : (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: rx,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
      pointerEvents="none"
    />
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onLayout={handleLayout}
        className={baseStyles}
        style={combinedStyle}
        {...(viewProps as any)}
      >
        {svgBorder}
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedView
      onLayout={handleLayout}
      className={baseStyles}
      style={combinedStyle}
      {...viewProps}
    >
      {svgBorder}
      {children}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...shadows.glass,
  },
});

export default GlassCard;
