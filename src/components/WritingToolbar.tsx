import React from 'react';
import { Mic, Tag, Loader2 } from 'lucide-react';
import { VscEditSparkle } from 'react-icons/vsc';

interface WritingToolbarProps {
  onDoneClick?: () => void;
  doneDisabled?: boolean;
  className?: string;

  // Mic
  onMicClick?: () => void;
  isRecording?: boolean;
  micAvailable?: boolean;
  /** When true, the on-device model is warming up — show a spinner. */
  isPreparing?: boolean;

  // Space
  onSpaceClick?: () => void;
  spacePickerOpen?: boolean;

  // Sparkle
  onSparkleClick?: () => void;
  isGenerating?: boolean;
  hasSparkleGlow?: boolean; // triggered by 3s typing pause
  sparklePanelOpen?: boolean; // sparkle suggestion strip is visible
}

export const WritingToolbar: React.FC<WritingToolbarProps> = ({
  onMicClick,
  isRecording = false,
  micAvailable = true,
  isPreparing = false,
  onSpaceClick,
  spacePickerOpen = false,
  onSparkleClick,
  isGenerating = false,
  hasSparkleGlow = false,
  sparklePanelOpen = false,
  onDoneClick,
  className = '',
  doneDisabled = false,
}) => {
  return (
    <div
      className={`w-full bg-surface border-t border-borderSubtle min-h-16 py-2 px-4 flex items-center justify-between transition-all duration-200 ${className}`}
    >
      {/* Icon Group — icons stay left, Done stays right via justify-between */}
      <div className="flex items-center gap-5 text-muted">
        {/* 1. Microphone — voice-to-text */}
        <button
          type="button"
          onClick={onMicClick}
          disabled={!micAvailable || isPreparing}
          aria-label={isPreparing ? 'Preparing private voice model' : isRecording ? 'Stop recording' : 'Start voice recording'}
          aria-busy={isPreparing}
          className={`relative p-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted disabled:hover:translate-y-0 ${
            isPreparing
              ? 'text-accent'
              : isRecording
                ? 'text-error'
                : 'text-muted hover:text-accent hover:-translate-y-0.5'
          }`}
        >
          {isPreparing ? (
            <Loader2 className="w-5 h-5 stroke-[1.6] animate-spin" />
          ) : (
            <Mic className="w-5 h-5 stroke-[1.6]" />
          )}
          {isRecording && <span className="mic-pulse-dot" />}
        </button>

        {/* 2. Tag — pick the Space that sets this entry's tone */}
        <button
          type="button"
          onClick={onSpaceClick}
          aria-label="Choose a space"
          className={`p-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            spacePickerOpen
              ? 'text-accent bg-accentSoft'
              : 'text-muted hover:text-accent hover:-translate-y-0.5'
          }`}
        >
          <Tag className="w-5 h-5 stroke-[1.6]" />
        </button>

        {/* 3. Sparkle — inline continuations */}
        <button
          type="button"
          onClick={onSparkleClick}
          aria-label="AI writing suggestions"
          className={`relative p-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            isGenerating
              ? 'text-accent sparkle-generating'
              : sparklePanelOpen
                ? 'text-accent bg-accentSoft'
                : hasSparkleGlow
                  ? 'text-accent sparkle-glow'
                  : 'text-muted hover:text-accent hover:-translate-y-0.5'
          }`}
        >
          <VscEditSparkle className="w-5 h-5" />
        </button>
      </div>

      {/* Done Button (Right Aligned, Filled Accent Purple) */}
      <button
        type="button"
        onClick={onDoneClick}
        disabled={doneDisabled}
        className="bg-accent hover:bg-accentHover active:bg-accentActive text-white font-sans font-medium text-[14px] px-5 py-2 rounded-[14px] transition-all duration-200 active:scale-[0.97] active:opacity-90 shadow-xs cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent disabled:active:bg-accent"
      >
        Done
      </button>
    </div>
  );
};
