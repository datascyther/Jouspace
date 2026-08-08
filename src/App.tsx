import React from 'react';
import { useState, useEffect, useId, useRef, type ReactNode } from 'react';
import { Shield, LifeBuoy, MessageCircle, Info as InfoIcon } from 'lucide-react';
import { AppScreen } from './components/AppScreen';
import { JouspaceHeader } from './components/JouspaceHeader';
import { MemoryLabel } from './components/MemoryLabel';
import { PrimaryCard } from './components/PrimaryCard';
import { PrimaryButton } from './components/PrimaryButton';
import { AIInsightCard } from './components/AIInsightCard';
import { EntryRow, type Entry } from './components/EntryRow';
import { BottomNavigation } from './components/BottomNavigation';
import { JournalScreenContent } from './components/JournalScreenContent';
import { MemoryScreenContent } from './components/MemoryScreenContent';
import { AIScreenContent } from './components/AIScreenContent';
import { ProfileScreenContent, type InfoSheetKind } from './components/ProfileScreenContent';
import { SplashScreen } from './components/SplashScreen';
import { SearchScreen } from './components/SearchScreen';
import { NotificationScreen } from './components/NotificationScreen';
import { MemoryThreadScreen } from './components/MemoryThreadScreen';
import { SettingsSubpage } from './components/SettingsSubpage';
import { AIContextPicker, CONTEXT_ITEMS } from './components/AIContextPicker';
import { themeLabel } from './components/ThemeChipGroup';
import { ThemeSheet } from './components/ThemeSheet';
import { InfoSheet } from './components/InfoSheet';
import { AIHistorySheet } from './components/AIHistorySheet';
import { AIReflectDrawer, EntryDetailDrawer } from './components/InteractiveDrawers';
import { useJournalStore } from './hooks/useJournalStore';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { isRuntimeConfigured } from './hooks/useJouspaceIntelligence';
import { useFocusTrap } from './hooks/useFocusTrap';
import { useProfile, deriveInitials } from './hooks/useProfile';
import { useTheme } from './hooks/useTheme';
import {
  journalStore,
  loadDemoData,
  downloadJournalExport,
  dateLabel,
} from './store';
import type { StoredEntry } from './store/types';
import { type Screen, type NavTab, readStoredNav, writeStoredNav } from './utils/nav';

type Overlay = 'search' | 'settings' | 'memory-thread' | 'notifications' | null;

const DAY_MS = 86_400_000;

/** Static content for the Profile info sheets (Privacy / Help / Feedback / About). */
const infoContent: Record<
  InfoSheetKind,
  { title: string; icon: ReactNode; body: ReactNode }
> = {
  privacy: {
    title: 'Privacy',
    icon: <Shield className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-2">
        <p>
          Your journal is stored entirely on this device (in your browser's local
          storage). Nothing is uploaded unless you configure an AI runtime URL —
          in which case the entries you send are shared with that runtime to
          generate reflections.
        </p>
        <p>
          There is no account, no cloud sync, and no server that can read your
          journal. Uninstalling the app or clearing site data removes everything.
        </p>
      </div>
    ),
  },
  help: {
    title: 'Help Center',
    icon: <LifeBuoy className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-2">
        <p>
          Write a new entry from the Home screen, explore patterns in Memory, and
          reflect with the AI tab. Change your display name from your Profile, and
          set a runtime URL in Settings to enable AI reflections.
        </p>
        <p>If something looks off, try reloading the app.</p>
      </div>
    ),
  },
  feedback: {
    title: 'Send Feedback',
    icon: <MessageCircle className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <p>
        We'd love to hear how Jouspace is working for you. This is a local-first
        preview, so there's no live inbox yet — your thoughts help shape what comes
        next. Thanks for trying it out.
      </p>
    ),
  },
  about: {
    title: 'About Jouspace',
    icon: <InfoIcon className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-2">
        <p>
          Jouspace is a quiet, local-first journal that gently builds context from
          your writing over time.
        </p>
        <p>Version 1.0 (local preview).</p>
      </div>
    ),
  },
};

export function App() {
  // Onboarding: splash auto-advances straight into the app (no auth in v1).
  const [onboardingScreen, setOnboardingScreen] = useState<'splash' | 'complete'>(
    'splash'
  );

  // Restore the last-viewed screen/tab so a reload/relaunch returns where the
  // user left off (falls back to Home on first run or if the value is invalid).
  const [currentScreen, setCurrentScreen] = useState<Screen>(
    () => readStoredNav().screen
  );
  const [activeTab, setActiveTab] = useState<NavTab>(() => readStoredNav().tab);

  // Entry editing / detail state
  const [selectedEntry, setSelectedEntry] = useState<StoredEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<StoredEntry | null>(null);
  const [threadTheme, setThreadTheme] = useState<string | null>(null);

  // Overlay screen state
  const [overlayScreen, setOverlayScreen] = useState<Overlay>(null);
  const [overlayClosing, setOverlayClosing] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartT = useRef(0);
  const sheetElRef = useRef<HTMLDivElement>(null);
  const [isContextPickerOpen, setIsContextPickerOpen] = useState(false);
  const [isAiReflectOpen, setIsAiReflectOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile + theme (persisted to localStorage)
  const { profile, setDisplayName } = useProfile();
  const { theme, setTheme } = useTheme();
  const userInitials = deriveInitials(profile.displayName);

  // Profile-sheet state (Appearance / info sheets)
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [infoKind, setInfoKind] = useState<InfoSheetKind>('about');
  const [isAiHistoryOpen, setIsAiHistoryOpen] = useState(false);

  // Persisted AI context selection (from the context picker).
  const [aiContext, setAiContext] = useState<{ id: string; label: string } | null>(
    () => {
      try {
        const raw = localStorage.getItem('jouspace:ai:context');
        if (raw) return JSON.parse(raw) as { id: string; label: string };
      } catch {
        /* ignore */
      }
      return null;
    }
  );

  const journal = useJournalStore();
  const online = useOnlineStatus();
  const runtimeConfigured = isRuntimeConfigured();
  const isEmpty = journal.entries.length === 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Surface storage failures (quota exceeded, etc.) as a toast.
  useEffect(
    () =>
      journalStore.subscribeError((err) => showToast(err.message)),
    []
  );

  // Splash screen: auto-advance after 1.5 seconds → straight to the app.
  useEffect(() => {
    if (onboardingScreen !== 'splash') return;
    const timer = setTimeout(() => setOnboardingScreen('complete'), 1500);
    return () => clearTimeout(timer);
  }, [onboardingScreen]);

  // Persist the active screen/tab so a reload/relaunch returns where you left off.
  useEffect(() => {
    writeStoredNav({ screen: currentScreen, tab: activeTab });
  }, [currentScreen, activeTab]);

  const handleSaveEntry = (input: {
    id?: string;
    title: string;
    body: string;
    theme: string;
  }) => {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title && !body) return;
    const base = editingEntry ?? undefined;
    journal.save({
      id: input.id,
      date: base?.date ?? dateLabel(),
      title: title || 'Untitled entry',
      theme: input.theme,
      content: body,
    });
    // Clear edit mode so reopening Journal starts fresh (not stuck on the
    // just-edited entry).
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: StoredEntry) => {
    setSelectedEntry(null);
    setEditingEntry(entry);
    setCurrentScreen('journal');
    setActiveTab('journal');
  };

  const handleDeleteEntry = (entry: StoredEntry) => {
    if (window.confirm('Delete this entry?')) {
      journal.remove(entry.id);
      showToast('Entry deleted');
    }
  };

  const handleEntryClick = (entry: Entry) => setSelectedEntry(entry as StoredEntry);

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setActiveTab('home');
    setEditingEntry(null);
  };

  const handleTabChange = (tab: NavTab) => {
    // Close any open overlay before switching tabs (prevents stacked/orphaned).
    setOverlayScreen(null);
    setActiveTab(tab);
    if (tab === 'home') setCurrentScreen('home');
    else if (tab === 'journal' || tab === 'write') {
      // "New entry" / center write button always opens a blank composer.
      setEditingEntry(tab === 'write' ? null : editingEntry);
      setCurrentScreen('journal');
    } else if (tab === 'memory') setCurrentScreen('memory');
    else if (tab === 'ai') setCurrentScreen('ai');
  };

  const handleOpenProfile = () => {
    setCurrentScreen('profile');
  };

  const handleOpenInfo = (kind: InfoSheetKind) => {
    setInfoKind(kind);
    setIsInfoSheetOpen(true);
  };

  const handleSelectContext = (id: string) => {
    const item = CONTEXT_ITEMS.find((c) => c.id === id);
    if (!item) return;
    const next = { id: item.id, label: item.label };
    setAiContext(next);
    try {
      localStorage.setItem('jouspace:ai:context', JSON.stringify(next));
    } catch {
      /* ignore storage failure */
    }
    setIsContextPickerOpen(false);
  };

  const handleReflectWithAI = () => setIsAiReflectOpen(true);

  const handleExploreThread = (themeId: string) => {
    setThreadTheme(themeId);
    setOverlayScreen('memory-thread');
  };

  const handleCloseOverlay = () => {
    if (overlayClosing) return;
    setOverlayClosing(true); // sheet switches to animate-slideDown
  };

  const handleOverlayExited = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // ignore child animations
    if (e.animationName !== 'slideDown') return; // only act on close
    if (overlayClosing) {
      setOverlayScreen(null);
      setOverlayClosing(false);
    }
  };

  // Drag-to-dismiss: grabber-only, 1:1 finger tracking, flick/threshold to close.
  const onGrabPointerDown = (e: React.PointerEvent) => {
    if (overlayClosing) return;
    dragStartY.current = e.clientY;
    dragStartT.current = Date.now();
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onGrabPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - dragStartY.current)); // downward only
  };
  const onGrabPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const dy = dragY ?? 0;
    const dt = Math.max(1, Date.now() - dragStartT.current);
    const velocity = dy / dt; // px/ms
    if (dy > 120 || velocity > 0.6) {
      setDragY(null);
      setOverlayClosing(true); // release past threshold -> slide down & close
    } else {
      setDragY(null); // release early -> transition snaps back to 0
    }
  };

  const goToEntry = (id: string) => {
    const entry = journal.get(id);
    if (entry) {
      setSelectedEntry(entry);
      setOverlayScreen(null);
    }
  };

  // ── Focus trap + Escape for the single App-level overlay modal ──────────────
  const overlayId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap({
    id: overlayId,
    active: overlayScreen !== null,
    onClose: handleCloseOverlay,
    containerRef: overlayRef,
  });

  // First-run days-since-last-entry (real data), newest entry first.
  const lastWroteDays = isEmpty
    ? null
    : Math.floor((Date.now() - journal.entries[0].updatedAt) / DAY_MS);

  const threadEntries = (
    threadTheme
      ? journal.entries.filter((e) => e.theme === threadTheme)
      : journal.entries
  ).map((e) => ({
    id: e.id,
    date: e.date,
    excerpt: e.content || e.title,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start md:pt-3 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-[60] bg-primaryText text-background text-xs font-sans px-4 py-2 rounded-full shadow-lg transition-all animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Onboarding: Splash → App */}
      {onboardingScreen === 'splash' ? (
        <SplashScreen />
      ) : (
        <AppScreen isOffline={!online}>
          {currentScreen === 'ai' ? (
            <AIScreenContent
              activeTab="ai"
              onTabChange={handleTabChange}
              isNoMemoryContext={!runtimeConfigured}
              userInitials={userInitials}
              contextLabel={aiContext?.label ?? null}
              entries={journal.entries}
              onAvatarClick={handleOpenProfile}
              onOpenHistory={() => setIsAiHistoryOpen(true)}
              onOpenContextPicker={() => setIsContextPickerOpen(true)}
              onOpenEntry={goToEntry}
            />
          ) : currentScreen === 'memory' ? (
            <MemoryScreenContent
              activeTab="memory"
              onTabChange={handleTabChange}
              entries={journal.entries}
              isNoMemories={isEmpty}
              onEntryClick={handleEntryClick}
              onExploreThread={handleExploreThread}
              onReflectWithAi={handleReflectWithAI}
              onOpenSearch={() => setOverlayScreen('search')}
              onAvatarClick={handleOpenProfile}
            />
          ) : currentScreen === 'journal' ? (
            <JournalScreenContent
              key={editingEntry?.id ?? 'new'}
              editingEntry={editingEntry}
              onBackToHome={handleBackToHome}
              activeTab={activeTab === 'write' ? 'journal' : activeTab}
              onTabChange={handleTabChange}
              onToast={showToast}
              onSaveEntry={handleSaveEntry}
            />
          ) : currentScreen === 'profile' ? (
            <ProfileScreenContent
              activeTab={activeTab}
              onTabChange={handleTabChange}
              userInitials={userInitials}
              displayName={profile.displayName}
              email=""
              joinedDate={profile.joinedDate}
              entryCount={journal.entries.length}
              isEmptyJournal={isEmpty}
              isOffline={!online}
              onSave={setDisplayName}
              onOpenNotifications={() => setOverlayScreen('notifications')}
              onOpenAppearance={() => setIsThemeSheetOpen(true)}
              onOpenInfo={handleOpenInfo}
              onExport={downloadJournalExport}
            />
          ) : (
            /* HOME SCREEN VIEW */
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
                <div className="flex flex-col gap-7 w-full">
                  <JouspaceHeader
                    userInitials={userInitials}
                    hasNotifications={false}
                    onNotificationClick={() => setOverlayScreen('notifications')}
                    onAvatarClick={handleOpenProfile}
                    onSettingsClick={() => setOverlayScreen('settings')}
                  />

                  <section className="flex flex-col gap-1 text-left mt-2 mb-1">
                    <h1 className="font-serif text-[30px] text-primaryText font-normal leading-tight tracking-tight">
                      {isEmpty ? 'Welcome to Jouspace' : 'Good to see you'}
                    </h1>
                    <p className="font-sans text-[14px] text-muted font-normal tracking-normal">
                      {isEmpty
                        ? 'No entries recorded yet.'
                        : lastWroteDays !== null
                          ? lastWroteDays <= 0
                            ? 'You wrote earlier today.'
                            : `Last wrote ${lastWroteDays} day${lastWroteDays === 1 ? '' : 's'} ago.`
                          : 'Keep your journal going.'}
                    </p>
                  </section>

                  <section>
                    <PrimaryCard className="flex flex-col gap-4">
                      <MemoryLabel text="Memory-guided" />
                      <h2 className="font-serif text-[22px] text-primaryText font-normal leading-snug">
                        {isEmpty ? 'Begin your journal' : 'Continue your journal'}
                      </h2>
                      <p className="font-sans text-[14.5px] leading-[1.55] text-secondaryText font-normal">
                        {isEmpty
                          ? 'Write down what is on your mind today. Your journal quietly builds context over time.'
                          : 'Pick up where you left off, or start something new whenever the moment arrives.'}
                      </p>
                      <div className="pt-2">
                        <PrimaryButton onClick={() => handleTabChange('write')}>
                          New entry
                        </PrimaryButton>
                      </div>
                    </PrimaryCard>
                  </section>

                  <section>
                    {runtimeConfigured ? (
                      <AIInsightCard
                        insightText="Your reflections are ready when you are — open the AI tab to look back together."
                        label="Jouspace noticed"
                        onReflect={handleReflectWithAI}
                      />
                    ) : (
                      <PrimaryCard className="flex flex-col gap-3">
                        <MemoryLabel text="Jouspace noticed" />
                        <p className="font-serif text-[17px] leading-relaxed text-secondaryText">
                          Set a runtime URL in Settings to enable AI reflections.
                        </p>
                      </PrimaryCard>
                    )}
                  </section>

                  <section className="flex flex-col gap-3 mt-1">
                    <h3 className="font-serif text-[19px] text-primaryText font-normal tracking-tight">
                      Recent entries
                    </h3>
                    {isEmpty ? (
                      <p className="font-sans text-[14px] text-muted py-4">
                        Your written entries will appear here.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y divide-divider">
                        {journal.entries.map((entry, idx) => (
                          <EntryRow
                            key={entry.id}
                            entry={entry as Entry}
                            isLast={idx === journal.entries.length - 1}
                            onClick={handleEntryClick}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>

              <div className="shrink-0">
                <BottomNavigation
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>
            </div>
          )}
        </AppScreen>
      )}

      {/* Overlay Screens — bottom-anchored sheets that slide up from the bottom */}
      {overlayScreen && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={String(overlayScreen)}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          {/* Backdrop — fades in on open, fades out on close */}
          <div
            className={`absolute inset-0 bg-primaryText/40 transition-opacity duration-300 ${
              overlayClosing ? 'opacity-0' : 'animate-fadeIn'
            }`}
            onClick={handleCloseOverlay}
          />

          {/* Sheet — full height, bottom-anchored, slides from bottom.
              Drag transform (inline style) overrides during drag for 1:1 tracking. */}
          <div
            ref={sheetElRef}
            onAnimationEnd={handleOverlayExited}
            className={`relative z-10 flex flex-col w-full max-w-[430px] h-full bg-background will-change-transform ${
              overlayClosing ? 'animate-slideDown' : 'animate-slideUp'
            } ${dragging ? 'transition-none' : 'transition-transform duration-200 ease-out'}`}
            style={dragY != null ? { transform: `translateY(${dragY}px)` } : undefined}
          >
            {/* Grabber handle — the ONLY drag target (keeps list scroll intact) */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
              onPointerDown={onGrabPointerDown}
              onPointerMove={onGrabPointerMove}
              onPointerUp={onGrabPointerUp}
              aria-hidden="true"
            >
              <span className="w-9 h-1 rounded-full bg-border" />
            </div>

            {overlayScreen === 'search' && (
              <SearchScreen
                entries={journal.entries}
                onBack={handleCloseOverlay}
                onResultClick={goToEntry}
              />
            )}
            {overlayScreen === 'notifications' && (
              <NotificationScreen onBack={handleCloseOverlay} />
            )}
            {overlayScreen === 'memory-thread' && (
              <MemoryThreadScreen
                title={threadTheme ? themeLabel(threadTheme) : 'Your memories'}
                entries={threadEntries}
                onBack={handleCloseOverlay}
                onReflectWithAI={handleReflectWithAI}
              />
            )}
            {overlayScreen === 'settings' && (
              <SettingsSubpage
                onBack={handleCloseOverlay}
                onExport={downloadJournalExport}
                onLoadDemo={() => {
                  loadDemoData();
                  showToast('Sample data loaded');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* AI Context Picker Modal */}
      <AIContextPicker
        isOpen={isContextPickerOpen}
        onClose={() => setIsContextPickerOpen(false)}
        onSelectContext={handleSelectContext}
        activeId={aiContext?.id ?? null}
      />

      {/* Profile: Appearance (theme) sheet */}
      <ThemeSheet
        isOpen={isThemeSheetOpen}
        onClose={() => setIsThemeSheetOpen(false)}
        theme={theme}
        onSelect={(t) => {
          setTheme(t);
          setIsThemeSheetOpen(false);
        }}
      />

      {/* Profile: info sheets (Privacy / Help / Feedback / About) */}
      <InfoSheet
        isOpen={isInfoSheetOpen}
        onClose={() => setIsInfoSheetOpen(false)}
        title={infoContent[infoKind].title}
        icon={infoContent[infoKind].icon}
      >
        {infoContent[infoKind].body}
      </InfoSheet>

      {/* AI: reflection history sheet */}
      <AIHistorySheet
        isOpen={isAiHistoryOpen}
        onClose={() => setIsAiHistoryOpen(false)}
      />

      {/* Interactive Overlay Drawers */}
      <AIReflectDrawer
        isOpen={isAiReflectOpen}
        onClose={() => setIsAiReflectOpen(false)}
      />

      <EntryDetailDrawer
        entry={selectedEntry as Entry | null}
        onClose={() => setSelectedEntry(null)}
        onEdit={selectedEntry ? () => handleEditEntry(selectedEntry) : undefined}
        onDelete={
          selectedEntry ? () => handleDeleteEntry(selectedEntry) : undefined
        }
      />
    </div>
  );
}

export default App;
