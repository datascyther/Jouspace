import { useLayoutEffect, useRef } from 'react';

/**
 * useBackgroundScrollLock — freezes the background scroll containers while an
 * overlay (notifications, search, etc.) is open, and restores them exactly
 * where they were on close.
 *
 * The locked scrollers are discovered as descendants of `containerRef` whose
 * computed `overflow-y` resolves to `auto`/`scroll` (the per-screen scroll
 * areas). Setting `overflow: hidden` preserves each `scrollTop` in modern
 * WebViews while stopping touch scroll, so the only thing that moves during
 * open/close is the foreground sheet.
 *
 * Foreground overlays live outside `containerRef` (they are siblings under the
 * `overlays` host), so their own scroll — e.g. the notification list — is
 * deliberately unaffected by this lock.
 */
export function useBackgroundScrollLock(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
): void {
  const savedRef = useRef<
    Array<{ el: HTMLElement; overflow: string; scrollTop: number }>
  >([]);

  useLayoutEffect(() => {
    if (!active) return;
    const root = containerRef.current;
    if (!root) return;

    const locked: Array<{ el: HTMLElement; overflow: string; scrollTop: number }> = [];
    const candidates = root.querySelectorAll<HTMLElement>('*');
    candidates.forEach((el) => {
      const style = getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        locked.push({
          el,
          overflow: style.overflowY,
          scrollTop: el.scrollTop,
        });
        el.style.overflow = 'hidden';
      }
    });
    savedRef.current = locked;

    return () => {
      for (const item of savedRef.current) {
        item.el.style.overflow = item.overflow;
        item.el.scrollTop = item.scrollTop;
      }
      savedRef.current = [];
    };
  }, [active, containerRef]);
}
