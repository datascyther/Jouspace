import React, { useId, useRef } from 'react';
import { X, BookOpen, Layers } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

export const CONTEXT_ITEMS = [
  { id: '1', icon: TbSparkle, label: 'Morning reflections', type: 'Thread' },
  { id: '2', icon: BookOpen, label: "What I'm trying to understand", type: 'Recent entry' },
  { id: '3', icon: Layers, label: 'Building Jouspace', type: 'Memory thread' },
  { id: '4', icon: BookOpen, label: 'Creative work and flow', type: 'Recent entry' },
];

interface AIContextPickerProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectContext?: (id: string) => void;
  activeId?: string | null;
  className?: string;
}

export const AIContextPicker: React.FC<AIContextPickerProps> = ({
  isOpen = false,
  onClose,
  onSelectContext,
  activeId = null,
  className = '',
}) => {
  const pickerId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({
    id: pickerId,
    active: isOpen,
    onClose,
    containerRef: pickerRef,
  });

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
    <div ref={pickerRef} className={`absolute inset-0 z-50 flex items-end justify-center ${className}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-primaryText/30 ${backdropClass}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal={!closing}
        aria-label="Change context"
        className={`relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 ${panelClass}`}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-borderSubtle mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-medium text-[20px] text-primaryText">
            Change context
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

        {/* Context List */}
        <div className="flex flex-col gap-2">
          {CONTEXT_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectContext?.(item.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-3.5 w-full text-left rounded-[14px] px-4 py-3.5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer ${
                  isActive ? 'bg-accentSoft' : 'bg-base hover:bg-accentSoft'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-accentSoft flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px] text-accent stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[14px] font-medium text-primaryText truncate">
                    {item.label}
                  </p>
                  <p className="font-sans text-[12px] text-muted">
                    {item.type}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
