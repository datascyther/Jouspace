import React, { useState } from 'react';
import { MemoryHeader } from './MemoryHeader';
import { MemoryInsightCard } from './MemoryInsightCard';
import { ThemeChipGroup, DEFAULT_THEMES } from './ThemeChipGroup';
import { EntryRow, Entry } from './EntryRow';
import { ReflectionPromptCard } from './ReflectionPromptCard';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { Search, X } from 'lucide-react';

export interface ThemeMemoryData {
  statement: string;
  supportingCopy: string;
  connectedEntries: Entry[];
  reflectionPrompt: string;
}

export const MEMORY_DATA_BY_THEME: Record<string, ThemeMemoryData> = {
  clarity: {
    statement: 'You keep coming back to clarity.',
    supportingCopy: 'This theme appeared across 6 entries this month.',
    connectedEntries: [
      {
        id: 'mem-1',
        date: 'Aug 1',
        title: 'I need to rebuild my rhythm',
        theme: 'discipline',
        content: 'Focusing on the quiet routine rather than high pressure targets.',
      },
      {
        id: 'mem-2',
        date: 'Jul 29',
        title: 'Why this app matters to me',
        theme: 'purpose',
        content: "A space that doesn't push streaks or check-ins, just quiet space for thought.",
      },
      {
        id: 'mem-3',
        date: 'Jul 24',
        title: 'A quieter place to think',
        theme: 'clarity',
        content: 'Unpacking the noise from the week and returning to core priorities.',
      },
    ],
    reflectionPrompt: 'What does clarity usually mean when you write about it?',
  },
  discipline: {
    statement: 'Discipline shows up when momentum slows.',
    supportingCopy: 'This theme appeared across 4 entries this month.',
    connectedEntries: [
      {
        id: 'mem-4',
        date: 'Aug 1',
        title: 'I need to rebuild my rhythm',
        theme: 'discipline',
        content: 'Building consistency through small quiet actions.',
      },
      {
        id: 'mem-5',
        date: 'Jul 18',
        title: 'Small daily rituals',
        theme: 'discipline',
        content: 'Focusing on process over outcomes.',
      },
      {
        id: 'mem-6',
        date: 'Jun 30',
        title: 'Returning after time away',
        theme: 'discipline',
        content: 'Starting again without guilt or judgment.',
      },
    ],
    reflectionPrompt: 'How does pressure affect your sense of discipline?',
  },
  purpose: {
    statement: 'You seek purpose during quiet moments.',
    supportingCopy: 'This theme appeared across 5 entries this month.',
    connectedEntries: [
      {
        id: 'mem-7',
        date: 'Jul 29',
        title: 'Why this app matters to me',
        theme: 'purpose',
        content: 'Understanding why quiet reflection matters in daily work.',
      },
      {
        id: 'mem-8',
        date: 'Jul 12',
        title: 'The space between actions',
        theme: 'purpose',
        content: 'Evaluating long term priorities over short term urgency.',
      },
      {
        id: 'mem-9',
        date: 'Jun 22',
        title: 'Defining what stays',
        theme: 'purpose',
        content: 'Stripping away unnecessary features and keeping core intent.',
      },
    ],
    reflectionPrompt: 'When did your sense of purpose feel most clear?',
  },
  pressure: {
    statement: 'Pressure triggers your desire for quiet routine.',
    supportingCopy: 'This theme appeared across 3 entries this month.',
    connectedEntries: [
      {
        id: 'mem-10',
        date: 'Jul 26',
        title: 'Pressure, clarity, and focus',
        theme: 'clarity',
        content: 'Separating internal motivation from external urgency.',
      },
      {
        id: 'mem-11',
        date: 'Jul 05',
        title: 'Managing expectation noise',
        theme: 'pressure',
        content: 'Creating boundaries around thought space.',
      },
      {
        id: 'mem-12',
        date: 'Jun 14',
        title: 'When expectations pile up',
        theme: 'pressure',
        content: 'Returning to foundational habits.',
      },
    ],
    reflectionPrompt: 'What helps you dissolve pressure before beginning?',
  },
  starting_again: {
    statement: 'Starting again is your way of regaining control.',
    supportingCopy: 'This theme appeared across 4 entries this month.',
    connectedEntries: [
      {
        id: 'mem-13',
        date: 'Aug 1',
        title: 'I need to rebuild my rhythm',
        theme: 'discipline',
        content: 'Re-establishing rhythm after a busy period.',
      },
      {
        id: 'mem-14',
        date: 'Jul 19',
        title: 'Beginning from zero',
        theme: 'starting again',
        content: 'Approaching problems with fresh perspective.',
      },
      {
        id: 'mem-15',
        date: 'Jun 10',
        title: 'Resetting the foundation',
        theme: 'starting again',
        content: 'Simplicity as a tool for restart.',
      },
    ],
    reflectionPrompt: 'What feels different about this reset compared to last time?',
  },
};

interface MemoryScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userInitials?: string;
  isLoading?: boolean;
  isNoMemories?: boolean;
  isNoConnectedEntries?: boolean;
  isSearchActive?: boolean;
  onEntryClick?: (entry: Entry) => void;
  onExploreThread?: () => void;
  onReflectWithAi?: () => void;
  onToast?: (msg: string) => void;
}

export const MemoryScreenContent: React.FC<MemoryScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'VU',
  isLoading = false,
  isNoMemories = false,
  isNoConnectedEntries = false,
  isSearchActive = false,
  onEntryClick,
  onExploreThread,
  onReflectWithAi,
  onToast,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>('clarity');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localSearchOpen, setLocalSearchOpen] = useState<boolean>(isSearchActive);

  const currentData =
    MEMORY_DATA_BY_THEME[selectedThemeId] || MEMORY_DATA_BY_THEME.clarity;

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    onToast?.(`Theme changed to "${themeId.replace('_', ' ')}"`);
  };

  const filteredEntries = currentData.connectedEntries.filter((e) =>
    searchQuery
      ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.theme.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <MemoryHeader
            userInitials={userInitials}
            onSearchClick={() => setLocalSearchOpen(!localSearchOpen)}
            onAvatarClick={() => onToast?.('User Profile & Memory Engine settings')}
          />

          {(localSearchOpen || isSearchActive) && (
            <div className="flex items-center gap-2 bg-[#FFFEFC] border border-[#6D4FD7]/40 rounded-[16px] px-4 py-2.5 shadow-xs transition-all animate-fadeIn -mt-2">
              <Search className="w-4 h-4 text-[#6D4FD7]" />
              <input
                type="text"
                placeholder="Search memory patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 font-sans text-sm text-[#0D102B] bg-transparent outline-none placeholder:text-[#8B8998]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#8B8998] hover:text-[#0D102B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <section>
            {isLoading ? (
              <div className="bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 animate-pulse space-y-3">
                <div className="h-4 bg-[#E7E1EF] rounded w-1/3" />
                <div className="h-10 bg-[#E7E1EF] rounded w-3/4" />
                <div className="h-4 bg-[#E7E1EF] rounded w-1/2" />
                <div className="h-4 bg-[#E7E1EF] rounded w-1/4 pt-2" />
              </div>
            ) : isNoMemories ? (
              <div className="bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 flex flex-col gap-3">
                <span className="text-[#6D4FD7] font-sans text-xs font-medium">
                  ✦ Jouspace listening
                </span>
                <h2 className="font-serif text-[22px] text-[#0D102B]">
                  Memory patterns are forming
                </h2>
                <p className="font-sans text-[14px] text-[#68677E]">
                  Write a few more entries to allow Jouspace to connect memory
                  threads across time.
                </p>
              </div>
            ) : (
              <MemoryInsightCard
                label="Jouspace remembered"
                statement={currentData.statement}
                supportingCopy={currentData.supportingCopy}
                actionText="Explore thread"
                onExploreThread={onExploreThread}
              />
            )}
          </section>

          <section>
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-[#E7E1EF] rounded w-1/4" />
                <div className="flex gap-2">
                  <div className="h-10 bg-[#E7E1EF] rounded-full w-20" />
                  <div className="h-10 bg-[#E7E1EF] rounded-full w-24" />
                  <div className="h-10 bg-[#E7E1EF] rounded-full w-20" />
                </div>
              </div>
            ) : (
              <ThemeChipGroup
                themes={DEFAULT_THEMES}
                selectedThemeId={selectedThemeId}
                onSelectTheme={handleThemeSelect}
              />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-serif text-[19px] text-[#0D102B] font-normal tracking-tight text-left">
              Connected entries
            </h3>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-[#E7E1EF] rounded-xl" />
                <div className="h-12 bg-[#E7E1EF] rounded-xl" />
                <div className="h-12 bg-[#E7E1EF] rounded-xl" />
              </div>
            ) : isNoConnectedEntries || filteredEntries.length === 0 ? (
              <p className="font-sans text-[14px] text-[#8B8998] py-3 text-left">
                No connected entries found for this theme.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-[#E9E4E0]">
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

          <section>
            {isLoading ? (
              <div className="bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 animate-pulse space-y-3">
                <div className="h-4 bg-[#E7E1EF] rounded w-1/4" />
                <div className="h-8 bg-[#E7E1EF] rounded w-3/4" />
                <div className="h-4 bg-[#E7E1EF] rounded w-1/3" />
              </div>
            ) : (
              <ReflectionPromptCard
                label="Reflection prompt"
                promptText={currentData.reflectionPrompt}
                actionText="Reflect with AI"
                onReflect={onReflectWithAi}
              />
            )}
          </section>
        </div>
      </div>

      {/* Pinned BottomNavigation */}
      <div className="shrink-0 px-3 pb-2 pb-safe">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
