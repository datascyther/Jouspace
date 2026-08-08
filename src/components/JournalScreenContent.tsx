import React, { useEffect, useState } from 'react';
import { JournalHeader } from './JournalHeader';
import { JournalMetadata, AutosaveStatus } from './JournalMetadata';
import { JournalEditor } from './JournalEditor';
import { WritingToolbar } from './WritingToolbar';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { ThemeChipGroup, DEFAULT_THEMES, normalizeTheme } from './ThemeChipGroup';
import { readDraft, writeDraft, clearDraft } from '../utils/draft';
import type { StoredEntry } from '../store/types';

interface JournalScreenContentProps {
  /** Entry being edited; when omitted the composer is a fresh new entry. */
  editingEntry?: StoredEntry | null;
  onBackToHome: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  saveStatus?: AutosaveStatus;
  onToast?: (msg: string) => void;
  /** Called with the final entry when the user saves. */
  onSaveEntry?: (input: {
    id?: string;
    title: string;
    body: string;
    theme: string;
  }) => void;
}

export const JournalScreenContent: React.FC<JournalScreenContentProps> = ({
  editingEntry,
  onBackToHome,
  activeTab,
  onTabChange,
  saveStatus = 'autosaved',
  onToast,
  onSaveEntry,
}) => {
  const initialTheme = normalizeTheme(editingEntry?.theme ?? '') || DEFAULT_THEMES[0].id;

  // The persisted draft is restored only for brand-new entries — editing an
  // existing entry always starts from that entry's own content.
  const [title, setTitle] = useState(() =>
    editingEntry ? editingEntry.title : (readDraft()?.title ?? '')
  );
  const [body, setBody] = useState(() =>
    editingEntry ? editingEntry.content : (readDraft()?.body ?? '')
  );
  const [theme, setTheme] = useState(() =>
    editingEntry ? initialTheme : (readDraft()?.theme ?? initialTheme)
  );
  const [currentSaveStatus, setCurrentSaveStatus] =
    useState<AutosaveStatus>(saveStatus);

  // Persist the in-progress draft for new entries so a reload/relaunch never
  // loses an unsaved thought. Cleared on save or when the composer is emptied.
  useEffect(() => {
    if (editingEntry) return;
    if (!title.trim() && !body.trim()) {
      clearDraft();
      return;
    }
    writeDraft({ title, body, theme, savedAt: Date.now() });
  }, [title, body, theme, editingEntry]);

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
    onSaveEntry?.({
      id: editingEntry?.id,
      title,
      body,
      theme,
    });
    clearDraft();
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

  const now = new Date();
  const timeLabel = now.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

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

          <JournalMetadata dateLabel="Today" timeLabel={timeLabel} status={currentSaveStatus} />

          <div className="w-full border-t border-divider -mt-1 -mb-1" />

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

          {/* Theme selector — required, uses the canonical theme taxonomy */}
          <ThemeChipGroup
            selectedThemeId={theme}
            onSelectTheme={(id) => setTheme(id)}
          />
        </div>
      </div>

      {/* Pinned WritingToolbar — full width, outside scroll padding */}
      <div className="shrink-0">
        <WritingToolbar
          extrasDisabled
          onDoneClick={handleDone}
        />
      </div>

      {/* Pinned BottomNavigation */}
      <div className="shrink-0">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
};
