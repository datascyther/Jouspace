import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

/**
 * Cross-platform keyboard height tracking.
 *
 * - Native (iOS/Android): React Native's `Keyboard` events.
 * - Web: RN Web's `Keyboard` events are unreliable for on-screen keyboards, so we
 *   also observe the Visual Viewport API AND the layout viewport (`window.innerHeight`).
 *
 *   Mobile browsers vary: Chrome shrinks `visualViewport.height` (and `window.innerHeight`);
 *   modern iOS shrinks `window.innerHeight`; classic iOS Safari overlays the keyboard
 *   (the browser auto-scrolls to the focused input, so the bar is already visible there).
 *   We track a baseline layout-viewport height and treat any shrink as keyboard height,
 *   which covers Chrome and modern iOS reliably.
 *
 * Returns the current keyboard height in pixels (0 when hidden).
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  const baselineRef = useRef(0);

  useEffect(() => {
    const show = (e: KeyboardEvent) => {
      const h = e.endCoordinates?.height;
      if (typeof h === 'number' && h > 0) setHeight(h);
    };
    const hide = () => setHeight(0);

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subscriptions = [
      Keyboard.addListener(showEvent, show),
      Keyboard.addListener(hideEvent, hide),
    ];

    let cleanupViewport: (() => void) | undefined;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const computeFromViewport = () => {
        const vv = window.visualViewport;
        if (vv) {
          const keyboard = window.innerHeight - vv.height - vv.offsetTop;
          if (keyboard > 0) {
            setHeight(Math.round(keyboard));
            return;
          }
        }
        // Fallback: layout viewport (window.innerHeight) shrinking vs. the largest
        // height we've seen while the keyboard was closed.
        const current = window.innerHeight;
        if (baselineRef.current === 0 || current > baselineRef.current) {
          baselineRef.current = current;
        }
        const keyboard = baselineRef.current - current;
        setHeight(Math.max(0, Math.round(keyboard)));
      };

      window.addEventListener('resize', computeFromViewport);
      window.visualViewport?.addEventListener('resize', computeFromViewport);
      window.visualViewport?.addEventListener('scroll', computeFromViewport);
      computeFromViewport();
      cleanupViewport = () => {
        window.removeEventListener('resize', computeFromViewport);
        window.visualViewport?.removeEventListener('resize', computeFromViewport);
        window.visualViewport?.removeEventListener('scroll', computeFromViewport);
      };
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove());
      cleanupViewport?.();
    };
  }, []);

  return height;
}

/**
 * Animated variant of {@link useKeyboardHeight}.
 *
 * Returns a `SharedValue<number>` that eases to the live keyboard height
 * instead of a React state value. This lets consumers apply the offset via
 * `useAnimatedStyle` so the bar *glides* with the IME rather than snapping.
 *
 * Why a SharedValue + withTiming:
 * - The OS `adjustResize` (Android) resizes the window instantly per-frame, but
 *   any additional JS-driven clearance we apply must be eased in sync so it
 *   doesn't "stick" at a fixed point or jump.
 * - Gboard fires `keyboardDidChangeFrame` / `keyboardWillChangeFrame` as its
 *   height changes *mid-open* (suggestion strip, sticker panel, one-handed
 *   mode). We subscribe to those events and re-ease the SharedValue to the new
 *   height so the bar tracks Gboard continuously.
 * - We sync the `withTiming` to the event's own `duration`/`easing` when
 *   available (iOS provides `keyboardWillShow` with a real duration; Gboard's
 *   change-frame events carry their own), so our glide matches the IME's own
 *   animation rather than a hardcoded delay.
 *
 * `withTiming` (not `withSpring`) is used intentionally to mirror the linear,
 * duration-bound slide of the system keyboard; a spring would overshoot the
 * crisp OS motion.
 */
export function useKeyboardHeightShared(): {
  keyboardHeightSV: ReturnType<typeof useSharedValue<number>>;
} {
  const keyboardHeightSV = useSharedValue(0);
  const baselineRef = useRef(0);

  useEffect(() => {
    const animateTo = (h: number, duration?: number) => {
      keyboardHeightSV.value = withTiming(h, {
        duration: duration && duration > 0 ? duration : 250,
        easing: Easing.out(Easing.ease),
      });
    };

    const applyFromEvent = (e?: KeyboardEvent) => {
      const h = e?.endCoordinates?.height;
      if (typeof h === 'number' && h >= 0) {
        animateTo(h, e?.duration);
      }
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subscriptions = [
      Keyboard.addListener(showEvent, applyFromEvent),
      Keyboard.addListener(hideEvent, () => animateTo(0)),
    ];

    // Gboard (and other IMEs that resize mid-animation) emit change-frame events
    // as their height shifts while already open. Track these so our animated
    // clearance stays glued to the IME instead of freezing at the initial height.
    if (Platform.OS === 'android') {
      subscriptions.push(
        Keyboard.addListener('keyboardDidChangeFrame', applyFromEvent),
        Keyboard.addListener('keyboardWillChangeFrame', applyFromEvent)
      );
    }

    let cleanupViewport: (() => void) | undefined;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const computeFromViewport = () => {
        const vv = window.visualViewport;
        if (vv) {
          const keyboard = window.innerHeight - vv.height - vv.offsetTop;
          if (keyboard > 0) {
            animateTo(Math.round(keyboard));
            return;
          }
        }
        const current = window.innerHeight;
        if (baselineRef.current === 0 || current > baselineRef.current) {
          baselineRef.current = current;
        }
        const keyboard = baselineRef.current - current;
        animateTo(Math.max(0, Math.round(keyboard)));
      };

      window.addEventListener('resize', computeFromViewport);
      window.visualViewport?.addEventListener('resize', computeFromViewport);
      window.visualViewport?.addEventListener('scroll', computeFromViewport);
      computeFromViewport();
      cleanupViewport = () => {
        window.removeEventListener('resize', computeFromViewport);
        window.visualViewport?.removeEventListener('resize', computeFromViewport);
        window.visualViewport?.removeEventListener('scroll', computeFromViewport);
      };
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove());
      cleanupViewport?.();
    };
  }, [keyboardHeightSV]);

  return { keyboardHeightSV };
}
