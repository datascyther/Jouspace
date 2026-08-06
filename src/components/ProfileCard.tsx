import React from 'react';

interface ProfileCardProps {
  initials: string;
  displayName: string;
  email: string;
  joinedDate: string;
  avatarUrl?: string | null;
  onEditProfile?: () => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  initials,
  displayName,
  email,
  joinedDate,
  avatarUrl,
  onEditProfile,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 flex flex-col items-center gap-4 ${className}`}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[#EFEBF5] shrink-0">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-[72px] h-[72px] rounded-full bg-[#EFEBF5] flex items-center justify-center text-[#0D102B] font-sans font-medium text-[22px] tracking-wider shrink-0 select-none">
          {initials}
        </div>
      )}

      {/* Name & Email */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-sans font-semibold text-[17px] text-[#0D102B] leading-tight">
          {displayName}
        </span>
        <span className="font-sans text-[13px] text-[#8B8998] leading-tight">
          {email}
        </span>
      </div>

      {/* Joined Date */}
      <span className="font-sans text-[12.5px] text-[#68677E] leading-tight">
        Writing since {joinedDate}
      </span>

      {/* Edit Profile Button */}
      <button
        type="button"
        onClick={onEditProfile}
        className="mt-1 px-5 py-2.5 rounded-[14px] border border-[#E7E1EF] bg-transparent text-[#0D102B] font-sans font-medium text-[14px] hover:border-[#6D4FD7]/40 hover:text-[#6D4FD7] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6D4FD7]/20"
      >
        Edit profile
      </button>
    </div>
  );
};
