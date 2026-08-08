import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

/**
 * Overlay stack — keeps track of which modal/drawer is on top so that only the
 * topmost one handles Escape and traps Tab focus. Nested overlays (e.g. the
 * reflect drawer opened from inside the memory-thread overlay) therefore close
 * one at a time and return focus to the layer beneath them.
 */

interface OverlayStackContextValue {
  register: (id: string) => void;
  unregister: (id: string) => void;
  isTop: (id: string) => boolean;
}

const OverlayStackContext = createContext<OverlayStackContextValue | null>(null);

export function OverlayStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([]);

  const register = useCallback((id: string) => {
    setStack((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const unregister = useCallback((id: string) => {
    setStack((prev) => prev.filter((x) => x !== id));
  }, []);

  const isTop = useCallback(
    (id: string) => stack.length > 0 && stack[stack.length - 1] === id,
    [stack]
  );

  const value = useMemo(
    () => ({ register, unregister, isTop }),
    [register, unregister, isTop]
  );

  return (
    <OverlayStackContext.Provider value={value}>
      {children}
    </OverlayStackContext.Provider>
  );
}

export function useOverlayStack(): OverlayStackContextValue {
  const ctx = useContext(OverlayStackContext);
  if (!ctx) {
    throw new Error('useOverlayStack must be used within an OverlayStackProvider');
  }
  return ctx;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface FocusTrapOptions {
  /** Stable id for this overlay (use React's useId or a literal). */
  id: string;
  active: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Trap Tab focus and handle Escape for a single overlay. Only the topmost
 * overlay in the stack actually attaches the listeners; the ones beneath stay
 * inert until the layer above them closes.
 */
export function useFocusTrap({
  id,
  active,
  onClose,
  containerRef,
}: FocusTrapOptions): void {
  const { register, unregister, isTop } = useOverlayStack();

  useEffect(() => {
    if (!active) return;
    register(id);
    return () => unregister(id);
  }, [active, id, register, unregister]);

  useEffect(() => {
    if (!active || !isTop(id)) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getItems = () =>
      container
        ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null
          )
        : [];

    const items = getItems();
    if (items.length > 0) items[0].focus();
    else container?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && container) {
        const list = getItems();
        if (list.length === 0) {
          e.preventDefault();
          return;
        }
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [active, id, isTop, onClose, containerRef]);
}
