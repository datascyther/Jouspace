import React, { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

interface InfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

/** Generic bottom-sheet for static, read-only content (Privacy, Help, etc.). */
export const InfoSheet: React.FC<InfoSheetProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
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
        aria-label={title}
        className={`relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 ${panelClass} max-h-[85%] overflow-y-auto`}
      >
        <div className="w-9 h-1 rounded-full bg-borderSubtle mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-medium text-[20px] text-primaryText">
            {title}
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

        {icon && (
          <div className="w-12 h-12 rounded-full bg-accentSoft flex items-center justify-center mb-3 text-accent">
            {icon}
          </div>
        )}

        <div className="font-sans text-[14px] leading-[1.65] text-secondaryText">
          {children}
        </div>
      </div>
    </div>
  );
};
