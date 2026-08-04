import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { useNavigationContext } from './NavigationContext';

const springConfig: WithSpringConfig = {
  stiffness: 300,
  damping: 25,
  mass: 1,
};

interface ActiveIndicatorProps {
  activeIndex: number;
  totalTabs: number;
  containerWidth: number;
}

export function ActiveIndicator({
  activeIndex,
  totalTabs,
  containerWidth,
}: ActiveIndicatorProps) {
  const { colors } = useNavigationContext();

  const tabWidth = totalTabs > 0 ? containerWidth / totalTabs : 0;
  const indicatorWidth = 20;
  const glowWidth = 32;
  const offset = tabWidth / 2 - indicatorWidth / 2;

  const translateX = useSharedValue(0);
  const glowTranslateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      const targetX = activeIndex * tabWidth + offset;
      translateX.value = withSpring(targetX, springConfig);
      glowTranslateX.value = withSpring(
        targetX - (glowWidth - indicatorWidth) / 2,
        springConfig
      );
    }
  }, [activeIndex, tabWidth, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glowTranslateX.value }],
  }));

  if (containerWidth === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            backgroundColor: colors.brand.primary,
            width: glowWidth,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.indicator,
          indicatorStyle,
          {
            backgroundColor: colors.brand.primary,
            width: indicatorWidth,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    bottom: 6,
    height: 4,
    borderRadius: 2,
    zIndex: 5,
  },
  glow: {
    position: 'absolute',
    bottom: 2,
    height: 12,
    borderRadius: 6,
    opacity: 0.25,
    zIndex: 4,
  },
});

export default ActiveIndicator;
