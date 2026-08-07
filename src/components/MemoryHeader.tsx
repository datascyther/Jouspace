import React from 'react';
import { Search } from 'lucide-react';

interface MemoryHeaderProps {
  userName?: string;
  userInitials?: string;
  onSearchClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

export const MemoryHeader: React.FC<MemoryHeaderProps> = ({
  userInitials = 'VU',
  onSearchClick,
  onAvatarClick,
  className = '',
}) => {
  return (
    <header
      className={`flex items-center justify-between w-full py-2 bg-transparent border-none shadow-none ${className}`}
    >
      {/* Left: Memory Title + Subtitle */}
      <div className="flex flex-col text-left">
        <h1 className="font-serif font-normal text-[28px] text-primaryText leading-tight tracking-tight">
          Memory
        </h1>
        <p className="font-sans font-normal text-[14px] text-muted mt-0.5">
          Patterns from your journal
        </p>
      </div>

      {/* Right Controls: Search Icon + User Avatar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search memory patterns"
          className="p-2 text-primaryText hover:text-accent rounded-full transition-colors cursor-pointer focus:outline-none"
        >
          <Search className="w-[21px] h-[21px] stroke-[1.75]" />
        </button>

        {/* User Avatar */}
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="User profile"
          className="w-[38px] h-[38px] rounded-full bg-avatarBg hover:bg-border flex items-center justify-center text-primaryText font-sans font-medium text-[13px] tracking-wider transition-colors cursor-pointer focus:outline-none ml-1"
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
};
