import { useRef, useEffect } from 'react';
import { useSharedValue, withSpring, withTiming, useReducedMotion } from 'react-native-reanimated';

interface UsePanelAnimationOptions {
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    overshootClamping: boolean;
  };
  timingConfig?: {
    duration: number;
  };
}

/**
 * Custom hook to manage panel visibility animation with debouncing
 * to prevent shadow bleeding during rapid state changes.
 */
export function usePanelAnimation(
  isVisible: boolean,
  options: UsePanelAnimationOptions = {}
) {
  const {
    springConfig = { damping: 28, stiffness: 220, mass: 0.9, overshootClamping: true },
    timingConfig = { duration: 220 },
  } = options;

  const progress = useSharedValue(isVisible ? 1 : 0);
  const prevVisibleRef = useRef(isVisible);
  const reduced = useReducedMotion();

  useEffect(() => {
    const prevVisible = prevVisibleRef.current;
    prevVisibleRef.current = isVisible;

    // Only animate if the visibility state actually changed
    if (prevVisible !== isVisible) {
      if (isVisible) {
        // Smooth spring animation for appearance
        progress.value = reduced
          ? withTiming(1, timingConfig)
          : withSpring(1, springConfig);
      } else {
        // Fast timing for hiding to prevent shadow smudge artifacts
        progress.value = withTiming(0, { duration: 150 });
      }
    }
  }, [isVisible, progress, reduced, springConfig, timingConfig]);

  return progress;
}
