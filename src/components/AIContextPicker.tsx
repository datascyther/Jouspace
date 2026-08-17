import React from 'react';
import { X, BookOpen, Layers } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';

export const CONTEXT_ITEMS = [
  { id: '1', icon: TbSparkle, label: 'Morning reflections', type: 'Thread' },
  { id: '2', icon: BookOpen, label: "What I'm trying to understand", type: 'Recent entry' },
  { id: '3', icon: Layers, label: 'Building Jouspace', type: 'Memory thread' },
  { id: '4', icon: BookOpen, label: 'Creative work and flow', type: 'Recent entry' },
];

interface AIContextScreenProps {
  onSelectContext?: (id: string) => void;
  activeId?: string | null;
  onBack: () => void;
}

/**
 * Full-screen AI context picker. Replaces the previous bottom-sheet overlay so
 * the background screen is frozen while this route is on top of the stack.
 * Selecting a context closes the route (returns to the AI screen) via `onBack`.
 */
export const AIContextScreen: React.FC<AIContextScreenProps> = ({
  onSelectContext,
  activeId = null,
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
          Change context
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pb-4 pb-safe">
        <p className="font-sans text-[14px] text-muted mb-4">
          Choose what the AI should keep in mind for your next reflection.
        </p>
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
                  isActive ? 'bg-accentSoft' : 'bg-surface hover:bg-accentSoft'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-accentSoft flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px] text-accent stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[14px] font-medium text-primaryText truncate">
                    {item.label}
                  </p>
                  <p className="font-sans text-[12px] text-muted">{item.type}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
