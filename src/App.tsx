import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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
import { NotificationSettingsScreen } from './components/NotificationSettingsSheet';
import { MemoryThreadScreen } from './components/MemoryThreadScreen';
import { AIContextScreen, CONTEXT_ITEMS } from './components/AIContextPicker';
import { normalizeTheme, themeLabel } from './components/ThemeChipGroup';
import { ThemeScreen } from './components/ThemeSheet';
import { InfoScreen } from './components/InfoSheet';
import { EditProfileScreen } from './components/EditProfileScreen';
import { AIHistoryScreen } from './components/AIHistorySheet';
import { AIReflectScreen, EntryDetailScreen } from './components/InteractiveDrawers';
import { EntryPickerScreen } from './components/EntryPickerSheet';
import { SpacePickerScreen } from './components/SpacePickerSheet';
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
import { useEscapeKey } from './hooks/useEscapeKey';
import { useProfile, deriveInitials, DEFAULT_DISPLAY_NAME } from './hooks/useProfile';
import {
  loadSession,
  clearSession,
  initializeAuth,
  onAuthStateChange,
  completeGoogleRedirectIfPresent,
  type AuthUser,
  NoAccountUser,
  isNoAccountUser,
} from './lib/auth';
import {
  attachSync,
  detachSync,
  onSyncStatusChange,
  type SyncStatus,
} from './store/cloudSync';
import { Capacitor } from '@capacitor/core';
import { Pencil } from 'lucide-react';
import { readDraft, clearDraft } from './utils/draft';
import { useTheme } from './hooks/useTheme';
import {
  journalStore,
  downloadJournalExport,
  dateLabel,
} from './store';
import type { StoredEntry } from './store/types';
import {
  type Screen,
  type NavTab,
  type NavNode,
  readStoredNav,
  writeStoredNav,
  tabToNode,
} from './utils/nav';
import { writeAiAttach } from './utils/pickerStore';
import { findCustomThemeById } from './utils/customThemes';

/** Load the persisted AI context selection from localStorage. */
function loadAiContextLocal(): { id: string; label: string } | null {
  try {
    const raw = localStorage.getItem('jouspace:ai:context');
    if (raw) return JSON.parse(raw) as { id: string; label: string };
  } catch { /* ignore */ }
  return null;
}

/** Persist the AI context selection to localStorage. */
function saveAiContextLocal(selection: { id: string; label: string }): void {
  try {
    localStorage.setItem('jouspace:ai:context', JSON.stringify(selection));
  } catch { /* ignore */ }
}

// Maps a profile "info sheet" kind to its dedicated full-screen route.
const INFO_KIND_TO_SCREEN: Record<InfoSheetKind, Screen> = {
  privacy: 'privacy',
  help: 'help',
  feedback: 'feedback',
  about: 'about',
};

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

export function App() {
  // Onboarding: splash → auth → permission primer → app.
  // Returning users who finished the primer skip straight to the app.
  // Auth gate — Firebase is the identity provider (Google + email/password).
  // A successful sign-in (handleAuthed) overwrites authUser; otherwise the
  // gate stays up until the user completes a Firebase auth flow.
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadSession() ?? NoAccountUser);

  /** True when the user should see the app rather than the auth gate. */
  const showApp = !isNoAccountUser(authUser);

  // First-run flow stages: splash -> auth -> permissions -> app.
  // Returning users (jouspace.onboarded === '1') start straight at 'app'.
  const [stage, setStage] = useState<'splash' | 'auth' | 'permissions' | 'app'>(
    () => {
      try {
        return typeof localStorage !== 'undefined' &&
          localStorage.getItem('jouspace.onboarded') === '1'
          ? 'app'
          : 'splash';
      } catch {
        // Private-mode / storage-disabled: behave like a first run.
        return 'splash';
      }
    },
  );

  // Restore the last-viewed screen/tab so a reload/relaunch returns where the
  // user left off (falls back to Home on first run or if the value is invalid).
  // Native navigation stack. Each node holds the active screen plus the
  // bottom-nav tab that should stay highlighted. Only the top node renders, so
  // the previous screen stays frozen exactly where it was (no overlay, no
  // state toggle, no shared layout — the background does not shift or jitter).
  const [navStack, setNavStack] = useState<NavNode[]>(() => [
    tabToNode(readStoredNav().tab),
  ]);
  const currentNode = navStack[navStack.length - 1];
  const currentScreen = currentNode.screen;
  const activeTab = currentNode.tab;

  const goTo = useCallback((screen: Screen) => {
    setNavStack((prev) => [
      ...prev,
      { screen, tab: prev[prev.length - 1].tab },
    ]);
  }, []);

  const goBack = useCallback(() => {
    setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const navigateToTab = useCallback((tab: NavTab) => {
    setNavStack([tabToNode(tab)]);
  }, []);

  // Entry editing / detail state
  const [selectedEntry, setSelectedEntry] = useState<StoredEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<StoredEntry | null>(null);
  const [threadTheme, setThreadTheme] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile + theme (persisted to localStorage)
  const { profile, setDisplayName } = useProfile();
  const { theme, setTheme } = useTheme();
  const userInitials = deriveInitials(profile.displayName);

  // Persisted AI context selection (from the context picker).
  const [aiContext, setAiContext] = useState<{ id: string; label: string } | null>(
    () => loadAiContextLocal()
  );

  // Space/theme picker state (lifted from JournalScreenContent so the picker
  // can be a full-screen route). `spaceTab` tracks the in-progress selection.
  const [spacePickerTab] = useState<'presets' | 'custom'>(
    'presets'
  );
  const [spacePickerSelectedId, setSpacePickerSelectedId] = useState<string>('');
  const [spacePickerCustom, setSpacePickerCustom] = useState<{
    name: string;
    cTitle: string;
    cBody: string;
  }>({ name: '', cTitle: '', cBody: '' });

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

  // Live mirrors of `stage` / `navStack` so the hardware-back listener (which
  // closes over a stable effect, not the latest render) can always read the
  // current onboarding stage and navigation depth.
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const navDepthRef = useRef(navStack.length);
  navDepthRef.current = navStack.length;

  useLayoutEffect(() => {
    if (currentScreen === 'memory' && !memoryLoadedRef.current) {
      memoryLoadedRef.current = true;
      setMemoryLoading(true);
      memoryTimerRef.current = setTimeout(() => setMemoryLoading(false), 700);
    }
  }, [currentScreen]);

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

  // Splash screen: auto-advance after 3s → auth (the "Continue writing" screen).
  // A little extra beat lets first-run users actually read the logo + tagline
  // before the auth gate replaces it.
  useEffect(() => {
    if (stage !== 'splash') return;
    const timer = setTimeout(() => setStage('auth'), 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  // Mark onboarding done and dismiss the primer. Safe to call from the primer's
  // Continue or Skip actions — the app is fully usable either way.
  const finishOnboarding = useCallback(() => {
    try {
      localStorage.setItem('jouspace.onboarded', '1');
    } catch {
      /* privacy mode — just advance */
    }
    setStage('app');
  }, []);

  // Auth: persist the session and drop the gate so the app shows.
  const handleAuthed = useCallback(
    (user: AuthUser | null) => {
      const next = user ?? NoAccountUser;
      setAuthUser(next);
      if (!isNoAccountUser(next)) {
        // Real (non-no-account) sign-in: sync the Profile display name so it
        // matches the authenticated account.
        setDisplayName(next.displayName);
      }
      setStage((prev) => (prev === 'auth' ? 'permissions' : 'app'));
    },
    [setDisplayName],
  );

  // Hydrate the session from the persisted Firebase session on startup, and keep
  // authUser in sync with any future sign-in / sign-out.
  useEffect(() => {
    initializeAuth();
    // Web: if we just returned from a Google OAuth redirect, finish sign-in and
    // drop straight into the app. Native handles Google in-process, so skip.
    if (!Capacitor.isNativePlatform()) {
      void completeGoogleRedirectIfPresent().then((user) => {
        if (user) handleAuthed(user);
      });
    }
    const off = onAuthStateChange((u) => {
      setAuthUser(u);
    });
    return off;
  }, [handleAuthed]);

  // Firestore sync: attach when a real user signs in, detach on sign-out.
  useEffect(() => {
    if (authUser && !isNoAccountUser(authUser) && authUser.id) {
      void attachSync(authUser.id);
    } else {
      detachSync();
    }
  }, [authUser]);

  // Sync status for UI feedback.
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  useEffect(() => onSyncStatusChange(setSyncStatus), []);

  // Re-read personalization when cloud sync pushes a remote update.
  useEffect(() => {
    const h = () => setAiMemoryNotes(loadPersonalization().memoryNotes);
    window.addEventListener('jouspace:personalization:remote-changed', h);
    return () =>
      window.removeEventListener('jouspace:personalization:remote-changed', h);
  }, []);

  // Show the auth screen on demand (e.g. from Profile -> Sign in / Switch
  // account, or after signing out). Resets to the no-account placeholder so the
  // gate re-appears and the user can complete a Firebase auth flow.
  const goToAuth = useCallback(() => {
    setAuthUser(NoAccountUser);
    setNavStack([tabToNode('home')]); // land on a fresh root, not a stale Profile
    setStage('auth');
  }, []);

  // Sign out: clear the local session and return to the auth screen so the user
  // can switch accounts (local-first, no cloud session to revoke).
  const handleSignOut = useCallback(() => {
    void clearSession().catch(() => {});
    goToAuth();
  }, [goToAuth]);

  // Persist the stack's root tab so a reload/relaunch returns to the same
  // bottom-nav section (sub-screens are transient and not restored).
  useEffect(() => {
    const root = navStack[0];
    writeStoredNav({ screen: root.screen, tab: root.tab });
  }, [navStack]);

  // ── Journal reminders (local notifications) ────────────────────────────────────
  // Arm a gentle, recurring evening reminder (+ a "finish your thought" nudge for an
  // open draft) once the app is usable, and re-arm whenever the app returns to the
  // foreground. On the web we can't defer notifications, so we show a best-effort
  // nudge as the tab is hidden (native builds deliver them with the app closed).
  useEffect(() => {
    if (stage !== 'app') return;
    void ReminderService.refresh();
  }, [stage]);

  // App lifecycle: foreground refreshes, background arms, tap opens the composer.
  useEffect(() => {
    const openFromReminder = () => {
      setEditingEntry(null);
      setSelectedEntry(null);
      navigateToTab('write'); // replaces stack → journal/write root; freezes background
    };
    const offTap = ReminderService.onReminderOpen(() => openFromReminder());

    const cap = (window as unknown as { Capacitor?: any }).Capacitor;
    let offNative: (() => void) | undefined;
    let offUrlOpen: (() => void) | undefined;
    let offBack: (() => void) | undefined;
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

        // Handle deep links (jouspace://) for OAuth & password-reset callbacks.
        const urlHandle = app.addListener(
          'appUrlOpen',
          (event: { url?: string }) => {
            if (!event?.url) return;
            try {
              // Google OAuth callback: Firebase handles the redirect result
              // via completeGoogleRedirectIfPresent.
              void completeGoogleRedirectIfPresent().then((user) => {
                if (user) handleAuthed(user);
              });
            } catch (err) {
              console.warn('[auth] deep-link processing error:', err);
            }
          },
        );
        offUrlOpen =
          typeof urlHandle?.remove === 'function' ? () => urlHandle.remove() : undefined;

        // Android hardware back button — navigate the in-app stack on every screen.
        // Registering ANY listener stops Capacitor's native AppPlugin from
        // calling finish() (it fires the event to JS instead), so we must
        // always decide what to do here: pop a screen, hold the auth gate, or
        // minimize. Without this, back does nothing on most screens.
        const backHandle = app.addListener(
          'backButton',
          () => {
            // Inside the app: pop the navigation stack (composer → home,
            // detail view → list, overlay → underlying screen). At the root
            // there is nothing to pop, so let the OS minimize the app.
            if (stageRef.current === 'app') {
              if (navDepthRef.current > 1) goBack();
              return;
            }
            // Onboarding stages (splash / auth / permissions): hold the auth
            // gate rather than letting the WebView exit the activity.
            if (stageRef.current === 'auth') {
              setAuthUser(NoAccountUser);
            }
          },
        );
        offBack =
          typeof backHandle?.remove === 'function' ? () => backHandle.remove() : undefined;
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
      offUrlOpen?.();
      offBack?.();
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
    navigateToTab('journal');
  };

  const handleDeleteEntry = (entry: StoredEntry) => {
    if (window.confirm('Delete this entry?')) {
      journal.remove(entry.id);
      showToast('Entry deleted');
    }
  };

  const handleEntryClick = (entry: Entry) => goToEntry(entry.id);

  const handleBackToHome = () => {
    navigateToTab('home');
    setEditingEntry(null);
  };

  const handleTabChange = (tab: NavTab) => {
    // Switching tabs replaces the whole stack with that tab's root screen.
    navigateToTab(tab);
  };

  const handleOpenProfile = () => {
    goTo('profile');
  };

  const handleOpenInfo = (kind: InfoSheetKind) => {
    goTo(INFO_KIND_TO_SCREEN[kind]);
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
    saveAiContextLocal(next);
    goBack();
  };

  const handleReflectWithAI = () => goTo('aiReflect');

  // Draft detection — check if there's an active unsaved draft on mount
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    const draft = readDraft();
    return draft !== null && (draft.title.trim() !== '' || draft.body.trim() !== '');
  });

  // Clear the draft and navigate to a fresh new entry
  const handleNewEntry = useCallback(() => {
    clearDraft();
    setHasDraft(false);
    handleTabChange('write');
  }, [handleTabChange]);

  // Continue writing with the existing draft
  const handleContinueWriting = useCallback(() => {
    handleTabChange('write');
  }, [handleTabChange]);

  // Refresh draft state when returning to home screen
  useEffect(() => {
    if (currentScreen === 'home') {
      const draft = readDraft();
      setHasDraft(draft !== null && (draft.title.trim() !== '' || draft.body.trim() !== ''));
    }
  }, [currentScreen]);

  const handleExploreThread = (themeId: string) => {
    setThreadTheme(themeId);
    goTo('memoryThread');
  };

  const goToEntry = (id: string) => {
    const entry = journal.get(id);
    if (entry) {
      setSelectedEntry(entry);
      goTo('entryDetail');
    }
  };

  const handleOpenEntryPicker = () => {
    goTo('entryPicker');
  };

  const handleOpenSpacePicker = (spaceId: string, customThemeId: string | null) => {
    setSpacePickerSelectedId(spaceId);
    let seed: { name: string; cTitle: string; cBody: string } = {
      name: '',
      cTitle: '',
      cBody: '',
    };
    if (customThemeId) {
      const ct = findCustomThemeById(customThemeId);
      if (ct) {
        seed = {
          name: ct.label,
          cTitle: ct.placeholderTitle,
          cBody: ct.placeholderBody,
        };
      }
    }
    setSpacePickerCustom(seed);
    goTo('spacePicker');
  };

  // Keyboard: Escape returns to the previous screen (no effect at a tab root).
  useEscapeKey(goBack, navStack.length > 1);

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

          </>
        }
      >
        {/* Screen container — static switch, no entrance animation. Only one
            screen is mounted at a time (conditional render), so switching is a
            single-commit swap: no cross-fade, no overlap, no old-frame flash.
            No `key` lets React reuse this wrapper element and just swap the
            child — instant and clean. */}
        <div className="flex-1 flex flex-col min-h-0">
          {stage === 'splash' ? (
            <SplashScreen />
          ) : stage === 'permissions' ? (
            <PermissionPrimerScreen onComplete={finishOnboarding} />
          ) : showApp ? (
            currentScreen === 'ai' ? (
            <AIScreenContent
              activeTab="ai"
              onTabChange={handleTabChange}
              isNoMemoryContext={!runtimeConfigured}
              userInitials={userInitials}
              contextLabel={aiContext?.label ?? null}
              entries={journal.entries}
              onAvatarClick={handleOpenProfile}
              onOpenHistory={() => goTo('aiHistory')}
              onOpenContextPicker={() => goTo('aiContext')}
              onOpenEntryPicker={handleOpenEntryPicker}
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
              onEntryClick={handleEntryClick}
              onExploreThread={handleExploreThread}
              onReflectWithAi={handleReflectWithAI}
              onOpenSearch={() => goTo('search')}
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
              onOpenSpacePicker={handleOpenSpacePicker}
            />
          ) : currentScreen === 'profile' ? (
            <ProfileScreenContent
              activeTab={activeTab}
              onTabChange={handleTabChange}
              userInitials={userInitials}
              displayName={profile.displayName}
              email={authUser?.email ?? ''}
              joinedDate={profile.joinedDate}
              isOffline={!online}
              onOpenNotifications={() => goTo('notifications')}
              onOpenNotificationSettings={() => goTo('notificationSettings')}
              onOpenAppearance={() => goTo('appearance')}
              onEditProfile={() => goTo('editProfile')}
              onOpenInfo={handleOpenInfo}
              onExport={downloadJournalExport}

              aiMemoryNotes={aiMemoryNotes || undefined}
              onResetMemory={handleResetMemory}
              onSignIn={goToAuth}
              onSignOut={handleSignOut}
              syncStatus={syncStatus}
            />
          ) : currentScreen === 'editProfile' ? (
            <EditProfileScreen
              displayName={profile.displayName}
              userInitials={userInitials}
              email={authUser?.email ?? ''}
              joinedDate={profile.joinedDate}
              onSave={setDisplayName}
              onBack={goBack}
            />
          ) : currentScreen === 'notifications' ? (
            <NotificationScreen onBack={goBack} />
          ) : currentScreen === 'notificationSettings' ? (
            <NotificationSettingsScreen onBack={goBack} />
          ) : currentScreen === 'appearance' ? (
            <ThemeScreen
              theme={theme}
              onSelect={setTheme}
              onBack={goBack}
            />
          ) : currentScreen === 'privacy' ? (
            <InfoScreen kind="privacy" onBack={goBack} />
          ) : currentScreen === 'help' ? (
            <InfoScreen kind="help" onBack={goBack} />
          ) : currentScreen === 'feedback' ? (
            <InfoScreen kind="feedback" onBack={goBack} />
          ) : currentScreen === 'about' ? (
            <InfoScreen kind="about" onBack={goBack} />
          ) : currentScreen === 'search' ? (
            <SearchScreen
              entries={journal.entries}
              onBack={goBack}
              onResultClick={goToEntry}
            />
          ) : currentScreen === 'memoryThread' ? (
            <MemoryThreadScreen
              title={
                threadTheme
                  ? journal.entries.find((e) => e.theme === threadTheme)?.theme ?? threadTheme
                  : 'Memory thread'
              }
              entries={threadEntries}
              onBack={goBack}
              onReflectWithAI={handleReflectWithAI}
            />
          ) : currentScreen === 'aiContext' ? (
            <AIContextScreen
              activeId={aiContext?.id ?? null}
              onSelectContext={handleSelectContext}
              onBack={goBack}
            />
          ) : currentScreen === 'aiHistory' ? (
            <AIHistoryScreen onBack={goBack} />
          ) : currentScreen === 'aiReflect' ? (
            <AIReflectScreen onBack={goBack} />
          ) : currentScreen === 'entryPicker' ? (
            <EntryPickerScreen
              entries={journal.entries}
              onSelect={(entry) => {
                writeAiAttach(entry.title);
                goBack();
              }}
              onBack={goBack}
            />
          ) : currentScreen === 'entryDetail' ? (
            selectedEntry ? (
              <EntryDetailScreen
                entry={selectedEntry}
                onBack={goBack}
                onEdit={() => handleEditEntry(selectedEntry)}
                onDelete={() => handleDeleteEntry(selectedEntry)}
              />
            ) : (
              <div className="flex flex-col flex-1 min-h-0" />
            )
          ) : currentScreen === 'spacePicker' ? (
            <SpacePickerScreen
              initialTab={spacePickerTab}
              initialSelectedId={spacePickerSelectedId}
              initialCustom={spacePickerCustom}
              onBack={goBack}
            />
          ) : (
            /* HOME SCREEN VIEW */
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
                <div className="flex flex-col gap-7 w-full">
                  <JouspaceHeader
                    userInitials={userInitials}
                    onSearchClick={() => goTo('search')}
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
                        <div className="flex items-center gap-3">
                          {hasDraft ? (
                            <PrimaryButton
                              onClick={handleContinueWriting}
                              icon={<Pencil className="w-4 h-4 mr-2 stroke-[1.8]" />}
                            >
                              Continue Writing
                            </PrimaryButton>
                          ) : (
                            <PrimaryButton onClick={() => handleTabChange('write')}>
                              New entry
                            </PrimaryButton>
                          )}
                          {hasDraft && (
                            <button
                              type="button"
                              onClick={handleNewEntry}
                              className="inline-flex items-center min-h-11 px-5 py-3.5 text-[14.5px] font-medium text-accent hover:text-accentAlt transition-colors duration-150 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            >
                              New entry
                            </button>
                          )}
                        </div>
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
        ) : (
          <AuthScreen
            onAuthed={handleAuthed}
          />
        )
        }
        </div>
      </AppScreen>
    </div>
  );
}

export default App;
