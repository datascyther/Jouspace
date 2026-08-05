import { useState } from 'react';
import { AppScreen } from './components/AppScreen';
import { JouspaceHeader } from './components/JouspaceHeader';
import { MemoryLabel } from './components/MemoryLabel';
import { PrimaryCard } from './components/PrimaryCard';
import { PrimaryButton } from './components/PrimaryButton';
import { TextAction } from './components/TextAction';
import { AIInsightCard } from './components/AIInsightCard';
import { EntryRow, Entry } from './components/EntryRow';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { StateSelector, AppStateMode, ScreenView } from './components/StateSelector';
import { JournalScreenContent } from './components/JournalScreenContent';
import { MemoryScreenContent } from './components/MemoryScreenContent';
import { AIScreenContent } from './components/AIScreenContent';
import { AutosaveStatus } from './components/JournalMetadata';
import {
  WriteDrawer,
  AIReflectDrawer,
  EntryDetailDrawer,
} from './components/InteractiveDrawers';
import {
  DEFAULT_USER,
  DEFAULT_CONTINUE_PROMPT,
  DEFAULT_AI_INSIGHT,
  DEFAULT_RECENT_ENTRIES,
} from './mockData';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [stateMode, setStateMode] = useState<AppStateMode>('returning_user');
  const [isQaBarOpen, setIsQaBarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Interactive drawers state
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [writeInitialTitle] = useState('');
  const [writeInitialContent] = useState('');
  const [isAiReflectOpen, setIsAiReflectOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleContinueWriting = () => {
    setCurrentScreen('journal');
    setActiveTab('journal');
  };

  const handleNewEntry = () => {
    setCurrentScreen('journal');
    setActiveTab('journal');
  };

  const handleReflectWithAI = () => {
    setIsAiReflectOpen(true);
  };

  const handleEntryClick = (entry: Entry) => {
    setSelectedEntry(entry);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'journal' || tab === 'write') {
      setCurrentScreen('journal');
    } else if (tab === 'memory') {
      setCurrentScreen('memory');
    } else if (tab === 'ai') {
      setCurrentScreen('ai');
    }
  };

  // Derive state mode flags
  const isLoading = stateMode === 'loading';
  const isEmptyJournal = stateMode === 'empty_journal';
  const isNoAiInsight = stateMode === 'no_ai_insight';
  const isNoRecentEntries = stateMode === 'no_recent_entries' || isEmptyJournal;
  const isNoMemories = stateMode === 'no_memories';
  const isNoConnectedEntries = stateMode === 'no_connected_entries';
  const isSearchActive = stateMode === 'search_active';
  const isOffline = stateMode === 'offline';
  const isSmallScreen = stateMode === 'small_screen';
  const isLargeScreen = stateMode === 'large_screen';
  const isKeyboardOpen = stateMode === 'keyboard_open';
  const isEmptyEntry = stateMode === 'empty_entry';
  const isThinking = stateMode === 'thinking';
  const isStreaming = stateMode === 'streaming';
  const isNoMemoryContext = stateMode === 'no_memory_context';
  const isNoConversation = stateMode === 'no_conversation';
  const isComposerFocused = stateMode === 'composer_focused';

  const getSaveStatus = (): AutosaveStatus => {
    if (stateMode === 'autosaving') return 'autosaving';
    if (stateMode === 'saved') return 'saved';
    if (stateMode === 'save_failed') return 'failed';
    if (stateMode === 'editing') return 'editing';
    return 'autosaved';
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-start pt-3 pb-8">
      {/* QA Screen & State Switcher Toolbar */}
      <StateSelector
        currentScreen={currentScreen}
        onSelectScreen={(scr) => {
          setCurrentScreen(scr);
          setActiveTab(scr);
        }}
        currentMode={stateMode}
        onSelectMode={setStateMode}
        isOpen={isQaBarOpen}
        onToggleOpen={() => setIsQaBarOpen(!isQaBarOpen)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 bg-[#0D102B] text-white text-xs font-sans px-4 py-2 rounded-full shadow-lg transition-all animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Main App Screen Layout */}
      <AppScreen
        isSmallScreen={isSmallScreen}
        isOffline={isOffline}
        className={isLargeScreen ? 'max-w-xl md:max-w-2xl' : undefined}
      >
        {currentScreen === 'ai' ? (
          /* AI SCREEN VIEW */
          <AIScreenContent
            activeTab="ai"
            onTabChange={handleTabChange}
            userInitials={DEFAULT_USER.initials}
            isLoading={isLoading}
            isThinking={isThinking}
            isStreaming={isStreaming}
            isNoMemoryContext={isNoMemoryContext}
            isNoConversation={isNoConversation}
            isComposerFocused={isComposerFocused}
            isKeyboardOpen={isKeyboardOpen}
            onToast={showToast}
          />
        ) : currentScreen === 'memory' ? (
          /* MEMORY SCREEN VIEW */
          <MemoryScreenContent
            activeTab="memory"
            onTabChange={handleTabChange}
            userInitials={DEFAULT_USER.initials}
            isLoading={isLoading}
            isNoMemories={isNoMemories}
            isNoConnectedEntries={isNoConnectedEntries}
            isSearchActive={isSearchActive}
            onEntryClick={handleEntryClick}
            onExploreThread={() => showToast('Exploring memory thread details')}
            onReflectWithAi={handleReflectWithAI}
            onToast={showToast}
          />
        ) : currentScreen === 'journal' ? (
          /* JOURNAL SCREEN VIEW */
          <JournalScreenContent
            onBackToHome={() => {
              setCurrentScreen('home');
              setActiveTab('home');
            }}
            activeTab={activeTab === 'write' ? 'journal' : activeTab}
            onTabChange={handleTabChange}
            saveStatus={getSaveStatus()}
            isLoading={isLoading}
            isEmptyEntry={isEmptyEntry}
            isKeyboardOpen={isKeyboardOpen}
            onToast={showToast}
          />
        ) : (
          /* HOME SCREEN VIEW */
          <>
            {/* 1. Header Section */}
            <JouspaceHeader
              userInitials={DEFAULT_USER.initials}
              hasNotifications={false}
              onNotificationClick={() => showToast('Notifications (Quiet Mode)')}
              onAvatarClick={() => showToast('User Profile & Settings')}
            />

            {/* 2. Greeting Section */}
            <section className="flex flex-col gap-1 text-left mt-2 mb-1">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-[#E7E1EF] rounded-md w-3/4" />
                  <div className="h-4 bg-[#E7E1EF] rounded-md w-1/3" />
                </div>
              ) : (
                <>
                  <h1 className="font-serif text-[30px] sm:text-[32px] text-[#0D102B] font-normal leading-tight tracking-tight">
                    {isEmptyJournal
                      ? `Welcome, ${DEFAULT_USER.name}`
                      : `Good afternoon, ${DEFAULT_USER.name}`}
                  </h1>
                  <p className="font-sans text-[14px] text-[#8B8998] font-normal tracking-normal">
                    {isEmptyJournal
                      ? 'No entries recorded yet.'
                      : `Last wrote ${DEFAULT_USER.lastWroteDaysAgo} days ago.`}
                  </p>
                </>
              )}
            </section>

            {/* 3. Continue Journal Card */}
            <section>
              {isLoading ? (
                <div className="bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-[#E7E1EF] rounded w-1/3" />
                  <div className="h-6 bg-[#E7E1EF] rounded w-2/3" />
                  <div className="h-12 bg-[#E7E1EF] rounded w-full" />
                  <div className="h-10 bg-[#E7E1EF] rounded w-1/2" />
                </div>
              ) : isEmptyJournal ? (
                <PrimaryCard className="flex flex-col gap-4">
                  <MemoryLabel text="Memory-guided" />
                  <h2 className="font-serif text-[22px] text-[#0D102B] font-normal leading-snug">
                    Begin your journal
                  </h2>
                  <p className="font-sans text-[14.5px] leading-[1.55] text-[#68677E] font-normal">
                    Write down what is on your mind today. Your journal quietly
                    builds context over time.
                  </p>
                  <div className="pt-2">
                    <PrimaryButton onClick={handleNewEntry}>
                      New entry
                    </PrimaryButton>
                  </div>
                </PrimaryCard>
              ) : (
                <PrimaryCard className="flex flex-col gap-4">
                  {/* Top Label */}
                  <MemoryLabel text="Memory-guided" />

                  {/* Title */}
                  <h2 className="font-serif text-[22px] sm:text-[23px] text-[#0D102B] font-normal leading-snug tracking-tight">
                    Continue your journal
                  </h2>

                  {/* Body: Exactly three lines in source of truth */}
                  <p className="font-sans text-[14.5px] sm:text-[15px] leading-[1.55] text-[#68677E] font-normal">
                    {DEFAULT_CONTINUE_PROMPT.topicSummaryLines[0]}
                    <br />
                    {DEFAULT_CONTINUE_PROMPT.topicSummaryLines[1]}
                    <br />
                    {DEFAULT_CONTINUE_PROMPT.topicSummaryLines[2]}
                  </p>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-6 pt-2">
                    {/* Primary Button */}
                    <PrimaryButton onClick={handleContinueWriting}>
                      Continue writing
                    </PrimaryButton>

                    {/* Text Action */}
                    <TextAction onClick={handleNewEntry}>New entry</TextAction>
                  </div>
                </PrimaryCard>
              )}
            </section>

            {/* 4. AI Insight Card */}
            <section>
              {isLoading ? (
                <div className="bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 animate-pulse space-y-3">
                  <div className="h-4 bg-[#E7E1EF] rounded w-1/4" />
                  <div className="h-10 bg-[#E7E1EF] rounded w-full" />
                  <div className="h-4 bg-[#E7E1EF] rounded w-1/3 ml-auto" />
                </div>
              ) : isNoAiInsight ? (
                <PrimaryCard className="flex flex-col gap-3">
                  <MemoryLabel text="Jouspace noticed" />
                  <p className="font-serif text-[17px] leading-relaxed text-[#68677E]">
                    Reflections will appear after you write your next entry.
                  </p>
                </PrimaryCard>
              ) : (
                <AIInsightCard
                  insightText={DEFAULT_AI_INSIGHT.insightText}
                  label="Jouspace noticed"
                  onReflect={handleReflectWithAI}
                />
              )}
            </section>

            {/* 5. Recent Entries Section */}
            <section className="flex flex-col gap-3 mt-1">
              {/* Section Title */}
              <h3 className="font-serif text-[19px] sm:text-[20px] text-[#0D102B] font-normal tracking-tight">
                Recent entries
              </h3>

              {/* List or Empty State */}
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 bg-[#E7E1EF] rounded-xl" />
                  <div className="h-12 bg-[#E7E1EF] rounded-xl" />
                  <div className="h-12 bg-[#E7E1EF] rounded-xl" />
                </div>
              ) : isNoRecentEntries ? (
                <p className="font-sans text-[14px] text-[#8B8998] py-4">
                  Your written entries will appear here.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-[#E9E4E0]">
                  {DEFAULT_RECENT_ENTRIES.map((entry, idx) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      isLast={idx === DEFAULT_RECENT_ENTRIES.length - 1}
                      onClick={handleEntryClick}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 6. Bottom Navigation Bar */}
            <div className="sticky bottom-4 z-40 mt-4">
              <BottomNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </>
        )}
      </AppScreen>

      {/* Interactive Overlay Drawers */}
      <WriteDrawer
        isOpen={isWriteOpen}
        onClose={() => setIsWriteOpen(false)}
        initialTitle={writeInitialTitle}
        initialContent={writeInitialContent}
      />

      <AIReflectDrawer
        isOpen={isAiReflectOpen}
        onClose={() => setIsAiReflectOpen(false)}
      />

      <EntryDetailDrawer
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}

export default App;
