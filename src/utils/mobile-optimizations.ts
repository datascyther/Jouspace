// Mobile Performance Optimizations
// Provides utilities for seamless mobile experience

import { useState, useEffect, useRef, useCallback } from 'react';

// Debounce hook for optimizing frequent updates
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for limiting function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const callbackRef = useRef(callback);

  // Update callback ref on every render to avoid stale closure
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callbackRef.current(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [delay]
  );
}

// Intersection Observer for lazy loading
export function useLazyLoad(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isIntersecting };
}

// Request Animation Frame hook for smooth animations
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}

// Mobile device detection
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Touch device detection
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

// Viewport size detection
export const getViewportSize = () => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
};

// Network status detection
export const getNetworkStatus = () => {
  const connection = (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  return null;
};

// Optimized image loading
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Local storage with fallback
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Fallback to memory storage if localStorage is full or disabled
      (window as any).__tempStorage = (window as any).__tempStorage || {};
      (window as any).__tempStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      if ((window as any).__tempStorage) {
        delete (window as any).__tempStorage[key];
      }
    }
  },
};

// Performance monitoring
export const measurePerformance = (name: string) => {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  return {
    start: () => performance.mark(startMark),
    end: () => {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
      return measure ? measure.duration : 0;
    },
  };
};

// Optimized scroll handler
export const useOptimizedScroll = (callback: () => void, delay = 100) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);

  const handleScroll = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    timeoutRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(callback);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);
};

// Prevent double tap zoom on iOS (returns cleanup function)
let cleanupDoubleTapZoom: (() => void) | null = null;

export const preventDoubleTapZoom = () => {
  // Remove previous listener if exists
  if (cleanupDoubleTapZoom) {
    cleanupDoubleTapZoom();
  }

  let lastTouchEnd = 0;

  const handler = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  };

  document.addEventListener('touchend', handler, { passive: false });

  cleanupDoubleTapZoom = () => {
    document.removeEventListener('touchend', handler);
  };

  return cleanupDoubleTapZoom;
};

// Haptic feedback for mobile
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
      }
    } catch (error) {
      // Vibration permission denied or not supported
      console.debug('Haptic feedback not available:', error);
    }
  }
};

export default {
  useDebounce,
  useThrottle,
  useLazyLoad,
  useAnimationFrame,
  isMobileDevice,
  isTouchDevice,
  getViewportSize,
  getNetworkStatus,
  preloadImage,
  safeLocalStorage,
  measurePerformance,
  useOptimizedScroll,
  preventDoubleTapZoom,
  triggerHapticFeedback,
};
