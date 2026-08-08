import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Entry } from './EntryRow';

interface SearchScreenProps {
  entries: Entry[];
  onBack?: () => void;
  onResultClick?: (id: string) => void;
  className?: string;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  entries,
  onBack,
  onResultClick,
  className = '',
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.theme.toLowerCase().includes(q) ||
        (e.content ?? '').toLowerCase().includes(q)
    );
  }, [query, entries]);

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 shrink-0 border-b border-divider">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4L6 9L11 14" />
          </svg>
        </button>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted stroke-[1.8]" />
          <input
            type="text"
            placeholder="Search entries, themes, memories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-surface border border-border rounded-[14px] pl-10 pr-10 py-3 font-sans text-[14px] text-primaryText placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center text-secondaryText hover:bg-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-4">
        {!query.trim() ? (
          <p className="font-sans text-[13px] text-muted mt-2">
            Search your entries by title, theme, or content.
          </p>
        ) : results.length === 0 ? (
          <p className="font-sans text-[14px] text-muted mt-2">
            No entries match “{query}”.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="font-sans text-[12px] text-muted mb-2">
              {results.length} result{results.length !== 1 ? 's' : ''} for “{query}”
            </p>
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => onResultClick?.(result.id)}
                className="w-full text-left bg-surface border border-border rounded-[14px] px-4 py-3.5 hover:border-accent/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-sans text-[14px] font-medium text-primaryText mb-1 truncate">
                    {result.title}
                  </h4>
                  <span className="font-sans text-[11px] text-muted shrink-0">
                    {result.date}
                  </span>
                </div>
                <p className="font-sans text-[13px] text-secondaryText leading-relaxed line-clamp-2">
                  {result.content || result.theme}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
