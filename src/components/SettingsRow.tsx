import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  className?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  onClick,
  variant = 'default',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-0 bg-transparent border-none text-left transition-colors duration-150 cursor-pointer ${
        variant === 'danger'
          ? 'text-muted hover:text-secondaryText'
          : 'text-primaryText hover:text-accent'
      } ${className}`}
      style={{ height: 60 }}
    >
      {/* Icon */}
      <span className="flex items-center justify-center w-[22px] h-[22px] shrink-0">
        {icon}
      </span>

      {/* Title */}
      <span
        className={`flex-1 font-sans text-[15px] ${
          variant === 'danger'
            ? 'text-muted font-normal'
            : 'text-primaryText font-medium'
        }`}
      >
        {title}
      </span>

      {/* Chevron */}
      {variant === 'default' && (
        <ChevronRight
          className="w-[18px] h-[18px] text-border shrink-0"
          strokeWidth={1.8}
        />
      )}
    </button>
  );
};
