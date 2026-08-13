import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PrimaryButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  /** Brief success flourish: swaps the label for a spring checkmark. */
  success?: boolean;
  /** Render a subtle brand-purple gradient + depth shadow (used for primary CTAs). */
  gradient?: boolean;
  /** `lg` is the 56px accessible touch-target variant for hero CTAs. */
  size?: 'default' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children = 'Continue writing',
  onClick,
  className = '',
  icon,
  disabled = false,
  isLoading = false,
  success = false,
  gradient = false,
  size = 'default',
}) => {
  const appearance = gradient
    ? 'bg-gradient-to-br from-accent to-accentHover shadow-[0_6px_18px_-4px_rgba(108,77,202,0.35)] hover:brightness-105 active:brightness-95'
    : 'bg-accent hover:bg-accentHover active:bg-accentActive shadow-sm';
  const sizing =
    size === 'lg'
      ? 'h-14 min-h-14 px-6 text-[16px] font-semibold rounded-card'
      : 'min-h-11 px-5 py-3.5 text-[14.5px] font-medium rounded-2xl';

  // Never show a flat, grey disabled button — keep the gradient and simply dim
  // (or, while loading, hold full strength behind the spinner).
  const look = isLoading ? '' : disabled ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      className={`group inline-flex items-center justify-center cursor-pointer font-sans text-white transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 ${look} ${appearance} ${sizing} ${className}`}
    >
      {isLoading ? (
        <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : success ? (
        <CheckCircle2 className="h-[22px] w-[22px] animate-checkPop" />
      ) : (
        icon
      )}
      <span className={success ? 'sr-only' : undefined}>{children}</span>
    </button>
  );
};
