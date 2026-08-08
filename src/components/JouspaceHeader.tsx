import React from 'react';
import { Bell, Settings } from 'lucide-react';
import logoSrc from '../assets/Jouspace logo.png';
import { IconButton } from './IconButton';

interface JouspaceHeaderProps {
  userName?: string;
  userInitials?: string;
  hasNotifications?: boolean;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export const JouspaceHeader: React.FC<JouspaceHeaderProps> = ({
  userInitials = 'VU',
  hasNotifications = false,
  onNotificationClick,
  onAvatarClick,
  onSettingsClick,
  className = '',
}) => {
  return (
    <header
      className={`flex items-center justify-between w-full py-2 bg-transparent border-none shadow-none ${className}`}
    >
      {/* Brand: Logo + Wordmark */}
      <div className="flex items-center gap-3">
        {/* Logo Mark */}
        <img src={logoSrc} alt="Jouspace" className="w-[38px] h-[38px] rounded-full shrink-0 shadow-sm object-cover" />

        {/* Editorial Wordmark */}
        <span className="font-serif font-medium text-[22px] text-primaryText tracking-tight select-none">
          Jouspace
        </span>
      </div>

      {/* Right Controls: Settings + Bell Icon + Circular Avatar */}
      <div className="flex items-center gap-2">
        {onSettingsClick && (
          <IconButton
            icon={<Settings className="w-[20px] h-[20px] text-primaryText stroke-[1.75]" />}
            onClick={onSettingsClick}
            ariaLabel="Settings"
          />
        )}

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
