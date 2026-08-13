import React, { useRef, useEffect } from 'react';

interface JournalEditorProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  body: string;
  onBodyChange: (newBody: string) => void;
  isEditing?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  readOnly?: boolean;
  /** Called when typing starts (key press) — used by the pause-prompt companion. */
  onTypingStart?: () => void;
  /** Called when typing stops (key release) — used by the pause-prompt companion. */
  onTypingStop?: () => void;
  /** Dynamic placeholder for the title input — driven by the selected Space. */
  titlePlaceholder?: string;
  /** Dynamic placeholder for the body textarea — driven by the selected Space. */
  bodyPlaceholder?: string;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  title,
  onTitleChange,
  body,
  onBodyChange,
  onFocus,
  onBlur,
  onTypingStart,
  onTypingStop,
  className = '',
  readOnly = false,
  titlePlaceholder = "What I'm trying to understand",
  bodyPlaceholder = 'Write your thoughts quietly...',
}) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content without scrollbars inside editor.
  // Only commits when the height actually changes, so a keystroke that doesn't
  // add a line costs no layout write (and nothing below it shifts).
  useEffect(() => {
    const el = bodyTextareaRef.current;
    if (!el) return;
    const previous = el.style.height;
    el.style.height = 'auto';
    const next = `${el.scrollHeight}px`;
    el.style.height = previous === next ? previous : next;
  }, [body]);

  return (
    <div className={`flex flex-col w-full text-left gap-6 ${className}`}>
      {/* Journal Title Input */}
      <input
        ref={titleInputRef}
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={readOnly ? undefined : onTypingStart}
        onKeyUp={readOnly ? undefined : onTypingStop}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        placeholder={titlePlaceholder}
        className="w-full font-serif text-[26px] text-primaryText font-normal leading-tight tracking-tight bg-transparent border-none outline-none focus:outline-none p-0 caret-accent placeholder:text-muted/50 selection:bg-accent/15"
      />

      {/* Journal Body Textarea */}
      <textarea
        id="journal-body"
        ref={bodyTextareaRef}
        value={body}
        onChange={(e) => {
          onBodyChange(e.target.value);
          onTypingStop?.();
        }}
        onKeyDown={readOnly ? undefined : onTypingStart}
        onKeyUp={readOnly ? undefined : onTypingStop}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        placeholder={bodyPlaceholder}
        rows={7}
        className="w-full font-sans text-[15.5px] text-primaryText leading-[1.8] font-normal bg-transparent border-none outline-none focus:outline-none resize-none p-0 caret-accent placeholder:text-muted/50 selection:bg-accent/15 overflow-hidden transition-colors"
      />
    </div>
  );
};
