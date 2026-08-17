import React from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface ThemeScreenProps {
  theme: Theme;
  onSelect: (theme: Theme) => void;
  onBack: () => void;
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun; hint: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, hint: 'Bright canvas' },
  { value: 'dark', label: 'Dark', icon: Moon, hint: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, hint: 'Follows device' },
];

/**
 * Full-screen appearance picker. Replaces the previous bottom-sheet overlay so
 * the background screen is frozen (not shifted/jittered) while this route is on
 * top of the stack. Wired through the native navigation stack — `onBack`
 * returns to the previous screen.
 */
export const ThemeScreen: React.FC<ThemeScreenProps> = ({
  theme,
  onSelect,
  onBack,
}) => {
  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <h1 className="font-serif font-medium text-[18px] text-primaryText">
          Appearance
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pb-4 pb-safe">
        <p className="font-sans text-[14px] text-muted mb-4">
          Choose how Jouspace looks.
        </p>
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
                  selected ? 'bg-accentSoft' : 'bg-surface hover:bg-accentSoft'
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
