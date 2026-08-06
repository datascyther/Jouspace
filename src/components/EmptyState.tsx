import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-6 text-center ${className}`}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-accentSoft flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-sans text-[15px] font-medium text-primaryText mb-1.5">
        {title}
      </h3>
      {message && (
        <p className="font-sans text-[13px] text-secondaryText leading-relaxed mb-4 max-w-[260px]">
          {message}
        </p>
      )}
      {action}
    </div>
  );
};
