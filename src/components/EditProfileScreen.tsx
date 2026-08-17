import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { validateProfileName } from '../utils/validation';

interface EditProfileScreenProps {
  displayName: string;
  userInitials: string;
  email: string;
  joinedDate: string;
  onSave: (name: string) => void;
  onBack: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  displayName,
  userInitials,
  email,
  joinedDate,
  onSave,
  onBack,
}) => {
  const [draft, setDraft] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const result = validateProfileName(draft);
    if (!result.valid) {
      setError(result.error ?? 'Invalid name.');
      return;
    }
    onSave(draft.trim());
    onBack();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const hasChanges = draft.trim() !== displayName && draft.trim().length > 0;

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
          <ArrowLeft className="w-[22px] h-[22px] stroke-[1.8]" />
        </button>
        <h1 className="font-serif font-medium text-[18px] text-primaryText">
          Edit profile
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          aria-label="Save profile"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
            hasChanges
              ? 'bg-accent text-white hover:bg-accentAlt'
              : 'bg-borderSubtle text-muted cursor-not-allowed'
          }`}
        >
          <Check className="w-4.5 h-4.5 stroke-[2]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pt-4 pb-4">
        <div className="flex flex-col items-center gap-5">
          {/* Avatar */}
          <div className="w-[72px] h-[72px] rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <span className="font-sans text-[24px] font-medium text-accent select-none">
              {userInitials}
            </span>
          </div>

          {/* Name Input */}
          <div className="w-full flex flex-col gap-1.5">
            <label
              htmlFor="profile-name"
              className="font-sans text-[12px] font-medium text-muted tracking-wide uppercase select-none"
            >
              Display name
            </label>
            <input
              ref={inputRef}
              id="profile-name"
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-borderSubtle font-sans text-[15px] text-primaryText placeholder:text-muted/50 focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-colors duration-150"
              placeholder="Your name"
            />
            {error && (
              <span className="font-sans text-[12px] text-red-500 mt-0.5">
                {error}
              </span>
            )}
          </div>

          {/* Read-only Info */}
          <div className="w-full flex flex-col gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[12px] font-medium text-muted tracking-wide uppercase select-none">
                Email
              </span>
              <span className="font-sans text-[14px] text-secondaryText">
                {email}
              </span>
            </div>
            <div className="h-px bg-borderSubtle" />
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[12px] font-medium text-muted tracking-wide uppercase select-none">
                Member since
              </span>
              <span className="font-sans text-[14px] text-secondaryText">
                {joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
