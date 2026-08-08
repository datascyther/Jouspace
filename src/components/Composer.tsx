import React from 'react';
import { Plus, Mic, ArrowUp } from 'lucide-react';

interface ComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onMic?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  disabled?: boolean;
  micDisabled?: boolean;
  className?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  value,
  onChange,
  onSend,
  onAttach,
  onMic,
  onFocus,
  onBlur,
  isFocused = false,
  disabled = false,
  micDisabled = false,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-surface border rounded-[26px] pl-2 pr-2 py-2 flex items-center gap-2 transition-colors duration-150 ${
        isFocused ? 'border-accent/50' : 'border-border'
      } ${className}`}
    >
      {/* Left: Attachment / Plus */}
      <button
        type="button"
        onClick={onAttach}
        aria-label="Add attachment"
        className="w-[38px] h-[38px] shrink-0 rounded-full bg-inputBg hover:bg-divider flex items-center justify-center text-primaryText transition-colors cursor-pointer focus:outline-none"
      >
        <Plus className="w-[18px] h-[18px] stroke-[1.9]" />
      </button>

      {/* Center: Text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
        disabled={disabled}
        placeholder="Ask Jouspace..."
        className="flex-1 min-w-0 bg-transparent font-sans text-[14.5px] text-primaryText outline-none border-none placeholder:text-muted caret-accent"
      />

      {/* Right: Microphone */}
      <button
        type="button"
        onClick={onMic}
        disabled={micDisabled}
        aria-label="Voice input"
        title={micDisabled ? 'Voice input unavailable on this device' : undefined}
        className={`p-1.5 shrink-0 transition-colors focus:outline-none ${
          micDisabled
            ? 'text-muted/60 cursor-not-allowed'
            : 'text-secondaryText hover:text-accent cursor-pointer'
        }`}
      >
        <Mic className="w-[19px] h-[19px] stroke-[1.6]" />
      </button>

      {/* Right: Send (filled accent circle) */}
      <button
        type="button"
        onClick={onSend}
        disabled={disabled}
        aria-label="Send message"
        className="w-[38px] h-[38px] shrink-0 rounded-full bg-accent hover:bg-accentHover disabled:opacity-50 flex items-center justify-center text-white transition-colors cursor-pointer focus:outline-none"
      >
        <ArrowUp className="w-[19px] h-[19px] stroke-2" />
      </button>
    </div>
  );
};
