import React, { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

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

  if (!isOpen) return null;

  return (
    <div
      ref={sheetRef}
      className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn"
    >
      <div className="absolute inset-0 bg-primaryText/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 animate-slideUp max-h-[85vh] overflow-y-auto"
      >
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-medium text-[20px] text-primaryText">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-secondaryText hover:bg-border transition-colors cursor-pointer"
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
