import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * Best-effort classification of the active software keyboard. Web cannot
 * reliably distinguish an emoji vs. a text keyboard, so this is a hint only.
 */
export type InputMode = 'default' | 'emoji' | 'numeric' | 'floating';

export interface KeyboardState {
  /** Effective keyboard height in CSS px (0 when hidden). */
  keyboardHeight: number;
  /** True when a software keyboard is believed to be on screen. */
  keyboardVisible: boolean;
  /** Best-effort keyboard type hint. */
  inputMode: InputMode;
  /** Bottom safe-area inset in px (env(safe-area-inset-bottom)). */
  safeAreaBottom: number;
  /** Current visual viewport height in px — drives the app shell height. */
  visualViewportHeight: number;
}

interface KeyboardContextValue {
  state: KeyboardState;
  /** Report the active input mode so consumers can react to keyboard type. */
  setInputMode: (mode: InputMode) => void;
}

const DEFAULT_STATE: KeyboardState = {
  keyboardHeight: 0,
  keyboardVisible: false,
  inputMode: 'default',
  safeAreaBottom: 0,
  visualViewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
};

const KeyboardContext = createContext<KeyboardContextValue>({
  state: DEFAULT_STATE,
  setInputMode: () => {},
});

/**
 * Web/Capacitor adaptation of a "useAdaptiveKeyboard" hook.
 *
 * React Native exposes Keyboard.addListener / Animated; on the web we listen to
 * `window.visualViewport`, which fires resize/scroll events as the on-screen
 * keyboard appears and animates — the web equivalent of keyboardWillShow /
 * keyboardDidShow. We translate the measured height into:
 *   - a React state (keyboardHeight, keyboardVisible, ...) for JS consumers
 *   - CSS variables (--vvh, --kb-height, --kb-open) for pure-CSS consumers
 * so the app shell can track the shrinking visible area at 60fps via transforms.
 */
export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<KeyboardState>(DEFAULT_STATE);
  const inputModeRef = useRef<InputMode>('default');

  // Full (keyboard-free) layout viewport height in CSS px. On iOS Safari and
  // Capacitor's adjustResize Android WebView, `window.innerHeight` itself
  // shrinks when the software keyboard opens, so `innerHeight - vvH` collapses
  // to ~0 and the keyboard would otherwise go undetected. Track the largest
  // visual-viewport height observed as the baseline instead — a keyboard only
  // ever shrinks it — and re-baseline on orientation change.
  const fullHeightRef = useRef<number>(
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0
  );

  useEffect(() => {
    const root = document.documentElement;
    const vv =
      typeof window !== 'undefined' ? window.visualViewport : undefined;

    // Measure the bottom safe-area inset once (it doesn't change at runtime).
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.left = '0';
    probe.style.bottom = '0';
    probe.style.height = '0';
    probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    let safeAreaBottom = 0;
    try {
      safeAreaBottom = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    } catch {
      safeAreaBottom = 0;
    }
    probe.remove();

    const compute = () => {
      const winH = window.innerHeight;
      const vvH = vv ? vv.height : winH;
      const offsetTop = vv ? vv.offsetTop : 0;
      // Space below the visible viewport == on-screen keyboard height.
      const kb = Math.max(0, winH - vvH - offsetTop);
      // Re-baseline to the tallest visual viewport seen so far (see the
      // fullHeightRef note above) — keyboard-open states only ever shrink it.
      if (vvH > fullHeightRef.current) fullHeightRef.current = vvH;
      // Visible when the keyboard clearly occupies space below the visible
      // viewport (kb), OR the visible viewport shrank against the keyboard-free
      // baseline (platforms that resize innerHeight with the keyboard). The 50px
      // floor ignores sub-50px fluctuations / collapsing toolbars.
      const visible = kb > 50 || vvH < fullHeightRef.current - 50;

      root.style.setProperty('--vvh', `${vvH}px`);
      root.style.setProperty('--kb-height', `${kb}px`);
      root.style.setProperty('--kb-open', visible ? '1' : '0');

      setState((prev) => {
        if (
          prev.keyboardHeight === kb &&
          prev.keyboardVisible === visible &&
          prev.visualViewportHeight === vvH &&
          prev.safeAreaBottom === safeAreaBottom
        ) {
          return prev;
        }
        return {
          ...prev,
          keyboardHeight: kb,
          keyboardVisible: visible,
          visualViewportHeight: vvH,
          safeAreaBottom,
        };
      });
    };
    // Run once on mount to establish the baseline and any initial offsets.
    compute();
    // visualViewport resize/scroll fire as the on-screen keyboard animates in
    // and out — the web equivalent of keyboardWillShow / keyboardDidShow.
    if (vv) {
      vv.addEventListener('resize', compute);
      vv.addEventListener('scroll', compute);
    }
    window.addEventListener('resize', compute);
    // Rotating changes the full viewport height, so re-establish the baseline
    // (the keyboard is dismissed before rotation) before recomputing. Without
    // this, an old, taller baseline would read as "keyboard open" forever.
    const onOrientationChange = () => {
      fullHeightRef.current = vv ? vv.height : window.innerHeight;
      compute();
    };
    window.addEventListener('orientationchange', onOrientationChange);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', compute);
        vv.removeEventListener('scroll', compute);
      }
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, []);

  const setInputMode = (mode: InputMode) => {
    if (inputModeRef.current === mode) return;
    inputModeRef.current = mode;
    setState((prev) => ({ ...prev, inputMode: mode }));
  };

  return (
    <KeyboardContext.Provider value={{ state, setInputMode }}>
      {children}
    </KeyboardContext.Provider>
  );
};

/**
 * Consume the adaptive-keyboard state. Spreads the state fields for ergonomics
 * so callers can do `const { keyboardVisible, keyboardHeight } = useKeyboard()`.
 */
export const useKeyboard = (): KeyboardState & {
  setInputMode: (m: InputMode) => void;
} => {
  const ctx = useContext(KeyboardContext);
  return { ...ctx.state, setInputMode: ctx.setInputMode };
};
