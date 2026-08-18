import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

// ── Gesture constants ──────────────────────────────────────────────────────────
// Native-feel pull-to-refresh: drag resistance, a rubber-band cap, and a spring
// release animation (cubic-bezier) tuned to match platform refresh indicators.
const DECISION_PX = 10; // px of downward travel before the pull takes over
const RESISTANCE = 0.4; // indicator follows the finger at 40% speed
const MAX_PULL = 110; // rubber-band cap — the indicator never flies away
const TRIGGER_PX = 72; // release past this fires onRefresh
const HIDE_Y = -60; // indicator rest position (fully off-screen above)
const HOME_Y = 4; // resting position while the refresh is in flight
const SETTLE_TRANSITION =
  'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
const DEFAULT_ERROR = "Couldn't refresh — check your connection.";

/** rAF wrapper so the drag transform never triggers layout thrash (and works
 *  in environments where rAF is unavailable, e.g. jsdom). */
function raf(cb: () => void): number {
  return typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame(cb)
    : 0;
}

interface PullToRefreshProps {
  /** Refetch the screen's background data. Resolves when the refresh settles;
   *  a rejection is caught here and routed to onError. */
  onRefresh: () => Promise<void> | void;
  /** Force-disable the gesture (e.g. while another refresh is in flight). */
  disabled?: boolean;
  /** Non-intrusive error surface (the app's toast). */
  onError?: (message: string) => void;
  /** Applied to the inner scroll container (padding, etc.). */
  className?: string;
  children: React.ReactNode;
}

/**
 * PullToRefresh — a native-feel swipe-down-to-reload wrapper for the app's
 * scrollable feed screens (Home, Memory).
 *
 * Safety contract:
 *  - The wrapped scroll container is NEVER unmounted or remounted: the refresh
 *    only re-syncs background data in place, so scroll position and any child
 *    input state survive untouched.
 *  - A refresh in flight blocks new pulls (no concurrent fetches).
 *  - A failed/network refresh dismisses the indicator smoothly and surfaces
 *    via onError — the wrapper never throws.
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  disabled = false,
  onError,
  className = '',
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);

  const [refreshing, setRefreshing] = useState(false);

  // Refs mirror the mutable gesture state so the native touch listeners never
  // read a stale closure (they are attached once on mount).
  const propsRef = useRef({ onRefresh, onError, disabled });
  propsRef.current = { onRefresh, onError, disabled };
  const refreshingRef = useRef(false);
  const trackingRef = useRef(false); // a gesture we accepted in touchstart
  const activeRef = useRef(false); // the pull has taken over (preventDefault)
  const decidingRef = useRef(false);
  const startYRef = useRef(0);
  const pullRef = useRef(0);
  const mouseActiveRef = useRef(false);
  const mouseStartYRef = useRef(0);

  const reduceMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const setIndicatorY = useCallback(
    (y: number, animate: boolean) => {
      const el = indicatorRef.current;
      if (!el) return;
      el.style.transition = animate && !reduceMotion ? SETTLE_TRANSITION : 'none';
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    },
    [reduceMotion]
  );

  const applyPull = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = raf(() => {
      // y = HIDE_Y + pull: at rest the indicator hides above the frame edge;
      // it slides into view as the pull grows (HIDE_Y is negative).
      const y = pullRef.current + HIDE_Y;
      setIndicatorY(y, false);
      if (iconRef.current) {
        // Arrow flips as the pull approaches the trigger threshold.
        iconRef.current.style.transform = `rotate(${Math.min(
          180,
          pullRef.current * 2
        )}deg)`;
      }
    });
  }, [setIndicatorY]);

  const settle = useCallback(
    (animate: boolean) => {
      setIndicatorY(HIDE_Y, animate);
    },
    [setIndicatorY]
  );

  const runRefresh = useCallback(() => {
    refreshingRef.current = true;
    setRefreshing(true);
    setIndicatorY(HOME_Y, true);
    Promise.resolve()
      .then(() => propsRef.current.onRefresh())
      .catch((err) => {
        propsRef.current.onError?.(
          err instanceof Error && err.message ? err.message : DEFAULT_ERROR
        );
      })
      .finally(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        settle(true);
      });
  }, [setIndicatorY, settle]);

  // ── Touch gesture ─────────────────────────────────────────────────────────
  // React registers `touchmove` as a PASSIVE listener at the root, which would
  // silently swallow preventDefault. Attach a native non-passive listener so
  // the pull can take over the gesture and stop the WebView scrolling it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || propsRef.current.disabled) return;
      if (el.scrollTop > 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
      decidingRef.current = true;
      activeRef.current = false;
      trackingRef.current = true;
      pullRef.current = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!trackingRef.current) return;
      if (refreshingRef.current || propsRef.current.disabled) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startYRef.current;
      if (el.scrollTop > 0 || dy <= 0) {
        if (activeRef.current) {
          activeRef.current = false;
          settle(false);
        }
        return;
      }
      if (!activeRef.current) {
        // Small hysteresis before hijacking the gesture, so normal upward
        // scrolling and horizontal pans are never disturbed.
        if (dy < DECISION_PX) return;
        activeRef.current = true;
        decidingRef.current = false;
        e.preventDefault();
      }
      pullRef.current = Math.min(MAX_PULL, dy * RESISTANCE);
      applyPull();
    };

    const onEnd = () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      if (!activeRef.current) return;
      activeRef.current = false;
      if (pullRef.current >= TRIGGER_PX) runRefresh();
      else settle(false);
    };

    const onCancel = () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      if (activeRef.current) {
        activeRef.current = false;
        settle(false);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onCancel);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyPull, runRefresh, settle]);

  // ── Mouse fallback (desktop preview only) ──────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (refreshingRef.current || propsRef.current.disabled) return;
    if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
    mouseActiveRef.current = true;
    mouseStartYRef.current = e.clientY;
    decidingRef.current = true;
    activeRef.current = false;
    pullRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseActiveRef.current) return;
    const dy = e.clientY - mouseStartYRef.current;
    if ((scrollRef.current && scrollRef.current.scrollTop > 0) || dy <= 0) {
      if (activeRef.current) {
        activeRef.current = false;
        settle(false);
      }
      return;
    }
    if (!activeRef.current) {
      if (dy < DECISION_PX) return;
      activeRef.current = true;
      decidingRef.current = false;
    }
    pullRef.current = Math.min(MAX_PULL, dy * RESISTANCE);
    applyPull();
  };

  const handlePointerUp = () => {
    if (!mouseActiveRef.current) return;
    mouseActiveRef.current = false;
    if (!activeRef.current) return;
    activeRef.current = false;
    if (pullRef.current >= TRIGGER_PX) runRefresh();
    else settle(false);
  };

  const handlePointerCancel = () => {
    if (!mouseActiveRef.current) return;
    mouseActiveRef.current = false;
    if (activeRef.current) {
      activeRef.current = false;
      settle(false);
    }
  };

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      {/* The wrapped scroll container — kept mounted for the whole refresh.
          The gesture lives on it, so a refresh never remounts children. */}
      <div
        ref={scrollRef}
        className={cn(
          'ptr-scroll h-full overflow-y-auto overflow-x-hidden overscroll-none',
          className
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
      >
        {children}
      </div>

      {/* Refresh indicator — a sibling of the scroll container, pinned to the
          visible top and GPU-transformed (translate3d + will-change), so it
          never scrolls with content or triggers layout. */}
      <div
        ref={indicatorRef}
        aria-hidden={!refreshing}
        className="ptr-indicator absolute inset-x-0 top-0 z-20 flex justify-center pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(0,-60px,0)' }}
      >
        <div
          role={refreshing ? 'status' : undefined}
          aria-label={refreshing ? 'Refreshing' : undefined}
          className="mt-2 h-9 w-9 rounded-full bg-surface border border-borderSubtle shadow-sm flex items-center justify-center"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : (
            <span
              ref={iconRef}
              className="flex items-center justify-center will-change-transform"
            >
              <ChevronDown className="w-4 h-4 text-accent" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};