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
}) => {
  // Production default state content matching reference image exactly
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
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Header */}
      <JournalHeader
        onBack={onBackToHome}
        onSave={handleManualSave}
        saveState={currentSaveStatus}
      />

      {/* 2. Metadata */}
      <JournalMetadata
        dateLabel="Today"
        timeLabel="Aug 4, 2026 • 6:58 PM"
        status={currentSaveStatus}
      />

      {/* 3. Divider */}
      <div className="w-full border-t border-[#E9E4E0] -mt-1 -mb-1" />

      {/* 4. Journal Editor */}
      {isLoading ? (
        <div className="animate-pulse space-y-4 py-4">
          <div className="h-8 bg-[#E7E1EF] rounded-md w-3/4" />
          <div className="h-4 bg-[#E7E1EF] rounded-md w-full" />
          <div className="h-4 bg-[#E7E1EF] rounded-md w-5/6" />
          <div className="h-4 bg-[#E7E1EF] rounded-md w-2/3" />
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

      {/* 5. Memory Thread Card */}
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

      {/* 6. Writing Toolbar */}
      <section className="mt-2 -mx-6 w-[calc(100%+48px)]">
        <WritingToolbar
          isKeyboardOpen={isKeyboardOpen}
          onMicClick={() => onToast?.('Voice memo recorder opened')}
          onImageClick={() => onToast?.('Insert image attachment')}
          onTagClick={() => onToast?.('Tag entry with topics')}
          onAiSparkleClick={() => onToast?.('AI memory contextual assistant')}
          onDoneClick={handleDone}
        />
      </section>

      {/* 7. Bottom Navigation */}
      <div className="sticky bottom-4 z-40 mt-1">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
};
