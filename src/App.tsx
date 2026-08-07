import { useState, useEffect } from 'react';
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
import { ProfileScreenContent } from './components/ProfileScreenContent';
import { AutosaveStatus } from './components/JournalMetadata';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SignInScreen } from './components/SignInScreen';
import { CreateAccountScreen } from './components/CreateAccountScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { EmailVerificationScreen } from './components/EmailVerificationScreen';
import { SearchScreen } from './components/SearchScreen';
import { NotificationScreen } from './components/NotificationScreen';
import { EntryDetailScreen } from './components/EntryDetailScreen';
import { MemoryThreadScreen } from './components/MemoryThreadScreen';
import { SettingsSubpage } from './components/SettingsSubpage';
import { AIContextPicker } from './components/AIContextPicker';
import {
  WriteDrawer,
  AIReflectDrawer,
  EntryDetailDrawer,
} from './components/InteractiveDrawers';
import {
  DEFAULT_USER,
  DEFAULT_CONTINUE_PROMPT,
  DEFAULT_AI_INSIGHT,
  DEFAULT_PROFILE,
} from './mockData';
import { useJournalStore } from './hooks/useJournalStore';
import { dateLabel } from './store';

type OnboardingScreen = 'splash' | 'welcome' | 'complete';

export function App() {
  // Onboarding state: splash → welcome → complete
  const [onboardingScreen, setOnboardingScreen] = useState<OnboardingScreen>('splash');

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

  // Overlay screen state (auth, search, notifications, etc.)
  const [overlayScreen, setOverlayScreen] = useState<string | null>(null);
  const [isContextPickerOpen, setIsContextPickerOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Live, persisted journal entries (local-first; cloud sync later)
  const journal = useJournalStore();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Splash screen: auto-advance after 1.5 seconds
  useEffect(() => {
    if (onboardingScreen === 'splash') {
      const timer = setTimeout(() => {
        setOnboardingScreen('welcome');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingScreen]);

  const handleContinueWriting = () => {
    setCurrentScreen('journal');
    setActiveTab('journal');
  };

  const handleNewEntry = () => {
    setCurrentScreen('journal');
    setActiveTab('journal');
  };

  // Persist a newly written entry to the on-device journal store.
  const handleSaveEntry = (input: { title: string; body: string }) => {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title && !body) return;
    journal.save({
      date: dateLabel(),
      title: title || 'Untitled entry',
      theme: 'thought',
      content: body,
    });
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

  const handleOpenProfile = () => {
    setCurrentScreen('profile');
  };

  // Welcome screen "Start writing" → Create Account

  const handleAlreadyHaveAccount = () => {
    setOverlayScreen('auth-signin');
    setAuthError(null);
  };

  // Welcome screen "Start writing" → Create Account
  const handleStartWritingWelcome = () => {
    setOverlayScreen('auth-create');
    setAuthError(null);
  };

  // Guest mode: bypass auth and go directly to journal
  const handleContinueAsGuest = () => {
    setOnboardingScreen('complete');
    setCurrentScreen('journal');
    setActiveTab('journal');
  };

  // Overlay screen handlers

  const handleOpenSignIn = () => { setOverlayScreen('auth-signin'); setAuthError(null); };
  const handleOpenCreateAccount = () => { setOverlayScreen('auth-create'); setAuthError(null); };
  const handleOpenForgotPassword = () => { setOverlayScreen('auth-forgot'); setAuthError(null); };

  const handleCloseOverlay = () => { setOverlayScreen(null); setAuthError(null); };
  const handleContextPickerClose = () => setIsContextPickerOpen(false);

  // Auth handlers (simulated)
  const handleSignIn = () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      setOverlayScreen(null);
      setOnboardingScreen('complete');
      setCurrentScreen('home');
      setActiveTab('home');
    }, 1500);
  };

  const handleCreateAccount = () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      setOverlayScreen('auth-verify');
    }, 1500);
  };

  const handleResetPassword = () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      showToast('Reset link sent to your email');
      setOverlayScreen(null);
    }, 1500);
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
  // NOTE: isKeyboardOpen is a QA demo toggle (StateSelector), not real device
  // keyboard detection. Real keyboard-aware layout is a future task — see HIGH-07.
  const isKeyboardOpen = stateMode === 'keyboard_open';
  const isEmptyEntry = stateMode === 'empty_entry';
  const isThinking = stateMode === 'thinking';
  const isStreaming = stateMode === 'streaming';
  const isNoMemoryContext = stateMode === 'no_memory_context';
  const isNoConversation = stateMode === 'no_conversation';
  const isComposerFocused = stateMode === 'composer_focused';

  // Profile screen state flags
  const isNoAvatar = stateMode === 'no_avatar';
  const isEmptyJournalProfile = stateMode === 'empty_journal_profile';
  const isSignedOut = stateMode === 'signed_out';

  const getSaveStatus = (): AutosaveStatus => {
    if (stateMode === 'autosaving') return 'autosaving';
    if (stateMode === 'saved') return 'saved';
    if (stateMode === 'save_failed') return 'failed';
    if (stateMode === 'editing') return 'editing';
    return 'autosaved';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start md:pt-3 md:pb-8">
      {/* QA Screen & State Switcher Toolbar */}
      <StateSelector
        currentScreen={currentScreen}
        onSelectScreen={(scr) => {
          // Handle overlay screens
          if (scr === 'search') { setOverlayScreen('search'); return; }
          if (scr === 'notifications') { setOverlayScreen('notifications'); return; }
          if (scr === 'entry-detail') { setOverlayScreen('entry-detail'); return; }
          if (scr === 'memory-thread') { setOverlayScreen('memory-thread'); return; }
          if (scr === 'settings') { setOverlayScreen('settings'); return; }
          if (scr === 'signin') { setOverlayScreen('auth-signin'); return; }
          if (scr === 'create-account') { setOverlayScreen('auth-create'); return; }
          if (scr === 'forgot-password') { setOverlayScreen('auth-forgot'); return; }
          if (scr === 'email-verification') { setOverlayScreen('auth-verify'); return; }
          setOverlayScreen(null);
          setCurrentScreen(scr);
          // Profile is not a NavTab, so only set activeTab for navigation tabs
          if (scr !== 'profile') {
            setActiveTab(scr);
          }
        }}
        currentMode={stateMode}
        onSelectMode={setStateMode}
        isOpen={isQaBarOpen}
        onToggleOpen={() => setIsQaBarOpen(!isQaBarOpen)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 bg-primaryText text-white text-xs font-sans px-4 py-2 rounded-full shadow-lg transition-all animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Onboarding Screens: Splash → Welcome → Main App */}
      {onboardingScreen === 'splash' ? (
        <SplashScreen />
      ) : onboardingScreen === 'welcome' ? (
        <WelcomeScreen
          onStartWriting={handleStartWritingWelcome}
          onAlreadyHaveAccount={handleAlreadyHaveAccount}
          onContinueAsGuest={handleContinueAsGuest}
        />
      ) : (
        /* Main App Screen Layout */
        <AppScreen
          isOffline={isOffline}
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
            onSaveEntry={handleSaveEntry}
          />
        ) : currentScreen === 'profile' ? (
          /* PROFILE SCREEN VIEW */
          <ProfileScreenContent
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userInitials={DEFAULT_PROFILE.initials}
            displayName={DEFAULT_PROFILE.displayName}
            email={DEFAULT_PROFILE.email}
            joinedDate={DEFAULT_PROFILE.joinedDate}
            avatarUrl={DEFAULT_PROFILE.avatarUrl}
            entryCount={journal.entries.length}
            topThemes={DEFAULT_PROFILE.topThemes}
            isLoading={isLoading}
            isNoAvatar={isNoAvatar}
            isOffline={isOffline}
            isEmptyJournal={isEmptyJournalProfile}
            isSignedOut={isSignedOut}
            onToast={showToast}
          />
        ) : (
          /* HOME SCREEN VIEW */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
              <div className="flex flex-col gap-7 w-full">
                <JouspaceHeader
                  userInitials={DEFAULT_USER.initials}
                  hasNotifications={false}
                  onNotificationClick={() => showToast('Notifications (Quiet Mode)')}
                  onAvatarClick={handleOpenProfile}
                />

                <section className="flex flex-col gap-1 text-left mt-2 mb-1">
                  {isLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-border rounded-md w-3/4" />
                      <div className="h-4 bg-border rounded-md w-1/3" />
                    </div>
                  ) : (
                    <>
                      <h1 className="font-serif text-[30px] text-primaryText font-normal leading-tight tracking-tight">
                        {isEmptyJournal
                          ? `Welcome, ${DEFAULT_USER.name}`
                          : `Good afternoon, ${DEFAULT_USER.name}`}
                      </h1>
                      <p className="font-sans text-[14px] text-muted font-normal tracking-normal">
                        {isEmptyJournal
                          ? 'No entries recorded yet.'
                          : `Last wrote ${DEFAULT_USER.lastWroteDaysAgo} days ago.`}
                      </p>
                    </>
                  )}
                </section>

                <section>
                  {isLoading ? (
                    <div className="bg-surface rounded-3xl border border-border p-6 animate-pulse space-y-4">
                      <div className="h-4 bg-border rounded w-1/3" />
                      <div className="h-6 bg-border rounded w-2/3" />
                      <div className="h-12 bg-border rounded w-full" />
                      <div className="h-10 bg-border rounded w-1/2" />
                    </div>
                  ) : isEmptyJournal ? (
                    <PrimaryCard className="flex flex-col gap-4">
                      <MemoryLabel text="Memory-guided" />
                      <h2 className="font-serif text-[22px] text-primaryText font-normal leading-snug">
                        Begin your journal
                      </h2>
                      <p className="font-sans text-[14.5px] leading-[1.55] text-secondaryText font-normal">
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
                      <MemoryLabel text="Memory-guided" />
                      <h2 className="font-serif text-[22px] text-primaryText font-normal leading-snug tracking-tight">
                        Continue your journal
                      </h2>
                      <p className="font-sans text-[14.5px] leading-[1.55] text-secondaryText font-normal">
                        {DEFAULT_CONTINUE_PROMPT.topicSummaryLines[0]}
                        <br />
                        {DEFAULT_CONTINUE_PROMPT.topicSummaryLines[1]}
                        <br />
                        {DEFAULT_CONTINUE_PROMPT.topicSummaryLines[2]}
                      </p>
                      <div className="flex items-center gap-6 pt-2">
                        <PrimaryButton onClick={handleContinueWriting}>
                          Continue writing
                        </PrimaryButton>
                        <TextAction onClick={handleNewEntry}>New entry</TextAction>
                      </div>
                    </PrimaryCard>
                  )}
                </section>

                <section>
                  {isLoading ? (
                    <div className="bg-surface rounded-3xl border border-border p-6 animate-pulse space-y-3">
                      <div className="h-4 bg-border rounded w-1/4" />
                      <div className="h-10 bg-border rounded w-full" />
                      <div className="h-4 bg-border rounded w-1/3 ml-auto" />
                    </div>
                  ) : isNoAiInsight ? (
                    <PrimaryCard className="flex flex-col gap-3">
                      <MemoryLabel text="Jouspace noticed" />
                      <p className="font-serif text-[17px] leading-relaxed text-secondaryText">
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

                <section className="flex flex-col gap-3 mt-1">
                  <h3 className="font-serif text-[19px] text-primaryText font-normal tracking-tight">
                    Recent entries
                  </h3>
                  {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-12 bg-border rounded-xl" />
                      <div className="h-12 bg-border rounded-xl" />
                      <div className="h-12 bg-border rounded-xl" />
                    </div>
                  ) : isNoRecentEntries ? (
                    <p className="font-sans text-[14px] text-muted py-4">
                      Your written entries will appear here.
                    </p>
                  ) : (
                    <div className="flex flex-col divide-y divide-divider">
                      {journal.entries.map((entry, idx) => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          isLast={idx === journal.entries.length - 1}
                          onClick={handleEntryClick}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="shrink-0 mx-2 pb-2 pb-safe">
              <BottomNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </div>
        )}
      </AppScreen>
      )}

      {/* Overlay Screens (rendered as fixed-position modals when active) */}
      {overlayScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-primaryText/40 animate-fadeIn"
            onClick={handleCloseOverlay}
          />
          {/* Overlay Content */}
          <div className="relative z-10 w-full max-w-[430px] mx-auto animate-slideUp">
            {overlayScreen === 'auth-signin' && (
              <SignInScreen
                onSignIn={handleSignIn}
                onCreateAccount={handleOpenCreateAccount}
                onForgotPassword={handleOpenForgotPassword}
                isLoading={isAuthLoading}
                error={authError}
                onClose={handleCloseOverlay}
              />
            )}
            {overlayScreen === 'auth-create' && (
              <CreateAccountScreen
                onCreateAccount={handleCreateAccount}
                onSignIn={handleOpenSignIn}
                isLoading={isAuthLoading}
                error={authError}
                onClose={handleCloseOverlay}
              />
            )}
            {overlayScreen === 'auth-forgot' && (
              <ForgotPasswordScreen
                onResetPassword={handleResetPassword}
                onBackToSignIn={handleOpenSignIn}
                isLoading={isAuthLoading}
                error={authError}
                onClose={handleCloseOverlay}
              />
            )}
            {overlayScreen === 'auth-verify' && (
              <EmailVerificationScreen
                onResendEmail={handleResetPassword}
                onBackToSignIn={handleOpenSignIn}
                email="user@example.com"
                isLoading={isAuthLoading}
                onClose={handleCloseOverlay}
              />
            )}
            {overlayScreen === 'search' && (
              <SearchScreen onBack={handleCloseOverlay} />
            )}
            {overlayScreen === 'notifications' && (
              <NotificationScreen onBack={handleCloseOverlay} />
            )}
            {overlayScreen === 'entry-detail' && (
              <EntryDetailScreen onBack={handleCloseOverlay} />
            )}
            {overlayScreen === 'memory-thread' && (
              <MemoryThreadScreen onBack={handleCloseOverlay} onReflectWithAI={handleReflectWithAI} />
            )}
            {overlayScreen === 'settings' && (
              <SettingsSubpage onBack={handleCloseOverlay} />
            )}
          </div>
        </div>
      )}

      {/* AI Context Picker Modal */}
      <AIContextPicker
        isOpen={isContextPickerOpen}
        onClose={handleContextPickerClose}
      />

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
