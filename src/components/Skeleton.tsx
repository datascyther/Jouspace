import React, { useEffect, useRef, useState } from 'react';
import logoSrc from '../assets/Jouspace logo.png';

/**
 * One reusable skeleton component. Pick a `layout` preset, set `count` for the
 * number of rows/items, and toggle `animate` to enable/disable the shimmer.
 *
 * The shimmer itself is the `.skeleton-shimmer` / `.skeleton-static` CSS classes
 * (defined in src/index.css) — a GPU-only highlight sweep over a warm-grey base.
 */

export type SkeletonLayout = 'chat' | 'list' | 'card' | 'form';

export interface SkeletonProps {
  /** Which preset shape to draw. */
  layout: SkeletonLayout;
  /** How many rows/items to shimmer. */
  count?: number;
  /** Enable/disable the shimmer sweep (default: true). */
  animate?: boolean;
  /**
   * Chat only. When true (default), a skeletonized full-width composer bar is
   * drawn beneath the message rows — use this for an initial chat load. When
   * false, only message rows are drawn, so a *visible* composer is never
   * skeletonized (e.g. while waiting for the AI's first token).
   */
  composer?: boolean;
  className?: string;
}

// Natural-feeling message-bar widths for the chat preset.
const CHAT_BAR_WIDTHS = ['70%', '50%', '85%', '60%', '75%', '65%'];

export const Skeleton: React.FC<SkeletonProps> = ({
  layout,
  count = 1,
  animate = true,
  composer = true,
  className = '',
}) => {
  const shimmer = (extra: string) =>
    `${animate ? 'skeleton-shimmer' : 'skeleton-static'} ${extra}`;
  const n = Math.max(1, count);

  if (layout === 'chat') {
    return (
      <div className={`flex flex-col gap-5 w-full ${className}`} aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={shimmer('w-10 h-10 rounded-full shrink-0')} />
            <div
              className={shimmer('rounded-lg')}
              style={{ width: CHAT_BAR_WIDTHS[i % CHAT_BAR_WIDTHS.length], height: 16 }}
            />
          </div>
        ))}
        {composer && (
          <div className={shimmer('w-full rounded-2xl mt-1')} style={{ height: 48 }} />
        )}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className={`flex flex-col gap-4 w-full ${className}`} aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className={shimmer('w-full rounded-2xl')} style={{ height: 72 }} />
        ))}
      </div>
    );
  }

  if (layout === 'card') {
    return (
      <div className={`flex flex-col gap-4 w-full ${className}`} aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className={shimmer('w-full rounded-2xl')} style={{ height: 96 }} />
        ))}
      </div>
    );
  }

  // form
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={shimmer('w-full rounded-xl')} style={{ height: 56 }} />
      ))}
      {/* Button row */}
      <div className={shimmer('w-full rounded-xl')} style={{ height: 56 }} />
    </div>
  );
};

/**
 * Branded cold-start spinner: the Jouspace logo mark with a slow pulse, plus a
 * quiet "Opening your space..." caption. Shown only while the app is waking up
 * (never as a content skeleton).
 */
export const BrandedSpinner: React.FC<{ className?: string; label?: string }> = ({
  className = '',
  label = 'Opening your space...',
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-4 ${className}`}
    role="status"
    aria-live="polite"
  >
    <img
      src={logoSrc}
      alt=""
      aria-hidden="true"
      className="w-14 h-14 rounded-full shadow-sm object-cover animate-brand-pulse"
    />
    <span className="font-sans text-[13px] text-muted select-none">{label}</span>
  </div>
);

/**
 * Loading guard: returns true if `isLoading` has stayed true longer than
 * `timeoutMs` (default 8s). Used to flip a hung skeleton into an error state so
 * a skeleton never hangs forever.
 */
export function useLoadGuard(isLoading: boolean, timeoutMs = 8000): boolean {
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (startRef.current === null) startRef.current = Date.now();
      const remaining = timeoutMs - (Date.now() - startRef.current);
      if (remaining <= 0) {
        setTimedOut(true);
        return;
      }
      const t = setTimeout(() => setTimedOut(true), remaining);
      return () => clearTimeout(t);
    }
    startRef.current = null;
    setTimedOut(false);
  }, [isLoading, timeoutMs]);

  return timedOut;
}
