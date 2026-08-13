import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AIHeader } from './AIHeader';
import { MemoryContextCard } from './MemoryContextCard';
import { SuggestionRow } from './SuggestionRow';
import { UserMessageBubble, AssistantMessageBubble } from './MessageBubbles';
import { Composer } from './Composer';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { EntryPickerSheet } from './EntryPickerSheet';
import { Skeleton, useLoadGuard } from './Skeleton';
import { ErrorState } from './ErrorState';
import {
  useJouspaceIntelligence,
  RUNTIME_UNAVAILABLE_MESSAGE,
  loadChatMessages,
} from '../hooks/useJouspaceIntelligence';
import { journalStore } from '../store';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useKeyboard } from '../hooks/useAdaptiveKeyboard';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { usePermission } from '../permissions/usePermissions';
import type { Entry } from './EntryRow';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  citationCount?: number;
  citationDates?: string[];
}

/** Neutral prompts shown when the conversation is empty. */
export const DEFAULT_SUGGESTIONS: string[] = [
  'Why do I keep returning to clarity?',
  'Show me what changed this month.',
  'Help me continue my last entry.',
];

interface AIScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userInitials?: string;
  isNoMemoryContext?: boolean;
  /** User-chosen AI context label (from the context picker). */
  contextLabel?: string | null;
  /** Journal entries, used by attach + citation lookups. */
  entries?: Entry[];
  onAvatarClick?: () => void;
  onOpenHistory?: () => void;
  onOpenContextPicker?: () => void;
  onOpenEntry?: (id: string) => void;
}

/** Real themes present in the journal, used as AI memory context. */
function realContextThreads(): string[] {
  const set = new Set<string>();
  for (const e of journalStore.list()) set.add(e.theme);
  return Array.from(set);
}

export const AIScreenContent: React.FC<AIScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'J',
  isNoMemoryContext = false,
  contextLabel = null,
  entries = [],
  onAvatarClick = () => {},
  onOpenHistory,
  onOpenContextPicker,
  onOpenEntry,
}) => {
  const [composerValue, setComposerValue] = useState('');
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  // Keyboard: Escape closes the attach entry-picker sheet.
  useEscapeKey(() => setIsAttachOpen(false), isAttachOpen);

  // Restore persisted chat history on mount so navigation doesn't lose it.
  const [initialMessages] = useState(() => loadChatMessages());
  const ai = useJouspaceIntelligence('chat', initialMessages);

  // Never let the "waiting for AI" state hang forever — after 8s, surface an
  // error so the user can retry instead of staring at a frozen skeleton.
  const chatTimedOut = useLoadGuard(ai.isThinking, 8000);

  const handleChatRetry = () => {
    // Cancel the hung request; the composer re-enables so the user can resend.
    ai.abort();
  };

  // ── Adaptive keyboard (web/Capacitor) ──────────────────────────────────────
  // The app shell height follows window.visualViewport (set by KeyboardProvider
  // via the --vvh CSS var), so the composer naturally rises above the keyboard.
  // Here we keep the conversation pinned to the bottom and dismiss the keyboard
  // when the user scrolls the thread.
  const { keyboardVisible, setInputMode } = useKeyboard();
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const programmaticRef = useRef(false);
  const keyboardVisibleRef = useRef(keyboardVisible);
  keyboardVisibleRef.current = keyboardVisible;

  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    programmaticRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    window.setTimeout(() => {
      programmaticRef.current = false;
    }, 350);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distanceFromBottom < 48;
    // Scroll-to-dismiss: typing user scrolls the thread → drop the keyboard
    // (web equivalent of RN keyboardDismissMode="on-drag").
    if (keyboardVisibleRef.current && !programmaticRef.current) {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        active.blur();
      }
    }
  };

  // Pin to bottom when the keyboard toggles, but only if the user was already at
  // the bottom — otherwise preserve their scroll position while reading.
  const prevKbVisible = useRef(false);
  useEffect(() => {
    if (keyboardVisible === prevKbVisible.current) return;
    prevKbVisible.current = keyboardVisible;
    if (atBottomRef.current) scrollToBottom(false);
  }, [keyboardVisible]);

  // Voice input — shared Web Speech API hook (gracefully disabled if
  // unsupported). It commits finalized transcript segments to the composer and
  // streams a live interim preview so the user sees words as they speak.
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const voice = useVoiceInput({
    onFinal: (text) => {
      setComposerValue((prev) => {
        const sep = prev.length > 0 && !/\s$/.test(prev) ? ' ' : '';
        return prev + sep + text;
      });
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
      // Auto-dismiss the notice after a few seconds.
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

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? composerValue).trim();
    if (!text) return;
    setComposerValue('');
    ai.send(text);
  };

  const handleSuggestion = (question: string) => handleSend(question);

  // Map citation dates → journal entries, then open the detail drawer.
  const handleCitation = (msg: AIMessage) => {
    if (!msg.citationDates || msg.citationDates.length === 0) return;
    const list = entries.length > 0 ? entries : journalStore.list();
    if (list.length === 0) return;
    const match =
      list.find((e) => msg.citationDates!.includes(e.date)) ?? list[0];
    onOpenEntry?.(match.id);
  };

  const handleAttachSelect = (entry: Entry) => {
    setComposerValue((prev) => (prev ? `${prev}\n` : '') + `Re: ${entry.title}`);
    setIsAttachOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4"
      >
        <div className="flex flex-col gap-7 w-full">
          <AIHeader
            userInitials={userInitials}
            onHistoryClick={onOpenHistory}
            onAvatarClick={onAvatarClick}
          />

          <section>
            <MemoryContextCard
              label="Using your memory"
              threads={isNoMemoryContext ? [] : realContextThreads()}
              actionText="Change context"
              isEmptyContext={isNoMemoryContext}
              contextLabel={contextLabel}
              onChangeContext={onOpenContextPicker}
            />
          </section>

          <section className="flex flex-col gap-3 text-left">
            <h2 className="font-serif text-[28px] text-primaryText font-normal leading-[1.18] tracking-tight">
              What should we look
              <br />
              at together?
            </h2>
            <p className="font-sans text-[14.5px] text-muted font-normal leading-[1.6]">
              Ask about a pattern, revisit an entry,
              <br />
              or reflect on what keeps showing up.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            {DEFAULT_SUGGESTIONS.map((q) => (
              <SuggestionRow key={q} question={q} onClick={handleSuggestion} />
            ))}
          </section>

          <div className="w-full border-t border-borderSubtle" />

          <section className="flex flex-col gap-4">
            {ai.messages.length === 0 && !ai.isThinking ? (
              <p className="font-sans text-[14px] text-muted py-2 text-left">
                Your reflections with Jouspace will appear here.
              </p>
            ) : (
              <>
                {ai.messages.map((msg) =>
                  msg.role === 'user' ? (
                    <UserMessageBubble
                      key={msg.id}
                      text={msg.text}
                      timestamp={msg.timestamp}
                    />
                  ) : (
                    <AssistantMessageBubble
                      key={msg.id}
                      text={msg.text}
                      citationCount={msg.citationCount}
                      citationDates={msg.citationDates}
                      onCitationClick={() => handleCitation(msg)}
                    />
                  )
                )}

                {ai.isThinking &&
                  (chatTimedOut ? (
                    <ErrorState
                      title="Couldn't load"
                      message="Jouspace is taking too long to respond."
                      onRetry={handleChatRetry}
                    />
                  ) : (
                    <Skeleton
                      layout="chat"
                      count={1}
                      composer={false}
                      className="animate-fadeIn200"
                    />
                  ))}

                {ai.error && (
                  <p className="font-sans text-[13px] text-muted py-1">
                    {ai.error === RUNTIME_UNAVAILABLE_MESSAGE
                      ? RUNTIME_UNAVAILABLE_MESSAGE
                      : 'Jouspace Intelligence is unavailable. Please try again.'}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Pinned Composer */}
      <div
        className={`shrink-0 px-4 pt-1 transition-[padding] duration-200 ${
          keyboardVisible ? 'pb-composer-kb' : 'pb-2'
        }`}
      >
        {voiceError ? (
          <p className="px-1 pb-1.5 font-sans text-[12.5px] text-error leading-snug">
            {voiceError}
          </p>
        ) : voiceInterim ? (
          <p className="px-1 pb-1.5 font-sans text-[13px] text-muted italic truncate">
            {voiceInterim}…
          </p>
        ) : null}
        <Composer
          value={composerValue}
          onChange={setComposerValue}
          onSend={() => handleSend()}
          onAttach={() => setIsAttachOpen(true)}
          onMic={handleMic}
          onFocus={() => setInputMode('default')}
          micDisabled={!voice.supported}
          isRecording={voice.recording}
          isPreparing={voice.status === 'loading'}
          disabled={ai.isThinking || ai.isStreaming}
        />
      </div>

      {/* Entry picker for attach */}
      <EntryPickerSheet
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        entries={entries}
        onSelect={handleAttachSelect}
      />

      {/* Pinned BottomNavigation */}
      <div className="shrink-0">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          hideOnKeyboard
        />
      </div>
    </div>
  );
};
