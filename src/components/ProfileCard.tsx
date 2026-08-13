import React, { useState, useRef, useEffect } from 'react';
import { validateProfileName } from '../utils/validation';

interface ProfileCardProps {
  initials: string;
  displayName: string;
  email: string;
  joinedDate: string;
  avatarUrl?: string | null;
  /** Persists the (already validated) trimmed display name. */
  onSave?: (name: string) => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  initials,
  displayName,
  email,
  joinedDate,
  avatarUrl,
  onSave,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(displayName);
      setError(null);
      inputRef.current?.focus();
    }
  }, [isEditing, displayName]);

  const startEditing = () => setIsEditing(true);

  const cancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const save = () => {
    const result = validateProfileName(draft);
    if (!result.valid) {
      setError(result.error ?? 'Invalid name.');
      return;
    }
    onSave?.(result.valid ? draft.trim() : draft.trim());
    setIsEditing(false);
  };

  return (
    <div
      className={`bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col items-center gap-4 ${className}`}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-avatarBg shrink-0">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-[72px] h-[72px] rounded-full bg-avatarBg flex items-center justify-center text-primaryText font-sans font-medium text-[22px] tracking-wider shrink-0 select-none">
          {initials}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
            aria-label="Display name"
            className={`w-full bg-base border rounded-[12px] px-3 py-2 font-sans text-[15px] text-primaryText text-center outline-none focus:border-accent transition-colors ${
              error ? 'border-error' : 'border-borderSubtle'
            }`}
          />
          {error && (
            <span className="font-sans text-[12px] text-error bg-errorBg px-2 py-0.5 rounded-full">
              {error}
            </span>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={save}
              className="px-5 py-2 rounded-[14px] bg-accent hover:bg-accentHover text-white font-sans font-medium text-[14px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="px-5 py-2 rounded-[14px] border border-borderSubtle bg-transparent text-primaryText font-sans font-medium text-[14px] hover:border-accent/40 hover:text-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Name & Email */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-sans font-semibold text-[17px] text-primaryText leading-tight">
              {displayName}
            </span>
            <span className="font-sans text-[13px] text-muted leading-tight">
              {email}
            </span>
          </div>

          {/* Joined Date */}
          <span className="font-sans text-[12.5px] text-secondaryText leading-tight">
            Writing since {joinedDate}
          </span>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={startEditing}
            className="mt-1 px-5 py-2.5 rounded-[14px] border border-borderSubtle bg-transparent text-primaryText font-sans font-medium text-[14px] hover:border-accent/40 hover:text-accent transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            Edit profile
          </button>
        </>
      )}
    </div>
  );
};
