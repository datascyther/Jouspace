import React, { useState, useEffect, useRef } from 'react';
import { Entry } from './EntryRow';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { TiArrowRepeat } from 'react-icons/ti';
import { useJouspaceIntelligence } from '../hooks/useJouspaceIntelligence';
import { LazyMarkdown } from './LazyMarkdown';

// Neutral anchor for the reflection screen (no fabricated insight in v1).
const DEFAULT_REFLECT_PROMPT = 'Reflect on your recent writing.';

// ─────────────────────────────────────────────────────────────────────────────
// AIReflectScreen — wired to useJouspaceIntelligence('reflect')
// ─────────────────────────────────────────────────────────────────────────────

interface AIReflectScreenProps {
  onBack: () => void;
  /** The insight being reflected on — defaults to a neutral prompt. */
  insight?: string;
}

export const AIReflectScreen: React.FC<AIReflectScreenProps> = ({
  onBack,
  insight = DEFAULT_REFLECT_PROMPT,
}) => {
  const [inputValue, setInputValue] = useState('');
  const responsesEndRef = useRef<HTMLDivElement>(null);

  const ai = useJouspaceIntelligence('reflect');

  // Auto-scroll to newest response as tokens stream in
  useEffect(() => {
    if (ai.isStreaming || ai.messages.length > 0) {
      responsesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ai.messages, ai.isStreaming]);

  // Kick off the initial reflection as soon as the screen mounts. ai.send aborts
  // any in-flight stream; the cleanup abort() prevents React 19 StrictMode's
  // dev double-invoke from double-streaming.
  useEffect(() => {
    ai.send('', { insight });
    return () => ai.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || ai.isThinking || ai.isStreaming) return;
    setInputValue('');
    ai.send(text, { insight });
  };

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0 border-b border-borderSubtle">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-accent">
          <TbSparkle className="w-4 h-4 stroke-2" />
          <span className="font-serif text-lg text-primaryText">AI Reflection</span>
        </div>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      {/* Scrollable responses + anchor */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-6 pb-4 pb-safe flex flex-col gap-3">
        {/* Anchor insight quote */}
        <div className="p-4 bg-accentSoft/60 rounded-2xl border border-borderSubtle/50 text-sm text-primaryText font-serif leading-relaxed mt-4">
          "{insight}"
        </div>

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
      <div className="flex items-center gap-2 p-4 pt-2 border-t border-borderSubtle shrink-0">
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
          <TiArrowRepeat className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EntryDetailScreen — view / edit / delete a single entry
// ─────────────────────────────────────────────────────────────────────────────

interface EntryDetailScreenProps {
  entry: Entry;
  onBack: () => void;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entry: Entry) => void;
}

export const EntryDetailScreen: React.FC<EntryDetailScreenProps> = ({
  entry,
  onBack,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0 border-b border-borderSubtle">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted font-sans">{entry.date}</span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit?.(entry)}
              aria-label="Edit entry"
              className="p-1.5 text-muted hover:text-primaryText rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete?.(entry)}
              aria-label="Delete entry"
              className="p-1.5 text-error hover:bg-errorBg rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-error/20 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onBack}
            aria-label="Back"
            className="p-1.5 text-muted hover:text-primaryText rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-6 pb-4 pb-safe">
        <h3 className="font-serif text-xl text-primaryText font-medium leading-snug mt-4">
          {entry.title}
        </h3>

        <div className="flex items-center gap-2 mt-2">
          <span className="bg-accentSoft text-secondaryText text-xs px-3 py-1 rounded-full font-sans font-medium">
            {entry.theme}
          </span>
        </div>

        <p className="font-sans text-[15px] leading-relaxed text-secondaryText pt-4">
          {entry.content || 'No additional details available for this entry.'}
        </p>
      </div>
    </div>
  );
};
