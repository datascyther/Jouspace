import React from 'react';

interface ThemeChipProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ThemeChip: React.FC<ThemeChipProps> = ({
  label,
  isSelected = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-sans font-medium text-[13px] px-4 py-2 rounded-full leading-none transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'bg-accentSoft text-accent border border-accent/20 shadow-2xs'
          : 'bg-surface text-primaryText border border-border hover:border-accent/40'
      } ${className}`}
    >
      {label}
    </button>
  );
};
