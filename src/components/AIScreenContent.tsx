import React, { useState, useRef, useEffect } from 'react';
import { AIHeader } from './AIHeader';
import { MemoryContextCard } from './MemoryContextCard';
import { SuggestionRow } from './SuggestionRow';
import { UserMessageBubble, AssistantMessageBubble } from './MessageBubbles';
import { Composer } from './Composer';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { Skeleton, useLoadGuard } from './Skeleton';
import { ErrorState } from './ErrorState';
import {
  useJouspaceIntelligence,
  loadChatMessages,
} from '../hooks/useJouspaceIntelligence';
import { journalStore } from '../store';
import { useKeyboard } from '../hooks/useAdaptiveKeyboard';
import { readAiAttach, clearAiAttach } from '../utils/pickerStore';
import {
  readAiComposerDraft,
  writeAiComposerDraft,
  clearAiComposerDraft,
} from '../utils/aiDraft';
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
  /** Opens the entry picker as a separate route (AI "attach" action). */
  onOpenEntryPicker?: () => void;
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
  onOpenEntryPicker,
}) => {
  // Restore the persisted composer draft on mount so a half-typed message
  // survives any remount (tab switch, refresh elsewhere, reload). Cleared when
  // the message is sent — see handleSend.
  const [composerValue, setComposerValue] = useState(() => readAiComposerDraft());

  // Restore persisted chat history on mount so navigation doesn't lose it.
  const [initialMessages] = useState(() => loadChatMessages());
  const ai = useJouspaceIntelligence('chat', initialMessages);

  // Apply any pending "attach" selected in the entry-picker route (one-shot
  // transient store). Runs after mount so it composes with the restored chat.
  useEffect(() => {
    const title = readAiAttach();
    if (title) {
      setComposerValue((prev) => {
        const next = (prev ? `${prev}\n` : '') + `Re: ${title}`;
        writeAiComposerDraft(next);
        return next;
      });
      clearAiAttach();
    }
  }, []);

  // Never let the "waiting for AI" state hang forever — after 8s, surface an
  // error so the composer re-enables and the user can resend.
  const chatTimedOut = useLoadGuard(ai.isThinking, 8000);

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

  // Pin to the bottom whenever the thread grows — a new text message or streamed
  // tokens — so a streaming reply stays in view. Only auto-scrolls while the
  // user is already at the bottom (reading history is never yanked).
  useEffect(() => {
    if (!atBottomRef.current) return;
    scrollToBottom(false);
  }, [ai.messages, ai.isThinking, ai.isStreaming]);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? composerValue).trim();
    if (!text) return;
    setComposerValue('');
    clearAiComposerDraft();
    ai.send(text);
  };

  const handleComposerChange = (value: string) => {
    setComposerValue(value);
    writeAiComposerDraft(value);
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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-4 pt-2 pb-4"
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
                    {ai.error || 'Jouspace Intelligence is unavailable. Please try again.'}
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
          keyboardVisible ? 'pb-composer-kb' : 'pb-3'
        }`}
      >
        <Composer
          value={composerValue}
          onChange={handleComposerChange}
          onSend={() => handleSend()}
          onAttach={() => onOpenEntryPicker?.()}
          onFocus={() => setInputMode('default')}
          disabled={ai.isThinking || ai.isStreaming}
        />
      </div>

      {/* Pinned BottomNavigation — hidden while the software keyboard is open:
          the shell is already the visible viewport, so the Composer sits flush
          on the keyboard and the nav must not cover the input. */}
      {!keyboardVisible && (
        <div className="shrink-0">
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      )}
    </div>
  );
};
