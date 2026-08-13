import { useEffect, useRef } from 'react';

/**
 * Attaches a document-level `keydown` listener that invokes `onEscape` when the
 * Escape key is pressed while `enabled` is true.
 *
 * The listener is only attached while `enabled` is true and is removed on
 * unmount or when `enabled` flips to false. The latest `onEscape` is kept in a
 * ref so callers can pass an inline closure without the listener being
 * re-attached on every render. Safe to call from many components at once.
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onEscapeRef.current();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [enabled]);
}
