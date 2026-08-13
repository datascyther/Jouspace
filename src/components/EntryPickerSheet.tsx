import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import type { Entry } from './EntryRow';

interface EntryPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  onSelect: (entry: Entry) => void;
}

/** Bottom-sheet listing journal entries for the AI "attach" action. */
export const EntryPickerSheet: React.FC<EntryPickerSheetProps> = ({
  isOpen,
  onClose,
  entries,
  onSelect,
}) => {
  const sheetId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ id: sheetId, active: isOpen, onClose, containerRef: sheetRef });

  // Exit-safe: stay mounted through the exit transition so the sheet slides
  // down and the backdrop fades before the DOM is removed (no instant flicker).
  const { present, closing, entered } = useAnimatedPresence(isOpen, 300);
  if (!present) return null;

  const backdropClass = closing
    ? 'gpu-layer backdrop-exit backdrop-exit-active transition-exit'
    : entered
      ? 'gpu-layer backdrop-enter backdrop-enter-active transition-enter'
      : 'gpu-layer backdrop-enter transition-enter';

  const panelClass = closing
    ? 'sheet-exit sheet-exit-active transition-exit gpu-layer'
    : entered
      ? 'sheet-enter-active transition-enter gpu-layer'
      : 'sheet-enter transition-enter gpu-layer';

  return (
    <div
      ref={sheetRef}
      className="absolute inset-0 z-50 flex items-end justify-center"
    >
      <div
        className={`absolute inset-0 bg-primaryText/30 ${backdropClass}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal={!closing}
        aria-label="Attach an entry"
        className={`relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 ${panelClass} max-h-[85%] overflow-y-auto`}
      >
        <div className="w-9 h-1 rounded-full bg-borderSubtle mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-medium text-[20px] text-primaryText">
            Attach an entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                className="flex items-center gap-3.5 w-full text-left bg-base hover:bg-accentSoft rounded-[14px] px-4 py-3.5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
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
