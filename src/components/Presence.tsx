import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';

interface PresenceProps {
  /** Whether the wrapped content should be visible. */
  show: boolean;
  /** Exit duration in ms — how long the element stays mounted while fading out. */
  duration?: number;
  /** Enter state classes (start). */
  enter?: string;
  /** Enter end-state classes. */
  enterActive?: string;
  /** Exit state classes (start). */
  exit?: string;
  /** Exit end-state classes. */
  exitActive?: string;
  /** Extra classes merged onto the wrapper (e.g. `sparkle-strip`). */
  className?: string;
  /** Ref forwarded to the wrapper element. */
  innerRef?: React.Ref<HTMLDivElement>;
  /** Called once an exit animation has fully completed (element is about to unmount). */
  onExited?: () => void;
  children?: React.ReactNode;
}

/**
 * Minimal enter/exit wrapper for conditionally-rendered panels.
 *
 * While `show` is true the children are rendered normally; the wrapper mounts
 * in the `enter` state and flips to `enterActive` on the next frame (rAF) so
 * the browser paints the start state before transitioning.
 *
 * When `show` flips false the wrapper stays mounted in the `exit + exitActive`
 * state for `duration` ms, keeping the LAST children in the DOM, then calls
 * `onExited` and unmounts — so exit animations always complete and no content
 * disappears abruptly.
 *
 * All animation is transform + opacity via the `.gpu-layer` / transition
 * classes from `index.css`.
 */
export const Presence: React.FC<PresenceProps> = ({
  show,
  duration = 300,
  enter = 'fade-enter',
  enterActive = 'fade-enter-active',
  exit = 'fade-exit',
  exitActive = 'fade-exit-active',
  className,
  innerRef,
  onExited,
  children,
}) => {
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const lastChildrenRef = useRef<React.ReactNode>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevShowRef = useRef(show);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  // Capture the children rendered while visible so they persist during exit.
  useEffect(() => {
    if (show) lastChildrenRef.current = children;
  });

  useEffect(() => {
    if (show) {
      prevShowRef.current = true;
      setClosing(false);
      setEntered(false);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    if (prevShowRef.current) {
      prevShowRef.current = false;
      setEntered(false);
      setClosing(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setClosing(false);
        onExitedRef.current?.();
      }, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, duration]);

  if (!show && !closing) return null;

  const transition = closing ? 'transition-exit' : 'transition-enter';
  const state = closing
    ? `${exit} ${exitActive}`
    : entered
      ? `${enter} ${enterActive}`
      : enter;

  return (
    <div
      ref={innerRef}
      className={cn('gpu-layer', transition, state, className)}
    >
      {show ? children : lastChildrenRef.current}
    </div>
  );
};
