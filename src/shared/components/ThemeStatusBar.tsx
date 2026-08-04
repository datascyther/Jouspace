import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/hooks/useTheme';

/**
 * Status bar whose content color tracks the active theme:
 * light content on dark backgrounds, dark content on light backgrounds.
 */
export function ThemeStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default ThemeStatusBar;
