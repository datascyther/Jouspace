import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import type { EmotionType } from '@/constants/emotions';

export function useEmotionAnimation(
  emotion: EmotionType,
  animated: boolean,
) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      scale.value = 1;
      translateY.value = 0;
      translateX.value = 0;
      rotate.value = 0;
      return;
    }

    const ease = Easing.inOut(Easing.ease);

    switch (emotion) {
      case 'great':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 1400, easing: ease }),
            withTiming(1, { duration: 1400, easing: ease }),
          ),
          -1,
          false,
        );
        break;

      case 'good':
        translateY.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 1500, easing: ease }),
            withTiming(0, { duration: 1500, easing: ease }),
          ),
          -1,
          false,
        );
        break;

      case 'calm':
        break;

      case 'notGood':
        rotate.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 1167, easing: ease }),
            withTiming(-2, { duration: 1167, easing: ease }),
            withTiming(0, { duration: 1166, easing: ease }),
          ),
          -1,
          false,
        );
        break;

      case 'overwhelmed':
        translateX.value = withRepeat(
          withSequence(
            withTiming(1.5, { duration: 100, easing: ease }),
            withTiming(-1.5, { duration: 100, easing: ease }),
            withTiming(1.5, { duration: 100, easing: ease }),
            withDelay(200, withTiming(0, { duration: 100, easing: ease })),
          ),
          -1,
          false,
        );
        break;
    }
  }, [animated, emotion, scale, translateY, translateX, rotate]);

  return useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotateZ: `${rotate.value}deg` },
      ],
    } as any;
  });
}
