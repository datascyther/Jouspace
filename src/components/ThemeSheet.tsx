import React, { useId, useRef } from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import type { Theme } from '../hooks/useTheme';

interface ThemeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onSelect: (theme: Theme) => void;
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun; hint: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, hint: 'Bright canvas' },
  { value: 'dark', label: 'Dark', icon: Moon, hint: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, hint: 'Follows device' },
];

export const ThemeSheet: React.FC<ThemeSheetProps> = ({
  isOpen,
  onClose,
  theme,
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
        aria-label="Choose appearance"
        className={`relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 ${panelClass}`}
      >
        <div className="w-9 h-1 rounded-full bg-borderSubtle mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-medium text-[20px] text-primaryText">
            Appearance
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

        <div className="flex flex-col gap-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                aria-pressed={selected}
                className={`flex items-center gap-3.5 w-full text-left rounded-[14px] px-4 py-3.5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer ${
                  selected ? 'bg-accentSoft' : 'bg-base hover:bg-accentSoft'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    selected ? 'bg-accent text-white' : 'bg-accentSoft text-accent'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[14px] font-medium text-primaryText">
                    {opt.label}
                  </p>
                  <p className="font-sans text-[12px] text-muted">{opt.hint}</p>
                </div>
                {selected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
