import React from 'react';
import { X } from 'lucide-react';
import { infoContent, type InfoKind } from './infoContent';

interface InfoScreenProps {
  kind: InfoKind;
  onBack: () => void;
}

/**
 * Full-screen static content route (Privacy / Help / Feedback / About).
 * Replaces the previous bottom-sheet overlay so the background screen is frozen
 * while this route is on top of the navigation stack. `onBack` returns to the
 * previous screen.
 */
export const InfoScreen: React.FC<InfoScreenProps> = ({ kind, onBack }) => {
  const { title, icon, body } = infoContent[kind];

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
          {title}
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pb-4 pb-safe">
        <div className="w-12 h-12 rounded-full bg-accentSoft flex items-center justify-center mb-3 text-accent">
          {icon}
        </div>
        <div className="font-sans text-[14px] leading-[1.65] text-secondaryText">
          {body}
        </div>
      </div>
    </div>
  );
};
