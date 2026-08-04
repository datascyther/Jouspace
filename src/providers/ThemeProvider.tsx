import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAppStore } from '@/core/store/useAppStore';
import { colors as themeColors } from '@/theme/colors';
import { themeToCssVars } from '@/theme/cssVars';
import { resolveSunTheme, msUntilNextTransition, getSunSchedule } from '@/theme/schedule';
import type { ThemeTokens } from '@/theme';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeType = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeType;
  colors: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  /** True when the resolved theme is dark (handy for icons/gradients). */
  isDark: boolean;
  /** For "auto": which theme the system schedule would currently resolve to. */
  systemTheme: ThemeType;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDocument(theme: ThemeType, tokens: ThemeTokens) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  // Single source of truth: push token values as CSS variables so every
  // Tailwind class and every `var(--…)` usage reflects the active theme.
  const vars = themeToCssVars(tokens);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', tokens.background.primary);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppStore((state) => state.ui.theme);
  const setMode = useAppStore((state) => state.setTheme);

  // Re-render trigger so the "auto" schedule flips at the next sunrise/sunset.
  const [tick, setTick] = useState(0);

  const systemTheme = useMemo<ThemeType>(() => resolveSunTheme(new Date(), getSunSchedule()), [tick]);

  const theme = useMemo<ThemeType>(() => {
    if (mode === 'auto') return systemTheme;
    return mode === 'dark' ? 'dark' : 'light';
  }, [mode, systemTheme]);

  const tokens = useMemo<ThemeTokens>(() => themeColors[theme], [theme]);

  // Schedule the next auto flip at the upcoming sunrise/sunset boundary.
  useEffect(() => {
    if (mode !== 'auto') return;
    const id = setTimeout(() => setTick((t) => t + 1), msUntilNextTransition(new Date(), getSunSchedule()));
    return () => clearTimeout(id);
  }, [mode, tick]);

  // Sync NativeWind's color scheme (used on native).
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nw = require('nativewind');
      if (nw?.colorScheme?.set) nw.colorScheme.set(theme);
    } catch {
      /* not in a NativeWind environment */
    }
  }, [theme]);

  // Apply to the DOM. useLayoutEffect avoids a flash on web.
  const apply = useCallback(() => applyThemeToDocument(theme, tokens), [theme, tokens]);
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(apply, [apply]);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(apply, [apply]);
  }

  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextType>(
    () => ({ mode, theme, colors: tokens, setMode, toggleTheme, isDark: theme === 'dark', systemTheme }),
    [mode, theme, tokens, setMode, toggleTheme, systemTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
