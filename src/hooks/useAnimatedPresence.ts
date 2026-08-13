import { useEffect, useRef, useState } from 'react';

export interface AnimatedPresenceResult {
  /** True while the element should stay in the DOM (opening, open, or closing). */
  present: boolean;
  /** True while the element is animating OUT — apply the `*-exit-active` classes. */
  closing: boolean;
  /** True once the enter transition has been triggered — apply `*-enter-active`. */
  entered: boolean;
}

/**
 * Drives CSS-transition enter/exit for conditionally-mounted UI (sheets,
 * panels, prompts). The rules behind the whole app's animation system:
 *
 * - **Enter** — when `open` flips true, the element mounts in its `*-enter`
 *   start state, then flips to `*-enter-active` on the next animation frame.
 *   The browser paints the start state before the transition begins, so
 *   nothing ever "pops" in (no flicker).
 * - **Exit** — when `open` flips false, the element stays mounted in its
 *   `*-exit-active` end state for `duration` ms, and only then unmounts. Exit
 *   animations always complete before the node is removed.
 *
 * The caller combines the returned flags with the `.gpu-layer`,
 * `.transition-enter` / `.transition-exit`, and `.*-enter/active/exit/active`
 * classes from `index.css` (all transform + opacity, GPU-only).
 */
export function useAnimatedPresence(
  open: boolean,
  duration = 300
): AnimatedPresenceResult {
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      setClosing(false);
      setEntered(false);
      // Paint the start state first, then transition to the end state.
      rafRef.current = requestAnimationFrame(() => setEntered(true));
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setEntered(false);
      setClosing(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setClosing(false), duration);
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, duration]);

  return { present: open || closing, closing, entered };
}
