import React from 'react';

export type AutosaveStatus = 'autosaved' | 'autosaving' | 'saved' | 'failed' | 'editing';

interface JournalMetadataProps {
  dateLabel?: string;
  timeLabel?: string;
  status?: AutosaveStatus;
  /** True for ~1.5s right after a manual save completes — shows the ✓ pulse. */
  justSaved?: boolean;
  className?: string;
}

export const JournalMetadata: React.FC<JournalMetadataProps> = ({
  dateLabel = 'Today',
  timeLabel = 'Aug 4, 2026 • 6:58 PM',
  status = 'autosaved',
  justSaved = false,
  className = '',
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'autosaving':
        return 'Autosaving...';
      case 'failed':
        return 'Save failed';
      case 'editing':
        return 'Unsaved changes';
      case 'saved':
        return 'Saved';
      case 'autosaved':
      default:
        return 'Autosaved';
    }
  };

  return (
    <div
      className={`flex items-start justify-between w-full font-sans text-[12px] text-muted tracking-normal select-none ${className}`}
    >
      {/* Left: Today & Timestamp */}
      <div className="flex flex-col gap-1">
        <span className="font-medium text-muted">{dateLabel}</span>
        <span className="text-muted">{timeLabel}</span>
      </div>

      {/* Right: Autosave status indicator */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {status === 'autosaving' && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
        )}
        {status === 'failed' && (
          <span className="w-1.5 h-1.5 rounded-full bg-error" />
        )}
        {/* Relative wrapper: the ✓ is absolutely positioned so it pulses
            without pushing the status text or causing layout reflow. */}
        <span className="relative inline-flex items-center">
          {justSaved && (
            <span
              className="save-checkmark absolute right-full mr-1.5 text-accent"
              aria-hidden="true"
            >
              ✓
            </span>
          )}
          <span
            className={
              status === 'failed'
                ? 'text-error font-medium'
                : 'text-muted font-normal'
            }
          >
            {getStatusText()}
          </span>
        </span>
      </div>
    </div>
  );
};
