import React from 'react';
import { ThemeChip } from './ThemeChip';

export interface ThemeOption {
  id: string;
  label: string;
}

interface ThemeChipGroupProps {
  themes?: ThemeOption[];
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

export const ThemeChipGroup: React.FC<ThemeChipGroupProps> = ({
  themes = DEFAULT_THEMES,
  selectedThemeId,
  onSelectTheme,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-3.5 w-full text-left ${className}`}>
      <h3 className="font-serif text-[19px] text-[#0D102B] font-normal tracking-tight">
        Themes
      </h3>

      {/* Horizontal Chip Container with subtle scroll overflow for small screens */}
      <div className="flex items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-1 no-scrollbar -mx-1 px-1">
        {themes.map((theme) => {
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
