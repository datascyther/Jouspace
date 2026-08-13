import React from 'react';
import { ThemeChip } from './ThemeChip';
import { themeLabel } from './ThemeChipGroup';
import { ChevronRight } from 'lucide-react';

export interface Entry {
  id: string;
  date: string;
  title: string;
  theme: string;
  content?: string;
}

interface EntryRowProps {
  entry: Entry;
  isLast?: boolean;
  onClick?: (entry: Entry) => void;
  /** Hide the per-row theme chip — used where the surrounding context already
   *  names the theme (e.g. a list scoped to a single theme). */
  showTheme?: boolean;
  className?: string;
}

export const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  isLast = false,
  onClick,
  showTheme = true,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(entry)}
      aria-label={`Open entry from ${entry.date}: ${entry.title || 'untitled'}`}
      className={`group flex items-center justify-between min-h-[60px] py-3.5 px-1 cursor-pointer text-left w-full hover:bg-elevated rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 ${
        !isLast ? 'border-b border-borderSubtle' : ''
      } ${className}`}
    >
      {/* Left + Middle: Date + Entry Title */}
      <span className="flex items-center gap-5 min-w-0 pr-3 flex-1">
        <span className="font-sans text-[13.5px] text-muted shrink-0 w-12">
          {entry.date}
        </span>
        <span className="font-sans text-[14.5px] text-primaryText font-normal truncate group-hover:text-accent transition-colors">
          {entry.title}
        </span>
      </span>

      {/* Right: Theme Chip + Chevron */}
      <span className="flex items-center gap-3 shrink-0">
        {showTheme && <ThemeChip label={themeLabel(entry.theme)} />}
        <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors stroke-[1.8]" />
      </span>
    </button>
  );
};
