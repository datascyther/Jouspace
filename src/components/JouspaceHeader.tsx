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
        <div className="w-[38px] h-[38px] rounded-full bg-accent flex items-center justify-center text-white shrink-0 shadow-sm">
          <span className="font-serif font-medium text-[22px] leading-none select-none pl-[1px]">
            J
          </span>
        </div>

        {/* Editorial Wordmark */}
        <span className="font-serif font-medium text-[22px] text-primaryText tracking-tight select-none">
          Jouspace
        </span>
      </div>

      {/* Right Controls: Bell Icon + Circular Avatar */}
      <div className="flex items-center gap-2">
        <IconButton
          icon={<Bell className="w-[21px] h-[21px] text-primaryText stroke-[1.75]" />}
          onClick={onNotificationClick}
          ariaLabel="Notifications"
          badge={hasNotifications}
        />

        {/* User Avatar */}
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="User Profile"
          className="w-[38px] h-[38px] rounded-full bg-avatarBg hover:bg-border flex items-center justify-center text-primaryText font-sans font-medium text-[13px] tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ml-1 cursor-pointer"
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
};
