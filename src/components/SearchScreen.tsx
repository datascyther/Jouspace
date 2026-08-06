import React, { useState } from 'react';
import { Search, X, Clock } from 'lucide-react';

interface SearchScreenProps {
  onBack?: () => void;
  onResultClick?: (id: string) => void;
  className?: string;
}

const RECENT_SEARCHES = ['morning reflections', 'creative work', 'gratitude'];

const SEARCH_RESULTS = [
  { id: '1', title: 'Morning reflections', snippet: 'I keep returning to the same thought about quiet spaces…', date: 'Aug 4, 2026' },
  { id: '2', title: 'Creative work and flow', snippet: 'The best ideas come when I stop trying to force them…', date: 'Jul 28, 2026' },
  { id: '3', title: 'Gratitude practice', snippet: 'Today I noticed how the light came through the window…', date: 'Jul 21, 2026' },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onBack,
  onResultClick,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    setIsSearching(value.length > 0);
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearching(false);
  };

  return (
    <div className={`flex flex-col w-full pt-4 px-6 animate-fadeIn ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
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
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-[14px] pl-10 pr-10 py-3 font-sans text-[14px] text-primaryText placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center text-secondaryText hover:bg-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isSearching ? (
        /* Recent Searches */
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[13px] font-medium text-muted uppercase tracking-wider">
            Recent searches
          </h3>
          {RECENT_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSearch(term)}
              className="flex items-center gap-3 w-full text-left py-2 focus:outline-none cursor-pointer group"
            >
              <Clock className="w-4 h-4 text-muted stroke-[1.6] group-hover:text-accent transition-colors" />
              <span className="font-sans text-[14px] text-primaryText group-hover:text-accent transition-colors">
                {term}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* Search Results */
        <div className="flex flex-col gap-2">
          <p className="font-sans text-[12px] text-muted mb-2">
            {SEARCH_RESULTS.length} result{SEARCH_RESULTS.length !== 1 ? 's' : ''} for "{query}"
          </p>
          {SEARCH_RESULTS.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => onResultClick?.(result.id)}
              className="w-full text-left bg-surface border border-border rounded-[14px] px-4 py-3.5 hover:border-accent/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              <h4 className="font-sans text-[14px] font-medium text-primaryText mb-1">
                {result.title}
              </h4>
              <p className="font-sans text-[13px] text-secondaryText leading-relaxed line-clamp-2">
                {result.snippet}
              </p>
              <span className="font-sans text-[11px] text-muted mt-1.5 block">
                {result.date}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
