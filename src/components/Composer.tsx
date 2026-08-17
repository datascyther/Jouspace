import React from 'react';
import { Plus, Mic, ArrowUp, Loader2, Square } from 'lucide-react';

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
  /** When true, the mic button shows an active "recording" state. */
  isRecording?: boolean;
  /** When true, the voice engine is warming up — show a spinner, not the mic. */
  isPreparing?: boolean;
  /** When true, a recording is being finalized — show a stop glyph, not a mic. */
  isStopping?: boolean;
  /** Live elapsed seconds of the active recording (shown as a title when recording). */
  recordingSec?: number;
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
  isRecording = false,
  isPreparing = false,
  isStopping = false,
  recordingSec = 0,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-surface border rounded-[26px] pl-2 pr-2 py-2 flex items-center gap-2 transition-colors duration-150 ${
        isFocused ? 'border-accent/50' : 'border-borderSubtle'
      } ${className}`}
    >
      {/* Left: Attachment / Plus */}
      <button
        type="button"
        onClick={onAttach}
        aria-label="Add attachment"
        className="w-[38px] h-[38px] shrink-0 rounded-full bg-inputBg hover:bg-borderSubtle flex items-center justify-center text-primaryText transition-colors cursor-pointer focus:outline-none"
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

      {/* Right: Microphone — voice recording for the AI chat */}
      <button
        type="button"
        onClick={onMic}
        disabled={micDisabled || isPreparing || isStopping}
        aria-label={
          isStopping
            ? 'Finalizing recording'
            : isRecording
              ? 'Stop recording'
              : isPreparing
                ? 'Starting voice recording'
                : 'Start a voice recording'
        }
        aria-pressed={isRecording}
        aria-busy={isPreparing || isStopping}
        title={
          micDisabled
            ? 'Voice recording unavailable on this device'
            : isStopping
              ? 'Finalizing…'
              : isPreparing
                ? 'Starting voice recording…'
                : isRecording
                  ? `Recording… ${recordingSec}s — tap to stop`
                  : 'Start a voice recording'
        }
        className={`relative p-1.5 shrink-0 transition-colors focus:outline-none ${
          micDisabled
            ? 'text-muted/60 cursor-not-allowed'
            : isStopping
              ? 'text-accent cursor-progress'
              : isPreparing
                ? 'text-accent cursor-progress'
                : isRecording
                  ? 'text-error animate-pulse cursor-pointer'
                  : 'text-secondaryText hover:text-accent cursor-pointer'
        }`}
      >
        {isStopping || isPreparing ? (
          <Loader2 className="w-[19px] h-[19px] stroke-[1.6] animate-spin" />
        ) : isRecording ? (
          <Square className="w-[19px] h-[19px] stroke-[1.6]" />
        ) : (
          <Mic className="w-[19px] h-[19px] stroke-[1.6]" />
        )}
        {isRecording && !isStopping && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface" />
        )}
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
