import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useNavigationContext } from './NavigationContext';
import { LAYOUT } from '@/shared/constants';

const PILL_RADIUS = LAYOUT.TAB_BAR_HEIGHT / 2;

interface NavigationContainerProps {
  children: React.ReactNode;
}

export function NavigationContainer({
  children,
}: NavigationContainerProps) {
  const { theme, colors } = useNavigationContext();
  const insets = useSafeAreaInsets();

  // Light mode needs a firmer edge (it can wash out over bright pages);
  // dark mode wants a brighter rim so the glass catches the light.
  const containerBorderColor =
    theme === 'dark'
      ? 'rgba(255, 255, 255, 0.14)'
      : '#E7E1EF';

  const shadowColor = colors.brand.primaryDeep;
  const shadowOpacity = theme === 'dark' ? 0.24 : 0.16;
  const bottomPosition = Math.max(LAYOUT.TAB_BAR_MARGIN, insets.bottom);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: containerBorderColor,
          shadowColor: shadowColor,
          shadowOpacity: shadowOpacity,
          bottom: bottomPosition,
          ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(60px) saturate(130%)',
            WebkitBackdropFilter: 'blur(60px) saturate(130%)',
          }),
        },
      ]}
    >
      <BlurView
        intensity={theme === 'dark' ? 100 : 100}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Frosted surface — opaque enough to dissolve background text into soft
          color while the BlurView underneath supplies the frost. The blur does
          the heavy lifting; this layer seals it so nothing sharp shows through.
          Sits over the BlurView so it stays consistent on web (where
          BlurView has no effect and the web backdrop-filter carries the blur). */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              theme === 'dark'
                ? 'rgba(18, 18, 27, 0.74)'
                : 'rgba(255, 255, 255, 0.8)',
          },
        ]}
        pointerEvents="none"
      />

      {/* Soft top edge light — the catch that sells frosted glass. */}
      <View
        style={[
          styles.glassHighlight,
          {
            backgroundColor:
              theme === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.7)',
          },
        ]}
        pointerEvents="none"
      />

      <View style={styles.contentRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: LAYOUT.TAB_BAR_MARGIN,
    right: LAYOUT.TAB_BAR_MARGIN,
    // Tall enough for the 64px center write button + vertical padding
    height: Math.max(LAYOUT.TAB_BAR_HEIGHT, 78),
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    elevation: 14,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    zIndex: 100,
    justifyContent: 'center',
    paddingHorizontal: 6,
    // Keep glass clipped to the pill; 78px height fits the 64px write FAB
    overflow: 'hidden',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: 1,
    zIndex: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    zIndex: 3,
  },
});

export default NavigationContainer;
