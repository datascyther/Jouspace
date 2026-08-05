import React from 'react';
import { ThemeChip } from './ThemeChip';
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
  className?: string;
}

export const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  isLast = false,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={() => onClick?.(entry)}
      className={`group flex items-center justify-between min-h-[60px] py-3.5 px-1 cursor-pointer transition-colors duration-150 ${
        !isLast ? 'border-b border-[#E9E4E0]' : ''
      } ${className}`}
    >
      {/* Left + Middle: Date + Entry Title */}
      <div className="flex items-center gap-5 min-w-0 pr-3 flex-1">
        <span className="font-sans text-[13.5px] text-[#8B8998] shrink-0 w-[48px]">
          {entry.date}
        </span>
        <span className="font-sans text-[14.5px] text-[#0D102B] font-normal truncate group-hover:text-[#6D4FD7] transition-colors">
          {entry.title}
        </span>
      </div>

      {/* Right: Theme Chip + Chevron */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeChip label={entry.theme} />
        <ChevronRight className="w-4 h-4 text-[#8B8998] group-hover:text-[#6D4FD7] transition-colors stroke-[1.8]" />
      </div>
    </div>
  );
};
