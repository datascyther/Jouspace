import { useState, useEffect, useCallback } from 'react';
import { queueUserPrefsSync } from '../lib/supabaseUserPrefs';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'jouspace:theme';

const LIGHT_BASE = '#F5F3EF';
const DARK_BASE = '#1A1A1E';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function resolveTheme(pref: Theme): 'light' | 'dark' {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

export function applyTheme(resolved: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? DARK_BASE : LIGHT_BASE);
  }
}

export function useTheme(): {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [resolvedTheme, setResolved] = useState<'light' | 'dark'>(() =>
    resolveTheme(readTheme())
  );

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolved(resolved);
    applyTheme(resolved);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = resolveTheme('system');
      setResolved(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
    void queueUserPrefsSync();
  }, []);

  return { theme, resolvedTheme, setTheme };
}
