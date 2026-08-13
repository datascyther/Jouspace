import React, { useState, useEffect, useId, useRef } from 'react';
import { Entry } from './EntryRow';
import { X, Sparkles, Send, Pencil, Trash2 } from 'lucide-react';
import { useJouspaceIntelligence } from '../hooks/useJouspaceIntelligence';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { LazyMarkdown } from './LazyMarkdown';

// Neutral anchor for the reflection drawer (no fabricated insight in v1).
const DEFAULT_REFLECT_PROMPT = 'Reflect on your recent writing.';

// ─────────────────────────────────────────────────────────────────────────────
// AIReflectDrawer — wired to useJouspaceIntelligence('reflect')
// ─────────────────────────────────────────────────────────────────────────────

interface AIReflectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** The insight being reflected on — defaults to a neutral prompt. */
  insight?: string;
}

export const AIReflectDrawer: React.FC<AIReflectDrawerProps> = ({
  isOpen,
  onClose,
  insight = DEFAULT_REFLECT_PROMPT,
}) => {
  const [inputValue, setInputValue] = useState('');
  const responsesEndRef = useRef<HTMLDivElement>(null);

  const ai = useJouspaceIntelligence('reflect');

  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({
    id: drawerId,
    active: isOpen,
    onClose,
    containerRef: drawerRef,
  });

  // Auto-scroll to newest response as tokens stream in
  useEffect(() => {
    if (ai.isStreaming || ai.messages.length > 0) {
      responsesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ai.messages, ai.isStreaming]);

  // Kick off the initial reflection as soon as the drawer opens. ai.send aborts
  // any in-flight stream; the cleanup abort() prevents React 19 StrictMode's
  // dev double-invoke from double-streaming.
  useEffect(() => {
    if (!isOpen) {
      ai.reset();
      return;
    }
    ai.send('', { insight });
    return () => ai.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || ai.isThinking || ai.isStreaming) return;
    setInputValue('');
    ai.send(text, { insight });
  };

  // Exit-safe: fade the whole drawer out before it unmounts (no instant pop).
  const { present, closing, entered } = useAnimatedPresence(isOpen, 300);
  if (!present) return null;

  const drawerClass = closing
    ? 'fade-exit fade-exit-active transition-exit'
    : entered
      ? 'fade-enter fade-enter-active transition-enter'
      : 'fade-enter transition-enter';

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal={!closing}
      aria-label="AI reflection"
      className={`absolute inset-0 z-50 flex items-end md:items-center justify-center bg-primaryText/30 p-0 md:p-4 gpu-layer ${drawerClass}`}
    >
      <div className="w-full max-w-lg bg-surface rounded-t-[28px] md:rounded-[28px] border border-borderSubtle shadow-2xl p-6 flex flex-col gap-5 max-h-[85%] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="w-4 h-4 stroke-2" />
            <span className="font-serif text-lg text-primaryText">AI Reflection</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-muted hover:text-primaryText rounded-full transition-all duration-150 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anchor insight quote */}
        <div className="p-4 bg-accentSoft/60 rounded-2xl border border-borderSubtle/50 text-sm text-primaryText font-serif leading-relaxed">
          "{insight}"
        </div>

        {/* Streamed responses */}
        <div className="flex flex-col gap-3 my-2">
          {ai.isThinking && (
            <div className="p-4 bg-base rounded-2xl border border-borderSubtle">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" />
              </div>
            </div>
          )}

          {ai.messages
            .filter((m) => m.role === 'assistant')
            .map((m) => (
              <div
                key={m.id}
                className="p-4 bg-base rounded-2xl border border-borderSubtle text-[14.5px] text-primaryText font-sans leading-relaxed"
              >
                <LazyMarkdown text={m.text} />
                {ai.isStreaming &&
                  m.id === ai.messages[ai.messages.length - 1]?.id && (
                    <span className="inline-block w-0.5 h-[1em] bg-accent ml-0.5 animate-pulse align-middle" />
                  )}
              </div>
            ))}

          {ai.messages
            .filter((m) => m.role === 'user' && m.text.trim())
            .map((m) => (
              <div
                key={m.id}
                className="self-end max-w-[85%] px-4 py-3 bg-accentSoft rounded-2xl text-[14px] text-primaryText font-sans leading-relaxed"
              >
                {m.text}
              </div>
            ))}

          {ai.error && (
            <p className="text-[13px] text-muted font-sans text-center py-1">
              {ai.error}
            </p>
          )}

          <div ref={responsesEndRef} />
        </div>

        {/* Follow-up input */}
        <div className="flex items-center gap-2 pt-2 border-t border-borderSubtle">
          <input
            type="text"
            placeholder="Add your thought..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={ai.isThinking || ai.isStreaming}
            className="flex-1 bg-base border border-borderSubtle rounded-[14px] px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || ai.isThinking || ai.isStreaming}
            aria-label="Send reflection"
            className="p-2.5 bg-accent text-white rounded-[14px] hover:bg-accentHover transition-all duration-150 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EntryDetailDrawer — view / edit / delete a single entry
// ─────────────────────────────────────────────────────────────────────────────

interface EntryDetailDrawerProps {
  entry: Entry | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const EntryDetailDrawer: React.FC<EntryDetailDrawerProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
}) => {
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({
    id: drawerId,
    active: entry !== null,
    onClose,
    containerRef: drawerRef,
  });

  // Keep the last entry so the drawer's content stays stable while it fades
  // out (the entry prop is nulled by the parent the moment closing starts).
  const lastEntryRef = useRef<Entry | null>(entry);
  if (entry) lastEntryRef.current = entry;
  const activeEntry = entry ?? lastEntryRef.current;

  // Exit-safe: fade the whole drawer out before it unmounts (no instant pop).
  // `activeEntry` is only null on the very first mount (nothing to show yet);
  // during open it's the live entry, during closing it's the captured last one.
  const { present, closing, entered } = useAnimatedPresence(entry !== null, 300);
  if (!present || !activeEntry) return null;

  const drawerClass = closing
    ? 'fade-exit fade-exit-active transition-exit'
    : entered
      ? 'fade-enter fade-enter-active transition-enter'
      : 'fade-enter transition-enter';

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal={!closing}
      aria-label="Entry details"
      className={`absolute inset-0 z-50 flex items-end md:items-center justify-center bg-primaryText/30 p-0 md:p-4 gpu-layer ${drawerClass}`}
    >
      <div className="w-full max-w-lg bg-surface rounded-t-[28px] md:rounded-[28px] border border-borderSubtle shadow-2xl p-6 flex flex-col gap-4 max-h-[85%] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
          <span className="text-xs text-muted font-sans">{activeEntry.date}</span>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                aria-label="Edit entry"
                className="p-1.5 text-muted hover:text-primaryText rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="Delete entry"
                className="p-1.5 text-error hover:bg-errorBg rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-error/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-muted hover:text-primaryText rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <h3 className="font-serif text-xl text-primaryText font-medium leading-snug">
          {activeEntry.title}
        </h3>

        <div className="flex items-center gap-2">
          <span className="bg-accentSoft text-secondaryText text-xs px-3 py-1 rounded-full font-sans font-medium">
            {activeEntry.theme}
          </span>
        </div>

        <p className="font-sans text-[15px] leading-relaxed text-secondaryText pt-2">
          {activeEntry.content || 'No additional details available for this entry.'}
        </p>
      </div>
    </div>
  );
};
