import React from 'react';
import { History } from 'lucide-react';

interface AIHeaderProps {
  userInitials?: string;
  onHistoryClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

export const AIHeader: React.FC<AIHeaderProps> = ({
  userInitials = 'VU',
  onHistoryClick,
  onAvatarClick,
  className = '',
}) => {
  return (
    <header
      className={`flex items-center justify-between w-full py-2 bg-base border-none shadow-none ${className}`}
    >
      {/* Left: Editorial page title + subtitle */}
      <div className="flex flex-col text-left">
        <h1 className="font-serif font-normal text-[28px] text-primaryText leading-tight tracking-tight">
          AI
        </h1>
        <p className="font-sans font-normal text-[14px] text-muted mt-0.5">
          Reflect with your journal
        </p>
      </div>

      {/* Right: History icon + circular avatar */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onHistoryClick}
          aria-label="Conversation history"
          className="w-[38px] h-[38px] rounded-full border border-borderSubtle bg-transparent flex items-center justify-center text-primaryText hover:text-accent hover:border-accent/40 transition-colors cursor-pointer focus:outline-none"
        >
          <History className="w-[18px] h-[18px] stroke-[1.7]" />
        </button>

        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="User profile"
          className="w-[38px] h-[38px] rounded-full bg-avatarBg hover:bg-borderSubtle flex items-center justify-center text-primaryText font-sans font-medium text-[13px] tracking-wider transition-colors cursor-pointer focus:outline-none"
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
};
