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
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  title,
  onTitleChange,
  body,
  onBodyChange,
  onFocus,
  onBlur,
  className = '',
  readOnly = false,
}) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content without scrollbars inside editor
  useEffect(() => {
    if (bodyTextareaRef.current) {
      bodyTextareaRef.current.style.height = 'auto';
      bodyTextareaRef.current.style.height = `${bodyTextareaRef.current.scrollHeight}px`;
    }
  }, [body]);

  return (
    <div className={`flex flex-col w-full text-left gap-6 ${className}`}>
      {/* Journal Title Input */}
      <input
        ref={titleInputRef}
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        placeholder="What I'm trying to understand"
        className="w-full font-serif text-[26px] text-[#0D102B] font-normal leading-tight tracking-tight bg-transparent border-none outline-none focus:outline-none p-0 caret-[#6D4FD7] placeholder:text-[#8B8998]/50 selection:bg-[#6D4FD7]/15"
      />

      {/* Journal Body Textarea */}
      <textarea
        ref={bodyTextareaRef}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        placeholder="Write your thoughts quietly..."
        rows={4}
        className="w-full font-sans text-[15.5px] text-[#0D102B] leading-[1.8] font-normal bg-transparent border-none outline-none focus:outline-none resize-none p-0 caret-[#6D4FD7] placeholder:text-[#8B8998]/50 selection:bg-[#6D4FD7]/15 overflow-hidden transition-all"
      />
    </div>
  );
};
