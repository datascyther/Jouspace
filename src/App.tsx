import React from 'react';
import { useState, useEffect, useLayoutEffect, useId, useRef, useCallback, type ReactNode } from 'react';
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
import { Presence } from './components/Presence';
import { MemoryScreenContent } from './components/MemoryScreenContent';
import { AIScreenContent } from './components/AIScreenContent';
import { ProfileScreenContent, type InfoSheetKind } from './components/ProfileScreenContent';
import { SplashScreen } from './components/SplashScreen';
import { PermissionPrimerScreen } from './components/PermissionPrimerScreen';
import { AuthScreen } from './components/AuthScreen';
import { SearchScreen } from './components/SearchScreen';
import { NotificationScreen } from './components/NotificationScreen';
import { NotificationSettingsSheet } from './components/NotificationSettingsSheet';
import { MemoryThreadScreen } from './components/MemoryThreadScreen';
import { AIContextPicker, CONTEXT_ITEMS } from './components/AIContextPicker';
import { normalizeTheme, themeLabel } from './components/ThemeChipGroup';
import { ThemeSheet } from './components/ThemeSheet';
import { InfoSheet } from './components/InfoSheet';
import { AIHistorySheet } from './components/AIHistorySheet';
import { AIReflectDrawer, EntryDetailDrawer } from './components/InteractiveDrawers';
import { useJournalStore } from './hooks/useJournalStore';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { isRuntimeConfigured, useAiInsight } from './hooks/useJouspaceIntelligence';
import { ReminderService } from './notifications';
import {
  shouldDistill,
  distillMemory,
  loadPersonalization,
  resetPersonalization,
} from './lib/personalization';
import { useFocusTrap } from './hooks/useFocusTrap';
import { useEscapeKey } from './hooks/useEscapeKey';
import { useProfile, deriveInitials, DEFAULT_DISPLAY_NAME } from './hooks/useProfile';
import {
  loadSession,
  clearSession,
  initializeAuth,
  onAuthStateChange,
  type AuthUser,
} from './lib/auth';
import { useTheme } from './hooks/useTheme';
import {
  journalStore,
  loadDemoData,
  downloadJournalExport,
  dateLabel,
} from './store';
import type { StoredEntry } from './store/types';
import { type Screen, type NavTab, readStoredNav, writeStoredNav } from './utils/nav';
import { loadAiContext, saveAiContext } from './lib/supabaseAiContext';
import { hydrateAllUserSync } from './lib/supabaseHydrate';
import { queueUserPrefsSync } from './lib/supabaseUserPrefs';

type Overlay = 'search' | 'memory-thread' | 'notifications' | 'notification-settings' | null;

const DAY_MS = 86_400_000;

/**
 * Local, offline observational copy for the "Jouspace noticed" card. Shown only
 * while the live AI insight is still streaming (or unreachable) — it reflects
 * the user's own data back at them instead of giving instructions.
 */
function buildInsightFallback(entries: StoredEntry[]): string {
  const themes = entries.map((e) => e.theme.trim().toLowerCase()).filter(Boolean);

  if (themes.length > 0) {
    const counts = new Map<string, number>();
    for (const theme of themes) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
    const [topTheme, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCount >= 2) {
      return `Most of your recent entries touch on ${topTheme}.`;
    }
    return `You keep circling back to ${themes[themes.length - 1]} in your writing.`;
  }

  const n = entries.length;
  return n === 1
    ? 'You’ve started your journal — a quiet first entry.'
    : `You’ve written ${n} entries — a quiet record taking shape.`;
}

/** Join theme labels into a natural list: "a", "a and b", "a, b, and c". */
function formatThemeList(labels: string[]): string {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

/**
 * Dynamic subtext for the "Continue your journal" card. Reflects the user's
 * own recent writing back at them (e.g. "You were writing about clarity and
 * discipline.") instead of static copy — a quiet reminder of where they left
 * off, synced to their actual entries. A second warm sentence varies with how
 * recently they wrote, without repeating the greeting's recency line. Falls
 * back to a warm nudge when there are no themes to name.
 */
function buildContinuePrompt(
  entries: StoredEntry[],
  lastWroteDays: number | null,
): string {
  if (entries.length === 0) {
    return 'Write down what is on your mind today. Your journal quietly builds context over time.';
  }
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const e of entries) {
    const theme = normalizeTheme(e.theme);
    if (!theme || seen.has(theme)) continue;
    seen.add(theme);
    labels.push(themeLabel(theme));
    if (labels.length === 3) break;
  }
  if (labels.length === 0) {
    return 'Pick up right where you left off.';
  }
  // Second sentence — a gentle, warm invitation rather than a second fact.
  // Varies with recency so it never repeats the greeting's "wrote earlier
  // today / last wrote N days ago" line.
  const nudge =
    lastWroteDays === null || lastWroteDays <= 1
      ? 'Pick up right where you left off.'
      : lastWroteDays <= 6
        ? 'Your thoughts are still warm — pick them back up.'
        : 'There is no rush — return whenever you’re ready.';
  return `You were writing about ${formatThemeList(labels)}. ${nudge}`;
}

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
          set a runtime URL in Profile to enable AI reflections.
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
  // Onboarding: splash → (first run only) permission primer → app.
  // Returning users who finished the primer skip straight to the app.
  // Auth gate — revived as a backend-free local mock so the transition can be
  // tested in the running app. Once the real backend lands, only lib/localAuth
  // changes; this gate and the AuthScreen stay the same.
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadSession());

  const [onboardingScreen, setOnboardingScreen] = useState<'splash' | 'permissions' | 'complete'>(
    () => {
      try {
        return typeof localStorage !== 'undefined' &&
          localStorage.getItem('jouspace.onboarded') === '1'
          ? 'complete'
          : 'splash';
      } catch {
        // Private-mode / storage-disabled: behave like a first run.
        return 'splash';
      }
    },
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
    () => loadAiContext()
  );

  const journal = useJournalStore();
  const online = useOnlineStatus();
  const runtimeConfigured = isRuntimeConfigured();
  const isEmpty = journal.entries.length === 0;

  // On-device AI memory (distilled personalization) — shown + resettable in Profile.
  const [aiMemoryNotes, setAiMemoryNotes] = useState<string>(
    () => loadPersonalization().memoryNotes
  );

  // Lazy distillation: when enough new entries accrue (or 24h pass), ask the
  // runtime to re-distill a compact profile. Debounced so a burst of writing
  // doesn't fire many calls. Failures are handled inside distillMemory (it keeps
  // the previous notes), so this just refreshes the UI on success.
  useEffect(() => {
    if (!runtimeConfigured || !online) return;
    if (!shouldDistill(journal.entries.length)) return;
    const t = setTimeout(() => {
      distillMemory()
        .then((notes) => {
          if (notes !== null) setAiMemoryNotes(notes);
        })
        .catch(() => {
          /* keep previous notes */
        });
    }, 4000);
    return () => clearTimeout(t);
  }, [journal.entries.length, runtimeConfigured, online]);

  // Live "Jouspace noticed…" insight for the Home card. Only streams while the
  // Home screen is active, the runtime is reachable, and the journal has entries.
  const homeInsight = useAiInsight(
    currentScreen === 'home' && runtimeConfigured && online && !isEmpty
  );

  // Memory tab: simulate a brief entries "fetch" the first time it's opened in a
  // session so the list skeleton is shown (matches the loading spec). Subsequent
  // opens render instantly; the 8s guard still protects against a real hang.
  const memoryLoadedRef = useRef(false);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const memoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (currentScreen === 'memory' && !memoryLoadedRef.current) {
      memoryLoadedRef.current = true;
      setMemoryLoading(true);
      memoryTimerRef.current = setTimeout(() => setMemoryLoading(false), 700);
    }
  }, [currentScreen]);

  const retryMemory = useCallback(() => {
    setMemoryLoading(true);
    if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    memoryTimerRef.current = setTimeout(() => setMemoryLoading(false), 700);
  }, []);

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

  // Splash screen: auto-advance after 1.5s → permission primer (first run) or app.
  useEffect(() => {
    if (onboardingScreen !== 'splash') return;
    const timer = setTimeout(() => setOnboardingScreen('permissions'), 1500);
    return () => clearTimeout(timer);
  }, [onboardingScreen]);

  // Mark onboarding done and dismiss the primer. Safe to call from the primer's
  // Continue or Skip actions — the app is fully usable either way.
  const finishOnboarding = useCallback(() => {
    try {
      localStorage.setItem('jouspace.onboarded', '1');
    } catch {
      /* privacy mode — just advance */
    }
    void queueUserPrefsSync();
    setOnboardingScreen('complete');
  }, []);

  // Auth: persist the session and drop the gate so the app shows.
  const handleAuthed = useCallback((user: AuthUser) => {
    setAuthUser(user);
  }, []);

  // Hydrate the session from the persisted Supabase session on startup, and keep
  // authUser in sync with any future sign-in / sign-out / token refresh.
  useEffect(() => {
    initializeAuth();
    const off = onAuthStateChange((u) => {
      setAuthUser(u);
      if (u) void hydrateAllUserSync();
    });
    return off;
  }, []);

  // Sign out: clear the local session and re-show the auth screen so the
  // transition can be re-tested (no backend yet, so this is fully local).
  const handleSignOut = useCallback(() => {
    clearSession();
    setAuthUser(null);
  }, []);

  // Persist the active screen/tab so a reload/relaunch returns where you left off.
  useEffect(() => {
    writeStoredNav({ screen: currentScreen, tab: activeTab });
  }, [currentScreen, activeTab]);

  // ── Journal reminders (local notifications) ────────────────────────────────────
  // Arm a gentle, recurring evening reminder (+ a "finish your thought" nudge for an
  // open draft) once the app is usable, and re-arm whenever the app returns to the
  // foreground. On the web we can't defer notifications, so we show a best-effort
  // nudge as the tab is hidden (native builds deliver them with the app closed).
  useEffect(() => {
    if (onboardingScreen !== 'complete') return;
    void ReminderService.refresh();
  }, [onboardingScreen]);

  // App lifecycle: foreground refreshes, background arms, tap opens the composer.
  useEffect(() => {
    const openFromReminder = () => {
      setOverlayScreen(null);
      setEditingEntry(null);
      setCurrentScreen('journal');
      setActiveTab('write');
    };
    const offTap = ReminderService.onReminderOpen(() => openFromReminder());

    const cap = (window as unknown as { Capacitor?: any }).Capacitor;
    let offNative: (() => void) | undefined;
    if (cap?.isNativePlatform?.()) {
      const app = cap.Plugins?.App;
      if (app?.addListener) {
        const handle = app.addListener(
          'appStateChange',
          (s: { isActive?: boolean }) => {
            if (s?.isActive) void ReminderService.refresh();
            else void ReminderService.armOnBackground();
          },
        );
        offNative =
          typeof handle?.remove === 'function' ? () => handle.remove() : undefined;
      }
    }

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        void ReminderService.armOnBackground();
      } else {
        void ReminderService.refresh();
      }
    };
    const onPageHide = () => void ReminderService.armOnBackground();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      offTap();
      offNative?.();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

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
    // Re-arm reminders: saving clears the draft, so any pending "finish your
    // thought" nudge is cancelled and the evening reminder stays in place.
    void ReminderService.refresh();
    // Edit mode is cleared when leaving the composer (handleBackToHome). We
    // deliberately keep `editingEntry` set here so the composer does not
    // remount (its key derives from editingEntry.id) during the 2s
    // micro-reflection after Done — a remount would wipe the reflection.
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

  const handleResetMemory = () => {
    resetPersonalization();
    setAiMemoryNotes('');
    showToast('AI memory reset');
  };

  const handleSelectContext = (id: string) => {
    const item = CONTEXT_ITEMS.find((c) => c.id === id);
    if (!item) return;
    const next = { id: item.id, label: item.label };
    setAiContext(next);
    saveAiContext(next);
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

  // Keyboard: Escape closes every overlay. The sheet/drawer components already
  // handle Escape via useFocusTrap (topmost-only, capture-phase stopPropagation),
  // so these calls are a redundant-but-safe fallback that never double-fires.
  useEscapeKey(handleCloseOverlay, overlayScreen !== null);
  useEscapeKey(() => setIsContextPickerOpen(false), isContextPickerOpen);
  useEscapeKey(() => setIsAiReflectOpen(false), isAiReflectOpen);
  useEscapeKey(() => setIsThemeSheetOpen(false), isThemeSheetOpen);
  useEscapeKey(() => setIsInfoSheetOpen(false), isInfoSheetOpen);
  useEscapeKey(() => setIsAiHistoryOpen(false), isAiHistoryOpen);
  useEscapeKey(() => setSelectedEntry(null), selectedEntry !== null);

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
    <div className="min-h-screen bg-base md:bg-baseTint flex flex-col items-center justify-start md:pt-3 md:pb-8">
      {/* Everything (screens + overlays) renders inside the phone frame so
          modals/drawers/backdrops never bleed into the desktop viewport. */}
      <AppScreen
        isOffline={!online}
        overlays={
          <>
            {/* Toast Notification — fades in on show, fades out before the
                message clears (Presence keeps it mounted through the exit
                animation instead of popping it away instantly). */}
            <Presence
              show={toastMessage !== null}
              duration={300}
              enter="fade-enter"
              enterActive="fade-enter-active"
              exit="fade-exit"
              exitActive="fade-exit-active"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-60"
            >
              <div className="bg-primaryText text-background text-xs font-sans px-4 py-2 rounded-full shadow-lg transition-all">
                {toastMessage}
              </div>
            </Presence>

            {/* Overlay Screens — bottom-anchored sheets that slide up from the bottom */}
            {overlayScreen && (
              <div
                ref={overlayRef}
                role="dialog"
                aria-modal="true"
                aria-label={String(overlayScreen)}
                className="absolute inset-0 z-50 flex items-end justify-center"
              >
                {/* Backdrop — fades in on open, fades out on close.
                    `gpu-layer` keeps the fade on the compositor (opacity-only
                    repaint) so it never shimmers over the canvas behind. */}
                <div
                  className={`gpu-layer absolute inset-0 bg-primaryText/40 transition-opacity duration-300 ${
                    overlayClosing ? 'opacity-0' : 'animate-fadeIn'
                  }`}
                  onClick={handleCloseOverlay}
                />

                {/* Sheet — half-screen bottom sheet, bottom-anchored, slides from bottom.
                    `gpu-layer` keeps it promoted even after the slideUp keyframe
                    ends (no de-promotion text pop). While closing, the inline
                    transform pins it at translateY(100%) as the base value so
                    when the slideDown keyframe ends (fill: none) it does NOT snap
                    back to translateY(0) for a frame before React unmounts — that
                    snap is the close "flash". Drag transform (inline style)
                    overrides during drag for 1:1 tracking. */}
                <div
                  ref={sheetElRef}
                  onAnimationEnd={handleOverlayExited}
                  className={`gpu-layer relative z-10 flex flex-col w-full max-w-[430px] h-[58%] bg-base rounded-t-[28px] overflow-hidden ${
                    overlayClosing ? 'animate-slideDown' : 'animate-slideUp'
                  } ${dragging ? 'transition-none' : 'transition-transform duration-200 ease-out'}`}
                  style={
                    dragY != null
                      ? { transform: `translateY(${dragY}px)` }
                      : overlayClosing
                        ? { transform: 'translateY(100%)' }
                        : undefined
                  }
                >
                  {/* Grabber handle — the ONLY drag target (keeps list scroll intact) */}
                  <div
                    className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
                    onPointerDown={onGrabPointerDown}
                    onPointerMove={onGrabPointerMove}
                    onPointerUp={onGrabPointerUp}
                    aria-hidden="true"
                  >
                    <span className="w-9 h-1 rounded-full bg-borderSubtle" />
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
                  {overlayScreen === 'notification-settings' && (
                    <NotificationSettingsSheet onClose={handleCloseOverlay} />
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
          </>
        }
      >
        {/* Screen container — static switch, no entrance animation. Only one
            screen is mounted at a time (conditional render), so switching is a
            single-commit swap: no cross-fade, no overlap, no old-frame flash.
            No `key` lets React reuse this wrapper element and just swap the
            child — instant and clean. */}
        <div className="flex-1 flex flex-col min-h-0">
          {onboardingScreen === 'splash' ? (
            <SplashScreen />
          ) : onboardingScreen === 'permissions' ? (
            <PermissionPrimerScreen onComplete={finishOnboarding} />
          ) : !authUser ? (
            <AuthScreen onAuthed={handleAuthed} />
          ) : currentScreen === 'ai' ? (
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
              userInitials={userInitials}
              entries={journal.entries}
              isNoMemories={isEmpty}
              isLoading={memoryLoading}
              onRetry={retryMemory}
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
              entries={journal.entries}
              onBackToHome={handleBackToHome}
              activeTab={activeTab === 'write' ? 'journal' : activeTab}
              onTabChange={handleTabChange}
              onToast={showToast}
              onSaveEntry={handleSaveEntry}
              onOpenEntry={handleEntryClick}
              onExploreThread={handleExploreThread}
            />
          ) : currentScreen === 'profile' ? (
            <ProfileScreenContent
              activeTab={activeTab}
              onTabChange={handleTabChange}
              userInitials={userInitials}
              displayName={profile.displayName}
              email={authUser?.email ?? ''}
              joinedDate={profile.joinedDate}
              entryCount={journal.entries.length}
              isEmptyJournal={isEmpty}
              isOffline={!online}
              onSave={setDisplayName}
              onOpenNotifications={() => setOverlayScreen('notifications')}
              onOpenNotificationSettings={() => setOverlayScreen('notification-settings')}
              onOpenAppearance={() => setIsThemeSheetOpen(true)}
              onOpenInfo={handleOpenInfo}
              onExport={downloadJournalExport}
              onLoadDemo={() => {
                loadDemoData();
                showToast('Sample data loaded');
              }}
              aiMemoryNotes={aiMemoryNotes || undefined}
              onResetMemory={handleResetMemory}
              onSignOut={handleSignOut}
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
                  />

                  <section className="flex flex-col gap-1 text-left mt-2 mb-1">
                    <h1 className="font-serif text-[30px] text-primaryText font-normal leading-tight tracking-tight">
                      {isEmpty
                        ? 'Welcome to Jouspace'
                        : profile.displayName.trim() &&
                            profile.displayName.trim() !== DEFAULT_DISPLAY_NAME
                          ? `Good to see you, ${profile.displayName.trim()}.`
                          : 'Good to see you'}
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
                      <p className="font-sans text-[14.5px] leading-[1.55] text-secondaryText font-normal max-w-[85%]">
                        {buildContinuePrompt(journal.entries, lastWroteDays)}
                      </p>
                      <div className="pt-2">
                        <PrimaryButton onClick={() => handleTabChange('write')}>
                          New entry
                        </PrimaryButton>
                      </div>
                    </PrimaryCard>
                  </section>

                  {!isEmpty && (
                    <section>
                      {runtimeConfigured ? (
                        <AIInsightCard
                          insightText={
                            homeInsight.text || buildInsightFallback(journal.entries)
                          }
                          label="Jouspace noticed"
                          onReflect={handleReflectWithAI}
                        />
                      ) : (
                        <PrimaryCard className="flex flex-col gap-3">
                          <MemoryLabel text="Jouspace noticed" />
                          <p className="font-serif text-[17px] leading-relaxed text-secondaryText max-w-[85%]">
                            Set a runtime URL in Profile to enable AI reflections.
                          </p>
                        </PrimaryCard>
                      )}
                    </section>
                  )}

                  <section className="flex flex-col gap-3 mt-1">
                    <h3 className="font-serif text-[19px] text-primaryText font-normal tracking-tight">
                      Recent entries
                    </h3>
                    {isEmpty ? (
                      <p className="font-sans text-[14px] text-muted py-4">
                        Your written entries will appear here.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y divide-borderSubtle">
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
          )
        }
        </div>
      </AppScreen>
    </div>
  );
}

export default App;
