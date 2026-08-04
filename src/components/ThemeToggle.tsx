import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/providers/ThemeProvider';

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
}

const iconMap: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

const labelMap: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'System',
};

const nextMode: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'auto',
  auto: 'light',
};

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { mode, theme, setMode } = useTheme();
  const Icon = iconMap[mode];

  const cycle = () => setMode(nextMode[mode]);

  if (variant === 'full') {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-background-secondary border border-border-default rounded-xl">
        {(['light', 'dark', 'auto'] as ThemeMode[]).map((m) => {
          const MIcon = iconMap[m];
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-label={`${labelMap[m]} mode`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-brand-primary text-brand-contrastText shadow-lg shadow-brand-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
              }`}
            >
              <MIcon className="w-4 h-4" />
              <span>{labelMap[m]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Current mode: ${labelMap[mode]}. Click to switch to ${labelMap[nextMode[mode]]}`}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border border-border-default bg-surface-secondary text-text-secondary hover:text-text-primary hover:border-border-default/50 hover:bg-surface-primary shadow-sm active:scale-95"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
