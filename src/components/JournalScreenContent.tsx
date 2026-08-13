import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { JournalHeader } from './JournalHeader';
import { JournalMetadata, AutosaveStatus } from './JournalMetadata';
import { JournalEditor } from './JournalEditor';
import { WritingToolbar } from './WritingToolbar';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { ThemeChipGroup, DEFAULT_THEMES, normalizeTheme } from './ThemeChipGroup';
import { RecentOnTheme } from './RecentOnTheme';
import {
  SpacePickerSheet,
  getSpaceById,
  spaceForTheme,
  CUSTOM_SPACE_ID,
  type Space,
} from './SpacePickerSheet';
import {
  type CustomTheme,
  saveCustomTheme,
  findCustomThemeById,
} from '../lib/supabaseCustomThemes';
import {
  detectSentiment,
  type SentimentKey,
  type SentimentResult,
} from '../utils/sentiment';
import { readDraft, writeDraft, clearDraft } from '../utils/draft';
import type { StoredEntry } from '../store/types';
import type { Entry } from './EntryRow';
import { Presence } from './Presence';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { usePermission } from '../permissions/usePermissions';

interface JournalScreenContentProps {
  /** Entry being edited; when omitted the composer is a fresh new entry. */
  editingEntry?: StoredEntry | null;
  /** All saved entries (newest-first) — used to compute the Done micro-reflection. */
  entries?: Entry[];
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
  /** Opens a past entry's detail drawer (tapping a row in "Past writing"). */
  onOpenEntry?: (entry: Entry) => void;
  /** Deep-links to the Memory thread view for a theme. */
  onExploreThread?: (themeId: string) => void;
}

/**
 * Gentle writing nudges shown after a pause. Bucketed by theme so each
 * reflection style hears a voice tuned to it; unknown themes fall back to the
 * default bucket. The same prompt repeats at most once per hour.
 */
const PAUSE_PROMPTS: Record<string, string[]> = {
  clarity: [
    "What's becoming clear right now?",
    "If you had to name the truth in one sentence...",
    "What would you tell someone else in this situation?",
  ],
  discipline: [
    "What's the smallest next step?",
    "What are you avoiding right now?",
    "What does 'done' look like here?",
  ],
  purpose: [
    "Why does this matter to you?",
    "What are you actually reaching for?",
    "If this worked out perfectly, what would change?",
  ],
  pressure: [
    "What's weighing on you that you haven't named?",
    "What would you say if you weren't being polite?",
    "What's the feeling underneath the words?",
  ],
  default: [
    "What's the feeling underneath the words?",
    "If you weren't being polite, what would you say?",
    "What would you tell a friend in this situation?",
  ],
};

/** Pick a pause prompt for a theme, rotating by hour so it feels fresh. */
function getPrompt(theme: string, hour: number): string {
  const bucket = PAUSE_PROMPTS[theme] || PAUSE_PROMPTS.default;
  const index = hour % bucket.length;
  return bucket[index];
}

/**
 * One-line micro-reflection shown for ~2s after tapping Done. Compares the
 * just-saved entry against the full journal (theme frequency + word count)
 * and returns a gentle, data-driven insight.
 */
function getReflection(entry: Entry, allEntries: Entry[]): string {
  const themeCount = allEntries.filter((e) => e.theme === entry.theme).length;
  const wordCount =
    entry.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  const avgWords =
    allEntries.length > 1
      ? Math.round(
          allEntries.reduce(
            (sum, e) =>
              sum +
              (e.content?.trim().split(/\s+/).filter(Boolean).length || 0),
            0
          ) / allEntries.length
        )
      : 0;

  if (allEntries.length === 1) {
    return 'Your first entry. Welcome to your journal.';
  }
  if (themeCount === 1) {
    return `First time writing about ${entry.theme}.`;
  }
  if (wordCount > avgWords * 1.5) {
    return 'You said more than usual. Something important.';
  }
  if (wordCount < avgWords * 0.5) {
    return "Short and sharp. Sometimes that's enough.";
  }
  return `That's ${themeCount} entries about ${entry.theme}.`;
}

/**
 * Inline-continuation prompts, bucketed by theme. Shown in the Sparkle
 * panel when the user taps the sparkle button; rotated by hour so the
 * same suggestion never repeats within the same day.
 */
const SPARKLE_SUGGESTIONS: Record<string, string[]> = {
  clarity: [
    "What became clear is...",
    "The truth underneath this is...",
    "If I had to name it in one word...",
  ],
  discipline: [
    "The smallest next step is...",
    "What I'm avoiding right now is...",
    "Done looks like...",
  ],
  purpose: [
    "Why this matters to me is...",
    "What I'm actually reaching for is...",
    "If this worked out, what would change is...",
  ],
  pressure: [
    "What's weighing on me that I haven't named is...",
    "If I weren't being polite, I'd say...",
    "The feeling underneath the words is...",
  ],
  default: [
    "Continue this thought...",
    "What I'm really afraid of is...",
    "The opposite might also be true...",
  ],
};

export const JournalScreenContent: React.FC<JournalScreenContentProps> = ({
  editingEntry,
  entries = [],
  onBackToHome,
  activeTab,
  onTabChange,
  saveStatus = 'autosaved',
  onToast,
  onSaveEntry,
  onOpenEntry,
  onExploreThread,
}) => {
  const initialTheme = normalizeTheme(editingEntry?.theme ?? '') || DEFAULT_THEMES[0].id;

  // Read the persisted draft once — a single snapshot drives title/body/theme
  // and the selected Space. The draft is restored only for brand-new entries;
  // editing an existing entry always starts from that entry's own content.
  const storedDraft = editingEntry ? null : readDraft();

  // Custom themes restore per-entry: an edit whose saved theme matches a
  // persisted custom theme keeps its placeholders; everything else maps back
  // through the preset Spaces.
  const initialCustomTheme =
    editingEntry
      ? findCustomThemeById(editingEntry.theme)
      : storedDraft?.spaceId === CUSTOM_SPACE_ID && storedDraft.customThemeId
        ? findCustomThemeById(storedDraft.customThemeId)
        : null;

  const initialSpaceId = editingEntry
    ? initialCustomTheme
      ? CUSTOM_SPACE_ID
      : spaceForTheme(editingEntry.theme).id
    : storedDraft?.spaceId ?? spaceForTheme(storedDraft?.theme ?? initialTheme).id;

  const [title, setTitle] = useState(() =>
    editingEntry ? editingEntry.title : (storedDraft?.title ?? '')
  );
  const [body, setBody] = useState(() =>
    editingEntry ? editingEntry.content : (storedDraft?.body ?? '')
  );
  const [theme, setTheme] = useState(() =>
    editingEntry ? initialTheme : (storedDraft?.theme ?? initialTheme)
  );
  // --- Space selection -----------------------------------------------------
  const [spaceId, setSpaceId] = useState<string>(initialSpaceId);
  const [customTheme, setCustomTheme] = useState<CustomTheme | null>(
    initialCustomTheme
  );
  const [spacePickerOpen, setSpacePickerOpen] = useState(false);
  const [currentSaveStatus, setCurrentSaveStatus] =
    useState<AutosaveStatus>(saveStatus);
  // True briefly after a manual save completes — drives the checkmark pulse
  // shown next to the autosave status. Reset after 1.5s.
  const [justSaved, setJustSaved] = useState(false);
  // One-line micro-reflection shown for ~2s after tapping Done.
  const [reflection, setReflection] = useState<string | null>(null);

  // Pending autosave-status timers, tracked so a typing burst can't stack them.
  const statusTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- Pause-prompt companion ---------------------------------------------
  const [pausePrompt, setPausePrompt] = useState<string | null>(null);
  const promptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // --- Sentiment whisper ---------------------------------------------------
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const sentimentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the sentiment the user dismissed so it stays quiet until the
  // writing shifts to a different emotional tone (no nagging on repeat words).
  const dismissedSentimentRef = useRef<SentimentKey | null>(null);

  // --- Sparkle inline continuations ---------------------------------------
  const [sparkleSuggestions, setSparkleSuggestions] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sparkleGlow, setSparkleGlow] = useState(false);
  const sparkleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparklePanelRef = useRef<HTMLDivElement>(null);

  // --- Mic voice-to-text ---------------------------------------------------
  // Shared Web Speech API hook. Commits finalized transcript segments to the
  // journal body; the hook guarantees each segment is delivered exactly once
  // (no interim duplication) and streams a live interim preview.
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const voice = useVoiceInput({
    onFinal: (text) => {
      setBody((prev) => {
        const sep = prev.length > 0 && !/\s$/.test(prev) ? ' ' : '';
        return prev + sep + text;
      });
      beginSaveStatusCycle();
    },
    onInterim: (text) => setVoiceInterim(text ?? ''),
    onError: (code) => {
      setVoiceInterim('');
      setVoiceError(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone permission blocked for voice input.'
          : code === 'audio-capture'
            ? 'No microphone found for voice input.'
            : 'Voice input unavailable — could not reach the speech service. Check your connection or mic permission.',
      );
      window.setTimeout(() => setVoiceError(null), 5000);
    },
    onStop: () => setVoiceInterim(''),
  });

  // Gate the mic behind the unified permission system. We always call `ensure`
  // (which requests in-context on first use and never re-prompts once denied),
  // then start voice input only when permitted. On the web the actual mic grant
  // is shared with the Web Speech API, so this single prompt covers both.
  const mic = usePermission('microphone');

  const handleMic = useCallback(async () => {
    if (!voice.supported) {
      setVoiceError('Voice input isn’t supported on this device or browser.');
      window.setTimeout(() => setVoiceError(null), 5000);
      return;
    }
    const res = await mic.ensure();
    if (!res.ok) {
      if (res.state === 'deniedPermanently' || res.state === 'restricted') {
        const opened = await mic.openSettings();
        if (!opened) {
          setVoiceError(
            'Microphone access is blocked. Enable it in your browser or device Settings, then return here.',
          );
          window.setTimeout(() => setVoiceError(null), 5000);
        }
      } else {
        setVoiceError(
          res.state === 'unsupported'
            ? 'No microphone found for voice input.'
            : 'Microphone permission blocked for voice input.',
        );
        window.setTimeout(() => setVoiceError(null), 5000);
      }
      return;
    }
    // Warm the on-device model right after the mic is granted so the first tap
    // is instant (no interruption). The toggle below then loads if still pending.
    voice.preload?.();
    voice.toggle();
  }, [mic.ensure, mic.openSettings, voice.supported, voice.toggle, voice.preload, setVoiceError]);

  // Persist the in-progress draft for new entries so a reload/relaunch never
  // loses an unsaved thought. Cleared on save or when the composer is emptied.
  useEffect(() => {
    if (editingEntry) return;
    if (!title.trim() && !body.trim()) {
      clearDraft();
      return;
    }
    writeDraft({
      title,
      body,
      theme,
      spaceId,
      customThemeId: customTheme?.id,
      savedAt: Date.now(),
    });
  }, [title, body, theme, spaceId, customTheme, editingEntry]);

  // Real-time sentiment whisper — re-scan the draft after a short quiet period
  // (debounced, so it never flickers mid-sentence). Only the dominant
  // sentiment is ever shown, and a dismissed one stays hidden until the text
  // shifts to a different emotional tone.
  useEffect(() => {
    if (sentimentTimerRef.current) clearTimeout(sentimentTimerRef.current);
    sentimentTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) return;
      const result = detectSentiment(`${title} ${body}`);
      setSentiment((prev) => {
        if (!result) return null;
        if (dismissedSentimentRef.current === result.key) return prev;
        return prev?.key === result.key ? prev : result;
      });
    }, 900);
    return () => {
      if (sentimentTimerRef.current) clearTimeout(sentimentTimerRef.current);
    };
  }, [title, body]);

  /** Run the editing → autosaving → autosaved status cycle exactly once per
   *  typing burst. Handles are tracked so rapid typing can't stack timers and
   *  flap the status indicator. */
  const beginSaveStatusCycle = () => {
    if (currentSaveStatus === 'editing') return;
    if (statusTimersRef.current.length) {
      statusTimersRef.current.forEach(clearTimeout);
      statusTimersRef.current = [];
    }
    setCurrentSaveStatus('editing');
    statusTimersRef.current = [
      setTimeout(() => setCurrentSaveStatus('autosaving'), 1000),
      setTimeout(() => setCurrentSaveStatus('autosaved'), 2200),
    ];
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    beginSaveStatusCycle();
  };

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    beginSaveStatusCycle();
  };

  /** Clear the pause-prompt state and its pending timer. */
  const clearPausePrompt = () => {
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }
    setPausePrompt(null);
  };

  /** Dismiss the sentiment whisper; it stays hidden for this sentiment until
   *  the writing shifts to a different emotional tone. */
  const dismissSentiment = () => {
    if (sentiment) dismissedSentimentRef.current = sentiment.key;
    setSentiment(null);
  };

  /** Fired on key-down: the user is actively writing — dismiss any visible
   *  prompt and hold off starting the pause timer. */
  const handleTypingStart = () => {
    isTypingRef.current = true;
    clearPausePrompt();
    // Clear the sentiment whisper and its pending scan — typing resumes.
    if (sentimentTimerRef.current) {
      clearTimeout(sentimentTimerRef.current);
      sentimentTimerRef.current = null;
    }
    setSentiment(null);
    // Clear sparkle glow — typing resumes, so the hint disappears.
    if (sparkleTimerRef.current) {
      clearTimeout(sparkleTimerRef.current);
      sparkleTimerRef.current = null;
    }
    setSparkleGlow(false);
  };

  /** Fired on key-up / change: (re)start the 4s pause timer that surfaces a
   *  gentle writing prompt once the user goes quiet, plus the 3s sparkle
   *  glow that hints at AI continuations just before it. */
  const handleTypingStop = () => {
    isTypingRef.current = false;
    promptTimerRef.current = setTimeout(() => {
      if (!isTypingRef.current) {
        // The pause prompt supersedes the sentiment whisper so only one
        // helper is ever visible at a time.
        if (sentimentTimerRef.current) {
          clearTimeout(sentimentTimerRef.current);
          sentimentTimerRef.current = null;
        }
        setSentiment(null);
        const prompt = getPrompt(theme || 'default', new Date().getHours());
        setPausePrompt(prompt);
      }
    }, 4000);
    // Sparkle glow at 3s — slightly before the prompt, only when no
    // suggestions are already open.
    sparkleTimerRef.current = setTimeout(() => {
      if (!isTypingRef.current && !sparkleSuggestions) {
        setSparkleGlow(true);
      }
    }, 3000);
  };

  // Clear any pending timers on unmount so nothing fires after the composer is
  // gone. (Active speech recognition is released by useVoiceInput itself.)
  useEffect(() => {
    return () => {
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
      if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
      if (sentimentTimerRef.current) clearTimeout(sentimentTimerRef.current);
      statusTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Click-outside dismisses the Sparkle strip — native-feeling dismissal
  // without an explicit close affordance.
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (sparkleSuggestions && sparklePanelRef.current && !sparklePanelRef.current.contains(target)) {
        setSparkleSuggestions(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [sparkleSuggestions]);

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
      setJustSaved(true);
      onToast?.('Journal entry saved');
      setTimeout(() => setJustSaved(false), 1500);
    }, 800);
  };

  const handleDone = () => {
    // Save first — onSaveEntry → journal.save() completes synchronously, so
    // the entry is persisted before the reflection is computed/shown.
    handleManualSave();

    const hasContent = title.trim().length > 0 || body.trim().length > 0;
    if (!hasContent) {
      // Nothing was saved (handleSaveEntry returns early for empty input) —
      // leave without a reflection, matching the previous 400ms exit.
      setTimeout(() => onBackToHome(), 400);
      return;
    }

    // Build the just-saved entry from local state rather than relying on the
    // entries prop, which only refreshes on the next render.
    const savedEntry: Entry = {
      id: editingEntry?.id ?? `tmp-${Date.now()}`,
      date: editingEntry?.date ?? 'Today',
      title: title.trim() || 'Untitled entry',
      theme,
      content: body,
    };

    // Include the just-saved entry in the stats: append for a new entry,
    // replace in place when editing an existing one.
    const exists = entries.some((e) => e.id === savedEntry.id);
    const allEntries = exists
      ? entries.map((e) => (e.id === savedEntry.id ? savedEntry : e))
      : [...entries, savedEntry];

    setReflection(getReflection(savedEntry, allEntries));

    // Hold the micro-reflection for 2s, then fade it out. Presence's
    // `onExited` navigates home only AFTER the 400ms exit animation finishes,
    // so the overlay never disappears abruptly (the old code unmounted it
    // instantly, which is what caused the flicker on the way out).
    setTimeout(() => setReflection(null), 2000);
  };

  /** Sparkle — open (or dismiss) the inline-continuation panel. Template
   *  based, no backend: prompts are bucketed by theme and rotated by hour. */
  const handleSparkleClick = () => {
    if (sparkleSuggestions) {
      setSparkleSuggestions(null); // dismiss if already open
      return;
    }
    setSparkleGlow(false);
    setIsGenerating(true);
    // Simulate brief "thinking" delay (300ms) for UX
    setTimeout(() => {
      const bucket = SPARKLE_SUGGESTIONS[theme || 'default'] || SPARKLE_SUGGESTIONS.default;
      // Rotate by hour for variety
      const hour = new Date().getHours();
      const suggestions = [
        bucket[hour % bucket.length],
        bucket[(hour + 1) % bucket.length],
        bucket[(hour + 2) % bucket.length],
      ];
      // Sparkle and Tag are mutually exclusive — opening one clears the
      // other helper panels, including the sentiment whisper.
      clearPausePrompt();
      setSentiment(null);
      setSparkleSuggestions(suggestions);
      setIsGenerating(false);
    }, 300);
  };

  /** Insert a suggestion at the cursor — pragmatic DOM approach using the
   *  textarea's id. */
  const handleInsertSuggestion = (text: string) => {
    const textarea = document.getElementById('journal-body') as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    // Read from the live textarea value — the source of truth — so the
    // insertion is never based on a stale `body` closure (which caused
    // suggestions to merge without a separating space).
    const current = textarea?.value ?? body;
    const before = current.slice(0, start);
    const after = current.slice(end);

    // Pad with a single space on each side, but only when needed, so the
    // suggestion never glues onto adjacent words and never doubles spaces.
    const lead = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
    const trail = after.length > 0 && !/^\s/.test(after) ? ' ' : '';
    const newBody = before + lead + text + trail + after;

    setBody(newBody);
    setSparkleSuggestions(null);

    // Set cursor right after the inserted text
    requestAnimationFrame(() => {
      const newCursor = start + lead.length + text.length + trail.length;
      textarea?.focus();
      textarea?.setSelectionRange(newCursor, newCursor);
    });

    // Restart typing timers so glow/prompt don't immediately reappear
    handleTypingStart();
    handleTypingStop();
  };

  /** Tag — open the Space picker. Opening the modal clears the other helper
   *  panels (sparkle strip, pause prompt, sentiment whisper) so nothing
   *  lingers behind the sheet. */
  const handleSpaceClick = () => {
    if (sparkleTimerRef.current) {
      clearTimeout(sparkleTimerRef.current);
      sparkleTimerRef.current = null;
    }
    setSparkleGlow(false);
    setSparkleSuggestions(null);
    clearPausePrompt();
    if (sentimentTimerRef.current) {
      clearTimeout(sentimentTimerRef.current);
      sentimentTimerRef.current = null;
    }
    setSentiment(null);
    setSpacePickerOpen(true);
  };

  /** Apply a preset Space: its default theme + placeholders drive the entry. */
  const handleSelectSpace = (space: Space) => {
    setCustomTheme(null);
    setSpaceId(space.id);
    setTheme(space.defaultTheme);
    setSpacePickerOpen(false);
  };

  /** Create/edit a custom theme: persist it globally and activate it. */
  const handleCreateCustomTheme = (newTheme: CustomTheme) => {
    saveCustomTheme(newTheme);
    setCustomTheme(newTheme);
    setSpaceId(CUSTOM_SPACE_ID);
    setTheme(newTheme.id);
    setSpacePickerOpen(false);
  };

  const now = new Date();
  const timeLabel = now.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Helper panels are mutually exclusive: at most one (Sparkle strip or pause
  // prompt) is ever visible. The pause prompt only shows when no helper is open.
  const sparklePanelOpen = sparkleSuggestions !== null;

  // ── Exit-safe helper panels ─────────────────────────────────────────────
  // Each panel stays mounted through its exit animation (no instant pop). The
  // `*DataRef`s preserve the last content so the panel keeps showing it while
  // it fades out, after the driving state (`sparkleSuggestions`, etc.) clears.
  const {
    present: sparklePresent,
    closing: sparkleClosing,
    entered: sparkleEntered,
  } = useAnimatedPresence(sparklePanelOpen, 300);
  const sparkleDataRef = useRef<string[] | null>(null);
  if (sparkleSuggestions) sparkleDataRef.current = sparkleSuggestions;

  const whisperOpen = !!sentiment && !sparklePanelOpen && !pausePrompt;
  const {
    present: whisperPresent,
    closing: whisperClosing,
    entered: whisperEntered,
  } = useAnimatedPresence(whisperOpen, 300);
  const whisperDataRef = useRef<SentimentResult | null>(null);
  if (sentiment) whisperDataRef.current = sentiment;

  const pauseOpen = !!pausePrompt && !sparklePanelOpen;
  const {
    present: pausePresent,
    closing: pauseClosing,
    entered: pauseEntered,
  } = useAnimatedPresence(pauseOpen, 300);
  const pauseTextRef = useRef<string | null>(null);
  if (pausePrompt) pauseTextRef.current = pausePrompt;

  // The active Space drives the composer's placeholders. A custom theme's
  // placeholders win when set; otherwise fall back to the preset Space's (and
  // ultimately Journal's).
  const activeSpace = getSpaceById(spaceId === CUSTOM_SPACE_ID ? 'journal' : spaceId);
  const titlePlaceholder = customTheme?.placeholderTitle || activeSpace.placeholderTitle;
  const bodyPlaceholder = customTheme?.placeholderBody || activeSpace.placeholderBody;

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* No background layer here by design — the canvas is painted once by
          AppBackground. `relative` only anchors the Space sheet and the Done
          micro-reflection overlay to the composer. */}
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <JournalHeader
            onBack={onBackToHome}
          />

          <JournalMetadata
            dateLabel="Today"
            timeLabel={timeLabel}
            status={currentSaveStatus}
            justSaved={justSaved}
          />

          <div className="w-full border-t border-borderSubtle -mt-1 -mb-1" />

          {/* JournalEditor + inline Sparkle continuation strip — the strip
              sits flush below the body textarea as a native companion. */}
          <div className="flex flex-col">
            <JournalEditor
              title={title}
              onTitleChange={handleTitleChange}
              body={body}
              onBodyChange={handleBodyChange}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              titlePlaceholder={titlePlaceholder}
              bodyPlaceholder={bodyPlaceholder}
              onFocus={() => {
                if (currentSaveStatus === 'autosaved') {
                  setCurrentSaveStatus('editing');
                }
              }}
            />

            {/* Sparkle inline continuation strip — hairline top border,
                compact rounded pills, no card, no shadow, no Dismiss.
                Exit-safe: fades out before unmounting instead of vanishing
                instantly (the suggestions stay in a ref for the exit pass). */}
            {sparklePresent && (
              <div
                ref={sparklePanelRef}
                className={`sparkle-strip gpu-layer ${
                  sparkleClosing
                    ? 'fade-exit fade-exit-active transition-exit'
                    : sparkleEntered
                      ? 'fade-enter fade-enter-active transition-enter'
                      : 'fade-enter transition-enter'
                }`}
              >
                <div className="sparkle-strip-header">Continue...</div>
                <div className="sparkle-strip-pills">
                  {(sparkleSuggestions ?? sparkleDataRef.current)?.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="sparkle-pill"
                      onClick={() => handleInsertSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment whisper — a single, dismissible line reflecting the
                emotional tone of the draft. Shown only when no other helper
                (sparkle strip or pause prompt) is open, so it never competes
                for attention. */}
            {whisperPresent && (
              <div
                key={whisperDataRef.current?.key ?? 'whisper'}
                className={`sentiment-whisper gpu-layer ${
                  whisperClosing
                    ? 'fade-exit fade-exit-active transition-exit'
                    : whisperEntered
                      ? 'fade-enter fade-enter-active transition-enter'
                      : 'fade-enter transition-enter'
                }`}
                role="status"
                aria-live="polite"
                onClick={dismissSentiment}
              >
                <span className="sentiment-whisper-text">
                  {whisperDataRef.current?.message}
                </span>
                <button
                  type="button"
                  className="sentiment-whisper-dismiss"
                  aria-label="Dismiss sentiment hint"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissSentiment();
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Pause prompt — a gentle nudge when the user stops writing. Tap to
              dismiss. Hidden whenever the Sparkle strip is open so only one
              helper is ever visible. Exit-safe: rises up out with a fade
              instead of disappearing instantly. */}
          {pausePresent && (
            <div
              className={`pause-prompt gpu-layer ${
                pauseClosing
                  ? 'fadeUp-exit fadeUp-exit-active transition-exit'
                  : pauseEntered
                    ? 'fadeUp-enter fadeUp-enter-active transition-enter'
                    : 'fadeUp-enter transition-enter'
              }`}
              onClick={() => setPausePrompt(null)}
            >
              {pauseTextRef.current}
            </div>
          )}

          {/* Theme selector — required, uses the canonical theme taxonomy. An
              active custom theme is appended so its chip shows as selected. The
              small top margin keeps the writing box from being crowded by the
              themes section, giving the entry area a touch more breathing room. */}
          <ThemeChipGroup
            className="mt-2"
            selectedThemeId={theme}
            onSelectTheme={(id) => setTheme(id)}
            extraThemes={
              customTheme ? [{ id: customTheme.id, label: customTheme.label }] : undefined
            }
          />

          {/* Past writing on this theme — a quiet, data-driven companion that
              surfaces recent entries for the selected theme. Renders nothing
              until the journal has history on that theme, so a fresh composer
              stays calm and the panel fills itself over time. Deliberately not
              keyed on the theme: remounting on every chip tap replayed the
              fade-up and jumped the layout underneath the canvas. */}
          <RecentOnTheme
            theme={theme}
            entries={entries}
            excludeId={editingEntry?.id}
            onOpenEntry={onOpenEntry}
            onExploreThread={onExploreThread}
          />
        </div>
      </div>

      {/* Pinned WritingToolbar — full width, outside scroll padding */}
      <div className="shrink-0">
        {voiceError ? (
          <p className="px-5 pb-1 font-sans text-[12.5px] text-error leading-snug">
            {voiceError}
          </p>
        ) : voiceInterim ? (
          <p className="px-5 pb-1 font-sans text-[13px] text-muted italic truncate">
            {voiceInterim}…
          </p>
        ) : null}
        <WritingToolbar
          onDoneClick={handleDone}
          doneDisabled={reflection !== null}
          onMicClick={handleMic}
          isRecording={voice.recording}
          isPreparing={voice.status === 'loading'}
          micAvailable={voice.supported}
          onSpaceClick={handleSpaceClick}
          spacePickerOpen={spacePickerOpen}
          onSparkleClick={handleSparkleClick}
          isGenerating={isGenerating}
          hasSparkleGlow={sparkleGlow}
          sparklePanelOpen={sparklePanelOpen}
        />
      </div>

      {/* Pinned BottomNavigation */}
      <div className="shrink-0">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* Space picker — a bottom sheet that sets the entry's context (Space →
          placeholders + default theme). Clipped to the composer because this
          root is the app frame's relative container. */}
      <SpacePickerSheet
        isOpen={spacePickerOpen}
        onClose={() => setSpacePickerOpen(false)}
        selectedSpaceId={spaceId}
        onSelectSpace={handleSelectSpace}
        customTheme={customTheme}
        onCreateCustomTheme={handleCreateCustomTheme}
      />

      {/* Micro-reflection — a brief one-line insight shown for ~2s after
          Done. Pure overlay (pointer-events: none) so it never captures
          taps; the Done button is disabled while it's visible instead.
          Exit-safe: Presence keeps it mounted through the 400ms fade-out
          and only then calls onExited (back to Home), so the composer never
          navigates away behind a half-removed overlay. */}
      <Presence
        show={reflection !== null}
        duration={400}
        enter="fade-enter"
        enterActive="fade-enter-active"
        exit="fade-exit"
        exitActive="fade-exit-active"
        className="reflection-overlay"
        onExited={onBackToHome}
      >
        <p className="reflection-text">{reflection}</p>
      </Presence>
    </div>
  );
};
