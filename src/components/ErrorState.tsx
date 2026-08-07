import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-errorBg flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-error stroke-[1.6]" />
      </div>
      <h3 className="font-sans text-[16px] font-medium text-primaryText mb-1.5">
        {title}
      </h3>
      <p className="font-sans text-[14px] text-secondaryText leading-relaxed mb-5 max-w-[260px]">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-accent hover:text-accentAlt font-sans font-medium text-[14px] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 rounded-lg px-3 py-2 min-h-11"
        >
          <RefreshCw className="w-4 h-4 stroke-[1.8]" />
          Try again
        </button>
      )}
    </div>
  );
};
