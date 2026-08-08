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
  const baseClasses = `inline-flex items-center justify-center font-sans font-medium text-[13px] px-4 py-2 rounded-full leading-none transition-all duration-150 ${
    isSelected
      ? 'bg-accentSoft text-accent border border-accent/20 shadow-2xs'
      : 'bg-surface text-primaryText border border-border hover:border-accent/40'
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} cursor-pointer`}
      >
        {label}
      </button>
    );
  }

  return <span className={baseClasses}>{label}</span>;
};
