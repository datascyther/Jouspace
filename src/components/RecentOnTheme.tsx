import React, { useId, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { EntryRow, type Entry } from './EntryRow';
import { normalizeTheme } from './ThemeChipGroup';
import { TextAction } from './TextAction';

interface RecentOnThemeProps {
  /** Canonical theme id the composer is currently tagged with. */
  theme: string;
  /** All saved entries, newest-first — filtered down to the selected theme. */
  entries: Entry[];
  /** Optional entry id to omit (e.g. the one currently being edited). */
  excludeId?: string;
  /** Opens a past entry's detail drawer. */
  onOpenEntry?: (entry: Entry) => void;
  /** Deep-links to the Memory thread view for this theme. */
  onExploreThread?: (themeId: string) => void;
  className?: string;
}

/** Rows shown before the "Explore thread" action covers the long tail. */
const MAX_ROWS = 3;

/**
 * "Past writing on this theme" — a quiet companion panel that surfaces recent
 * entries tagged with the composer's selected theme. Renders nothing until the
 * journal has history on that theme, so a fresh journal stays calm and the
 * panel fills itself over time rather than crowding a first entry.
 *
 * Reuses `EntryRow` with its per-row chip hidden (the surrounding context
 * already names the theme), so the list inherits the app's established focus,
 * hover, and truncation behaviour instead of introducing a parallel pattern.
 */
export const RecentOnTheme: React.FC<RecentOnThemeProps> = ({
  theme,
  entries,
  excludeId,
  onOpenEntry,
  onExploreThread,
  className = '',
}) => {
  const titleId = useId();

  // Normalize both sides so legacy/imported entries that stored a human label
  // (e.g. "starting again") still connect to the canonical theme thread.
  const matches = useMemo(() => {
    const target = normalizeTheme(theme);
    return entries.filter(
      (e) => e.id !== excludeId && normalizeTheme(e.theme) === target
    );
  }, [theme, entries, excludeId]);

  // Quiet by design: an empty theme renders nothing.
  if (matches.length === 0) return null;

  const shown = matches.slice(0, MAX_ROWS);
  const total = matches.length;

  return (
    <section
      aria-labelledby={titleId}
      className={`flex flex-col gap-3.5 w-full text-left ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id={titleId}
          className="font-serif text-[19px] text-primaryText font-normal tracking-tight"
        >
          Past writing on this theme
        </h3>
        <span className="font-sans text-[12.5px] text-muted shrink-0">
          {total} {total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-borderSubtle">
        {shown.map((entry, idx) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            isLast={idx === shown.length - 1}
            showTheme={false}
            onClick={onOpenEntry}
          />
        ))}
      </div>

      {onExploreThread && (
        <TextAction
          onClick={() => onExploreThread(theme)}
          icon={<ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />}
          className="-ml-2"
        >
          Explore thread
        </TextAction>
      )}
    </section>
  );
};
