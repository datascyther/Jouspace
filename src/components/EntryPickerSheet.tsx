import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Entry } from './EntryRow';

interface EntryPickerScreenProps {
  entries: Entry[];
  onSelect: (entry: Entry) => void;
  onBack: () => void;
}

/** Full-screen route listing journal entries for the AI "attach" action. */
export const EntryPickerScreen: React.FC<EntryPickerScreenProps> = ({
  entries,
  onSelect,
  onBack,
}) => {
  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-serif font-medium text-[18px] text-primaryText">
          Attach an entry
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-6 pb-4 pb-safe">
        {entries.length === 0 ? (
          <p className="font-sans text-[14px] text-muted py-4">
            No entries yet. Write something first, then attach it here.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry)}
                className="cvi-auto flex items-center gap-3.5 w-full text-left bg-base hover:bg-accentSoft rounded-[14px] px-4 py-3.5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[14px] font-medium text-primaryText truncate">
                    {entry.title}
                  </p>
                  <p className="font-sans text-[12px] text-muted">
                    {entry.date} · {entry.theme}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
