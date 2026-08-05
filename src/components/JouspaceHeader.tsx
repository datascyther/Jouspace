import React from 'react';
import { Bell } from 'lucide-react';
import { IconButton } from './IconButton';

interface JouspaceHeaderProps {
  userName?: string;
  userInitials?: string;
  hasNotifications?: boolean;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

export const JouspaceHeader: React.FC<JouspaceHeaderProps> = ({
  userInitials = 'VU',
  hasNotifications = false,
  onNotificationClick,
  onAvatarClick,
  className = '',
}) => {
  return (
    <header
      className={`flex items-center justify-between w-full py-2 bg-transparent border-none shadow-none ${className}`}
    >
      {/* Brand: Logo + Wordmark */}
      <div className="flex items-center gap-3">
        {/* Circular Purple Logo with Serif 'J' */}
        <div className="w-[38px] h-[38px] rounded-full bg-[#6D4FD7] flex items-center justify-center text-white shrink-0 shadow-sm">
          <span className="font-serif font-medium text-[22px] leading-none select-none pl-[1px]">
            J
          </span>
        </div>

        {/* Editorial Wordmark */}
        <span className="font-serif font-medium text-[22px] text-[#0D102B] tracking-tight select-none">
          Jouspace
        </span>
      </div>

      {/* Right Controls: Bell Icon + Circular Avatar */}
      <div className="flex items-center gap-2">
        <IconButton
          icon={<Bell className="w-[21px] h-[21px] text-[#0D102B] stroke-[1.75]" />}
          onClick={onNotificationClick}
          ariaLabel="Notifications"
          badge={hasNotifications}
        />

        {/* User Avatar */}
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="User Profile"
          className="w-[38px] h-[38px] rounded-full bg-[#EFEBF5] hover:bg-[#E7E1EF] flex items-center justify-center text-[#0D102B] font-sans font-medium text-[13px] tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#6D4FD7]/20 ml-1 cursor-pointer"
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
};
