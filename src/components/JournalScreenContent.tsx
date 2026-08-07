import React, { useState } from 'react';
import { JournalHeader } from './JournalHeader';
import { JournalMetadata, AutosaveStatus } from './JournalMetadata';
import { JournalEditor } from './JournalEditor';
import { MemoryThreadCard } from './MemoryThreadCard';
import { WritingToolbar } from './WritingToolbar';
import { BottomNavigation, NavTab } from './BottomNavigation';

interface JournalScreenContentProps {
  onBackToHome: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  saveStatus?: AutosaveStatus;
  isLoading?: boolean;
  isEmptyEntry?: boolean;
  isKeyboardOpen?: boolean;
  onToast?: (msg: string) => void;
  /** Called with the final title/body when the user saves — persists the entry */
  onSaveEntry?: (input: { title: string; body: string }) => void;
}

export const JournalScreenContent: React.FC<JournalScreenContentProps> = ({
  onBackToHome,
  activeTab,
  onTabChange,
  saveStatus = 'autosaved',
  isLoading = false,
  isEmptyEntry = false,
  isKeyboardOpen = false,
  onToast,
  onSaveEntry,
}) => {
  const defaultTitle = isEmptyEntry ? '' : "What I'm trying to understand";
  const defaultBody = isEmptyEntry
    ? ''
    : `I keep returning to the same thought:\n\nI don't need a louder system.\n\nI need a quieter place that remembers what matters.`;

  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [currentSaveStatus, setCurrentSaveStatus] = useState<AutosaveStatus>(saveStatus);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (currentSaveStatus !== 'editing') {
      setCurrentSaveStatus('editing');
      setTimeout(() => setCurrentSaveStatus('autosaving'), 1000);
      setTimeout(() => setCurrentSaveStatus('autosaved'), 2200);
    }
  };

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    if (currentSaveStatus !== 'editing') {
      setCurrentSaveStatus('editing');
      setTimeout(() => setCurrentSaveStatus('autosaving'), 1000);
      setTimeout(() => setCurrentSaveStatus('autosaved'), 2200);
    }
  };

  const handleManualSave = () => {
    // Persist the entry to the on-device store before showing the saved state.
    onSaveEntry?.({ title, body });
    setCurrentSaveStatus('autosaving');
    setTimeout(() => {
      setCurrentSaveStatus('saved');
      onToast?.('Journal entry saved');
    }, 800);
  };

  const handleDone = () => {
    handleManualSave();
    setTimeout(() => {
      onBackToHome();
    }, 400);
  };

  const handleUseThread = () => {
    setBody(
      (prev) =>
        prev +
        `\n\n✦ Connected with memory thread: Building Jouspace with less noise and more clarity.`
    );
    onToast?.('Memory thread inserted into entry');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <JournalHeader
            onBack={onBackToHome}
            onSave={handleManualSave}
            saveState={currentSaveStatus}
          />

          <JournalMetadata
            dateLabel="Today"
            timeLabel="Aug 4, 2026 • 6:58 PM"
            status={currentSaveStatus}
          />

          <div className="w-full border-t border-divider -mt-1 -mb-1" />

          {isLoading ? (
            <div className="animate-pulse space-y-4 py-4">
              <div className="h-8 bg-border rounded-md w-3/4" />
              <div className="h-4 bg-border rounded-md w-full" />
              <div className="h-4 bg-border rounded-md w-5/6" />
              <div className="h-4 bg-border rounded-md w-2/3" />
            </div>
          ) : (
            <JournalEditor
              title={title}
              onTitleChange={handleTitleChange}
              body={body}
              onBodyChange={handleBodyChange}
              onFocus={() => {
                if (currentSaveStatus === 'autosaved') {
                  setCurrentSaveStatus('editing');
                }
              }}
            />
          )}

          {!isLoading && (
            <section className="mt-2">
              <MemoryThreadCard
                label="Memory thread"
                bodyText="You've written about building Jouspace with less noise and more clarity several times this week."
                actionText="Use this thread"
                onUseThread={handleUseThread}
              />
            </section>
          )}
        </div>
      </div>

      {/* Pinned WritingToolbar — full width, outside scroll padding */}
      <div className="shrink-0">
        <WritingToolbar
          isKeyboardOpen={isKeyboardOpen}
          onMicClick={() => onToast?.('Voice memo recorder opened')}
          onImageClick={() => onToast?.('Insert image attachment')}
          onTagClick={() => onToast?.('Tag entry with topics')}
          onAiSparkleClick={() => onToast?.('AI memory contextual assistant')}
          onDoneClick={handleDone}
        />
      </div>

      {/* Pinned BottomNavigation */}
      <div className="shrink-0 mx-2 pb-2 pb-safe">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
};
