import { useRef, useEffect } from 'react';

/**
 * Custom hook to debounce animation state changes.
 * Prevents rapid-fire animations that can cause shadow bleeding and flickering.
 * 
 * @param value - The current value to debounce
 * @param delay - Delay in milliseconds before applying the change (default: 50ms)
 * @returns The debounced value
 */
export function useAnimationDebounce<T>(value: T, delay: number = 50): T {
  const debouncedValue = useRef(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      debouncedValue.current = value;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue.current;
}

/**
 * Custom hook to prevent animation when state hasn't meaningfully changed.
 * Tracks previous state and only triggers animations when there's an actual change.
 * 
 * @param value - The current value to track
 * @returns Whether the value has changed from the previous render
 */
export function useHasStateChanged<T>(value: T): boolean {
  const prevValueRef = useRef(value);
  const hasChanged = prevValueRef.current !== value;
  
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  return hasChanged;
}
