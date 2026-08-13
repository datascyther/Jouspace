import React from 'react';

interface PrimaryCardProps {
  children: React.ReactNode;
  className?: string;
}

export const PrimaryCard: React.FC<PrimaryCardProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface rounded-3xl border border-borderSubtle p-6 text-primaryText ${className}`}
    >
      {children}
    </div>
  );
};
