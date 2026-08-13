import React from 'react';
import { ThemeChip } from './ThemeChip';

export interface ThemeOption {
  id: string;
  label: string;
}

interface ThemeChipGroupProps {
  themes?: ThemeOption[];
  /** Additional theme chips appended after `themes` (e.g. an active custom theme). */
  extraThemes?: ThemeOption[];
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  className?: string;
}

export const DEFAULT_THEMES: ThemeOption[] = [
  { id: 'clarity', label: 'clarity' },
  { id: 'discipline', label: 'discipline' },
  { id: 'purpose', label: 'purpose' },
  { id: 'pressure', label: 'pressure' },
  { id: 'starting_again', label: 'starting again' },
];

/**
 * Map a theme id to its human display label. Falls back to converting
 * underscores to spaces (e.g. 'starting_again' → 'starting again') so raw ids
 * never leak into the UI.
 */
export function themeLabel(themeId: string): string {
  const found = DEFAULT_THEMES.find((t) => t.id === themeId);
  if (found) return found.label;
  return themeId.replace(/_/g, ' ');
}

/**
 * Resolve a possibly-label-style theme value to its canonical id (e.g.
 * 'Starting Again' or 'starting again' → 'starting_again'). This keeps
 * imported/legacy entries with human-friendly labels connected to the same
 * memory threads as new entries. Unknown values are returned unchanged so no
 * data is silently dropped.
 */
export function normalizeTheme(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return value;
  const byId = DEFAULT_THEMES.find((t) => t.id === trimmed);
  if (byId) return byId.id;
  const byLabel = DEFAULT_THEMES.find((t) => t.label === trimmed);
  if (byLabel) return byLabel.id;
  return value;
}

export const ThemeChipGroup: React.FC<ThemeChipGroupProps> = ({
  themes = DEFAULT_THEMES,
  extraThemes = [],
  selectedThemeId,
  onSelectTheme,
  className = '',
}) => {
  const allThemes = [...themes, ...extraThemes];

  return (
    <div className={`flex flex-col gap-3.5 w-full text-left ${className}`}>
      <h3 className="font-serif text-[19px] text-primaryText font-normal tracking-tight">
        Themes
      </h3>

      {/* Horizontal Chip Container with subtle scroll overflow for small screens */}
      <div className="flex items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-1 no-scrollbar -mx-1 px-1">
        {allThemes.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          return (
            <ThemeChip
              key={theme.id}
              label={theme.label}
              isSelected={isSelected}
              onClick={() => onSelectTheme(theme.id)}
              className="shrink-0 h-[42px] px-4"
            />
          );
        })}
      </div>
    </div>
  );
};
