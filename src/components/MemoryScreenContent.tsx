import React, { useMemo, useState } from 'react';
import { MemoryHeader } from './MemoryHeader';
import { MemoryInsightCard } from './MemoryInsightCard';
import {
  ThemeChipGroup,
  DEFAULT_THEMES,
  themeLabel,
  normalizeTheme,
} from './ThemeChipGroup';
import { EntryRow, Entry } from './EntryRow';
import { ReflectionPromptCard } from './ReflectionPromptCard';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { Skeleton, useLoadGuard } from './Skeleton';
import { ErrorState } from './ErrorState';
import { useAiInsight } from '../hooks/useJouspaceIntelligence';

interface MemoryScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Real journal entries — memory patterns are derived from these. */
  entries: Entry[];
  isNoMemories?: boolean;
  onEntryClick?: (entry: Entry) => void;
  onExploreThread?: (themeId: string) => void;
  onReflectWithAi?: () => void;
  onOpenSearch?: () => void;
  onAvatarClick?: () => void;
  /** Display initials for the header avatar (e.g. "N" from the profile name). */
  userInitials?: string;
  /** When true, show the list skeleton while entries are "fetching". */
  isLoading?: boolean;
  /** Retry handler surfaced if the load guard times out. */
  onRetry?: () => void;
}

/**
 * Pick the theme with the most entries so the Memory view opens on the most
 * meaningful pattern (e.g. a freshly-written "purpose" entry is not hidden
 * behind the always-"clarity" default). Falls back to the first default theme
 * when the journal is empty. Ties resolve to the first theme in canonical order.
 */
function getInitialTheme(entries: Entry[]): string {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const key = normalizeTheme(entry.theme);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = DEFAULT_THEMES[0].id;
  let bestCount = -1;
  for (const theme of DEFAULT_THEMES) {
    const c = counts.get(theme.id) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      best = theme.id;
    }
  }
  return best;
}

export const MemoryScreenContent: React.FC<MemoryScreenContentProps> = ({
  activeTab,
  onTabChange,
  entries,
  isNoMemories = false,
  onEntryClick,
  onExploreThread,
  onReflectWithAi,
  onOpenSearch,
  onAvatarClick = () => {},
  userInitials,
  isLoading = false,
  onRetry,
}) => {
  // Flip a hung skeleton into an error state after 8s so it never hangs forever.
  const memoryTimedOut = useLoadGuard(isLoading, 8000);

  // Only computed on mount (when the Memory tab is opened), so a user's manual
  // chip selection is never overridden while they're on the screen.
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() =>
    getInitialTheme(entries)
  );
  const [searchQuery] = useState<string>('');

  // Group the real entries by theme (canonical theme order preserved).
  // Themes are normalized to canonical ids so imported/legacy entries that
  // store the human label (e.g. "starting again") still match their thread.
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const theme of DEFAULT_THEMES) map.set(theme.id, []);
    for (const entry of entries) {
      const key = normalizeTheme(entry.theme);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const connectedEntries = grouped.get(normalizeTheme(selectedThemeId)) ?? [];
  const count = connectedEntries.length;
  const label = themeLabel(selectedThemeId);

  // Live, theme-specific reflection prompt. Only streams when the journal has
  // entries for the selected theme; passes those real entries as AI context.
  const promptInsight = useAiInsight(
    !isNoMemories && connectedEntries.length > 0,
    connectedEntries.map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      theme: e.theme,
      content: e.content ?? '',
    }))
  );

  const filteredEntries = connectedEntries.filter((e) =>
    searchQuery
      ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.theme.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <MemoryHeader
            userInitials={userInitials}
            onSearchClick={onOpenSearch}
            onAvatarClick={onAvatarClick}
          />

          <section>
            {isNoMemories ? (
              <div className="bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col gap-3">
                <span className="text-accent font-sans text-xs font-medium">
                  ✦ Jouspace listening
                </span>
                <h2 className="font-serif text-[22px] text-primaryText">
                  Memory patterns are forming
                </h2>
                <p className="font-sans text-[14px] text-secondaryText max-w-[85%]">
                  Write a few more entries to allow Jouspace to connect memory
                  threads across time.
                </p>
              </div>
            ) : (
              <MemoryInsightCard
                label="Jouspace remembered"
                statement={
                  count > 0
                    ? `You've written about ${label} ${count} time${count === 1 ? '' : 's'}.`
                    : `No entries tagged "${label}" yet.`
                }
                supportingCopy={`${count} connected ${count === 1 ? 'entry' : 'entries'}.`}
                actionText="Explore thread"
                onExploreThread={() => onExploreThread?.(selectedThemeId)}
              />
            )}
          </section>

          <section>
            <ThemeChipGroup
              themes={DEFAULT_THEMES}
              selectedThemeId={selectedThemeId}
              onSelectTheme={handleThemeSelect}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-serif text-[19px] text-primaryText font-normal tracking-tight text-left">
              Connected entries
            </h3>

            {isLoading ? (
              memoryTimedOut ? (
                <ErrorState
                  title="Couldn't load"
                  message="Your entries took too long to load."
                  onRetry={onRetry}
                />
              ) : (
                <Skeleton layout="list" count={5} className="animate-fadeIn200" />
              )
            ) : filteredEntries.length === 0 ? (
              <p className="font-sans text-[14px] text-muted py-3 text-left">
                {searchQuery
                  ? 'No matching entries found for this theme.'
                  : 'No connected entries found for this theme.'}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-borderSubtle animate-fadeIn200">
                {filteredEntries.map((entry, idx) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    isLast={idx === filteredEntries.length - 1}
                    onClick={onEntryClick}
                  />
                ))}
              </div>
            )}
          </section>

          {!isNoMemories && (
            <section>
              <ReflectionPromptCard
                label="Reflection prompt"
                promptText={
                  promptInsight.text ||
                  `What does ${label} mean to you right now?`
                }
                actionText="Reflect with AI"
                onReflect={onReflectWithAi}
              />
            </section>
          )}
        </div>
      </div>

      {/* Pinned BottomNavigation */}
      <div className="shrink-0">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
