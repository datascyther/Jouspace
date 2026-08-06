import React, { useState, useEffect, useRef } from 'react';
import { Entry } from './EntryRow';
import { X, Sparkles, Send, Check } from 'lucide-react';
import { useJouspaceIntelligence } from '../hooks/useJouspaceIntelligence';

// ── The insight that anchors the reflection drawer ────────────────────────────
// This is surfaced from the Home screen AIInsightCard.
// In the future this will be passed as a prop from the triggering surface.
const DEFAULT_REFLECT_INSIGHT =
  'You often return to consistency when you write after a gap.';

// ─────────────────────────────────────────────────────────────────────────────
// WriteDrawer — unchanged
// ─────────────────────────────────────────────────────────────────────────────

interface WriteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialContent?: string;
}

export const WriteDrawer: React.FC<WriteDrawerProps> = ({
  isOpen,
  onClose,
  initialTitle = '',
  initialContent = '',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-xs p-0 md:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFEFC] rounded-t-[28px] md:rounded-[28px] border border-[#E7E1EF] shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E4E0]">
          <span className="font-serif text-lg text-[#0D102B]">
            {initialTitle ? 'Continue writing' : 'New journal entry'}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8998] hover:text-[#0D102B] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-serif text-xl text-[#0D102B] bg-transparent border-b border-[#E9E4E0] pb-2 focus:outline-none focus:border-[#6D4FD7] placeholder:text-[#8B8998]/60 placeholder:font-serif"
          />
          <textarea
            rows={8}
            placeholder="Write your thoughts quietly..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full font-sans text-[15px] leading-relaxed text-[#0D102B] bg-transparent resize-none focus:outline-none placeholder:text-[#8B8998]/60"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E9E4E0]">
          <span className="text-xs text-[#8B8998] font-sans">
            ✦ Auto-saved to private memory
          </span>
          <button
            onClick={handleSave}
            disabled={saved}
            className="inline-flex items-center gap-2 bg-[#6D4FD7] hover:bg-[#5C3EC5] text-white font-sans text-sm font-medium px-5 py-2.5 rounded-[14px] transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Entry'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AIReflectDrawer — wired to useJouspaceIntelligence('reflect')
// ─────────────────────────────────────────────────────────────────────────────

interface AIReflectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** The insight being reflected on — defaults to the home screen insight */
  insight?: string;
}

export const AIReflectDrawer: React.FC<AIReflectDrawerProps> = ({
  isOpen,
  onClose,
  insight = DEFAULT_REFLECT_INSIGHT,
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

  // Kick off the initial reflection as soon as the drawer opens
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      ai.send('', { insight });
    }
    if (!isOpen) {
      hasOpenedRef.current = false;
      ai.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || ai.isThinking || ai.isStreaming) return;
    setInputValue('');
    ai.send(text, { insight });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-xs p-0 md:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFEFC] rounded-t-[28px] md:rounded-[28px] border border-[#E7E1EF] shadow-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E4E0]">
          <div className="flex items-center gap-2 text-[#6D4FD7]">
            <Sparkles className="w-4 h-4 stroke-[2]" />
            <span className="font-serif text-lg text-[#0D102B]">AI Reflection</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#8B8998] hover:text-[#0D102B] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anchor insight quote */}
        <div className="p-4 bg-[#F0ECFF]/60 rounded-[16px] border border-[#E7E1EF]/50 text-sm text-[#0D102B] font-serif leading-relaxed">
          "{insight}"
        </div>

        {/* Streamed responses */}
        <div className="flex flex-col gap-3 my-2">
          {/* Thinking indicator — shown while waiting for first token */}
          {ai.isThinking && (
            <div className="p-4 bg-[#FBF9F5] rounded-[16px] border border-[#E9E4E0]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B8998] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B8998] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B8998] animate-bounce" />
              </div>
            </div>
          )}

          {/* Assistant messages (excludes the empty user seed message) */}
          {ai.messages
            .filter((m) => m.role === 'assistant')
            .map((m) => (
              <div
                key={m.id}
                className="p-4 bg-[#FBF9F5] rounded-[16px] border border-[#E9E4E0] text-[14.5px] text-[#0D102B] font-sans leading-relaxed whitespace-pre-line"
              >
                {m.text}
                {/* Streaming cursor — blink while this is the last streaming message */}
                {ai.isStreaming &&
                  m.id === ai.messages[ai.messages.length - 1]?.id && (
                    <span className="inline-block w-0.5 h-[1em] bg-[#6D4FD7] ml-0.5 animate-pulse align-middle" />
                  )}
              </div>
            ))}

          {/* User follow-up messages */}
          {ai.messages
            .filter((m) => m.role === 'user' && m.text.trim())
            .map((m) => (
              <div
                key={m.id}
                className="self-end max-w-[85%] px-4 py-3 bg-[#F0ECFF] rounded-[16px] text-[14px] text-[#0D102B] font-sans leading-relaxed"
              >
                {m.text}
              </div>
            ))}

          {/* Error state */}
          {ai.error && (
            <p className="text-[13px] text-[#8B8998] font-sans text-center py-1">
              {ai.error}
            </p>
          )}

          <div ref={responsesEndRef} />
        </div>

        {/* Follow-up input */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E9E4E0]">
          <input
            type="text"
            placeholder="Add your thought..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={ai.isThinking || ai.isStreaming}
            className="flex-1 bg-[#FBF9F5] border border-[#E7E1EF] rounded-[14px] px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-[#6D4FD7] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || ai.isThinking || ai.isStreaming}
            aria-label="Send reflection"
            className="p-2.5 bg-[#6D4FD7] text-white rounded-[14px] hover:bg-[#5C3EC5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EntryDetailDrawer — unchanged
// ─────────────────────────────────────────────────────────────────────────────

interface EntryDetailDrawerProps {
  entry: Entry | null;
  onClose: () => void;
}

export const EntryDetailDrawer: React.FC<EntryDetailDrawerProps> = ({
  entry,
  onClose,
}) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-xs p-0 md:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFEFC] rounded-t-[28px] md:rounded-[28px] border border-[#E7E1EF] shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#E9E4E0]">
          <span className="text-xs text-[#8B8998] font-sans">{entry.date}</span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8998] hover:text-[#0D102B] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="font-serif text-xl text-[#0D102B] font-medium leading-snug">
          {entry.title}
        </h3>

        <div className="flex items-center gap-2">
          <span className="bg-[#F0ECFF] text-[#68677E] text-xs px-3 py-1 rounded-full font-sans font-medium">
            {entry.theme}
          </span>
        </div>

        <p className="font-sans text-[15px] leading-relaxed text-[#68677E] pt-2">
          {entry.content || 'No additional details available for this entry.'}
        </p>
      </div>
    </div>
  );
};
