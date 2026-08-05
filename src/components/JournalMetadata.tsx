import React from 'react';

export type AutosaveStatus = 'autosaved' | 'autosaving' | 'saved' | 'failed' | 'editing';

interface JournalMetadataProps {
  dateLabel?: string;
  timeLabel?: string;
  status?: AutosaveStatus;
  className?: string;
}

export const JournalMetadata: React.FC<JournalMetadataProps> = ({
  dateLabel = 'Today',
  timeLabel = 'Aug 4, 2026 • 6:58 PM',
  status = 'autosaved',
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
      className={`flex items-start justify-between w-full font-sans text-[12.5px] text-[#8B8998] tracking-normal select-none ${className}`}
    >
      {/* Left: Today & Timestamp */}
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-[#8B8998]">{dateLabel}</span>
        <span className="text-[#8B8998]">{timeLabel}</span>
      </div>

      {/* Right: Autosave status indicator */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {status === 'autosaving' && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D4FD7] animate-ping" />
        )}
        {status === 'failed' && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        )}
        <span
          className={
            status === 'failed'
              ? 'text-red-500 font-medium'
              : 'text-[#8B8998] font-normal'
          }
        >
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};
