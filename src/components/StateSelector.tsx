import React from 'react';

export type ScreenView = 'home' | 'journal' | 'memory' | 'ai' | 'profile' | 'search' | 'notifications' | 'entry-detail' | 'memory-thread' | 'settings' | 'signin' | 'create-account' | 'forgot-password' | 'email-verification';

export type AppStateMode =
  | 'returning_user'
  | 'editing'
  | 'autosaving'
  | 'saved'
  | 'save_failed'
  | 'keyboard_open'
  | 'keyboard_closed'
  | 'empty_entry'
  | 'existing_entry'
  | 'loading'
  | 'empty_journal'
  | 'no_ai_insight'
  | 'no_recent_entries'
  | 'no_memories'
  | 'no_connected_entries'
  | 'search_active'
  | 'thinking'
  | 'streaming'
  | 'no_memory_context'
  | 'no_conversation'
  | 'composer_focused'
  | 'offline'
  | 'no_avatar'
  | 'empty_journal_profile'
  | 'signed_out';

interface StateSelectorProps {
  currentScreen: ScreenView;
  onSelectScreen: (screen: ScreenView) => void;
  currentMode: AppStateMode;
  onSelectMode: (mode: AppStateMode) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  currentScreen,
  onSelectScreen,
  currentMode,
  onSelectMode,
  isOpen,
  onToggleOpen,
}) => {
  const modes: { id: AppStateMode; label: string; forScreen?: ScreenView }[] = [
    { id: 'returning_user', label: 'Home Default', forScreen: 'home' },
    { id: 'existing_entry', label: 'Journal Default', forScreen: 'journal' },
    { id: 'returning_user', label: 'Memory Default', forScreen: 'memory' },
    { id: 'search_active', label: 'Search Active', forScreen: 'memory' },
    { id: 'no_memories', label: 'No Memories Yet', forScreen: 'memory' },
    { id: 'no_connected_entries', label: 'No Connected Entries', forScreen: 'memory' },
    { id: 'returning_user', label: 'AI Default', forScreen: 'ai' },
    { id: 'thinking', label: 'AI Thinking', forScreen: 'ai' },
    { id: 'streaming', label: 'Streaming Response', forScreen: 'ai' },
    { id: 'no_memory_context', label: 'No Memory Context', forScreen: 'ai' },
    { id: 'no_conversation', label: 'No Conversation', forScreen: 'ai' },
    { id: 'composer_focused', label: 'Composer Focused', forScreen: 'ai' },
    { id: 'returning_user', label: 'Profile Default', forScreen: 'profile' },
    { id: 'no_avatar', label: 'No Avatar', forScreen: 'profile' },
    { id: 'empty_journal_profile', label: 'Empty Journal', forScreen: 'profile' },
    { id: 'offline', label: 'Profile Offline', forScreen: 'profile' },
    { id: 'signed_out', label: 'Signed Out', forScreen: 'profile' },
    { id: 'editing', label: 'Editing State', forScreen: 'journal' },
    { id: 'autosaving', label: 'Autosaving State', forScreen: 'journal' },
    { id: 'saved', label: 'Saved State', forScreen: 'journal' },
    { id: 'save_failed', label: 'Save Failed', forScreen: 'journal' },
    { id: 'keyboard_open', label: 'Keyboard Open', forScreen: 'journal' },
    { id: 'empty_entry', label: 'Empty Entry', forScreen: 'journal' },
    { id: 'empty_journal', label: 'Empty Journal', forScreen: 'home' },
    { id: 'loading', label: 'Loading State' },
    { id: 'no_ai_insight', label: 'No AI Insight', forScreen: 'home' },
    { id: 'offline', label: 'Offline Mode' },
  ];

  return (
    <div className="w-full max-w-xl mb-3 z-30 px-4">
      <div className="bg-surface border border-border rounded-[20px] p-2.5 shadow-sm text-xs font-sans">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Active Screen Tab Switcher */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-[14px] border border-border">
            <button
              type="button"
              onClick={() => onSelectScreen('home')}
              className={`px-3 py-1 rounded-[10px] font-medium transition-all ${
                currentScreen === 'home'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onSelectScreen('journal')}
              className={`px-3 py-1 rounded-[10px] font-medium transition-all ${
                currentScreen === 'journal'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Journal
            </button>
            <button
              type="button"
              onClick={() => onSelectScreen('memory')}
              className={`px-3 py-1 rounded-[10px] font-medium transition-all ${
                currentScreen === 'memory'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Memory
            </button>
            <button
              type="button"
              onClick={() => onSelectScreen('ai')}
              className={`px-3 py-1 rounded-[10px] font-medium transition-all ${
                currentScreen === 'ai'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              AI
            </button>
            <button
              type="button"
              onClick={() => onSelectScreen('profile')}
              className={`px-3 py-1 rounded-[10px] font-medium transition-all ${
                currentScreen === 'profile'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Profile
            </button>
          </div>

          {/* Overlay Screen Tabs */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-[14px] border border-border">
            {(['search', 'notifications', 'entry-detail', 'memory-thread', 'settings', 'signin'] as ScreenView[]).map((screen) => (
              <button
                key={screen}
                type="button"
                onClick={() => onSelectScreen(screen)}
                className={`px-2.5 py-1 rounded-[10px] font-medium text-[11px] transition-all ${
                  currentScreen === screen
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                {screen === 'entry-detail' ? 'Entry' : screen === 'memory-thread' ? 'Thread' : screen === 'signin' ? 'Sign In' : screen.charAt(0).toUpperCase() + screen.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-medium text-primaryText">State:</span>
            <span className="text-accent font-semibold capitalize">
              {currentMode.replace(/_/g, ' ')}
            </span>

            <button
              type="button"
              onClick={onToggleOpen}
              className="text-accent hover:underline font-medium px-2 py-1 rounded cursor-pointer ml-1"
            >
              {isOpen ? 'Close QA Bar' : 'Switch State'}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2.5 pt-2.5 border-t border-divider">
            {modes.map((m, idx) => (
              <button
                key={`${m.id}-${idx}`}
                type="button"
                onClick={() => {
                  if (m.forScreen) {
                    onSelectScreen(m.forScreen);
                  }
                  onSelectMode(m.id);
                  onToggleOpen();
                }}
                className={`px-2.5 py-1.5 rounded-[10px] text-left transition-all text-[11px] font-sans ${
                  currentMode === m.id
                    ? 'bg-accent text-white font-medium shadow-xs'
                    : 'bg-background text-secondaryText hover:bg-accentSoft hover:text-primaryText'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
