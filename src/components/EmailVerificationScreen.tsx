import React from 'react';

interface EmailVerificationScreenProps {
  onResendEmail?: () => void;
  onBackToSignIn?: () => void;
  onClose?: () => void;
  email?: string;
  isLoading?: boolean;
  className?: string;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  onResendEmail,
  onBackToSignIn,
  onClose,
  email = '',
  isLoading = false,
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center px-8 py-12 animate-fadeIn relative ${className}`}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-primaryText hover:bg-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer z-10"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4L12 12" />
          <path d="M12 4L4 12" />
        </svg>
      </button>

      {/* Brand */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4 shadow-sm">
          <span className="font-serif font-medium text-[30px] leading-none text-white select-none pl-px">
            J
          </span>
        </div>
        <span className="font-serif font-medium text-[24px] text-primaryText tracking-tight select-none">
          Jouspace
        </span>
      </div>

      {/* Heading */}
      <h1 className="font-serif font-medium text-[28px] leading-[1.2] text-primaryText text-center mb-2">
        Verify your email
      </h1>
      <p className="font-sans text-[14px] text-secondaryText text-center mb-8 max-w-[280px]">
        We sent a verification link to{' '}
        <span className="font-medium text-primaryText">{email}</span>
      </p>

      {/* Info Card */}
      <div className="w-full max-w-[320px] bg-accentSoft border border-border rounded-xl px-4 py-4 mb-8">
        <p className="font-sans text-[13px] text-primaryText text-center leading-relaxed">
          Check your inbox and tap the link to verify your account. Then return here to continue.
        </p>
      </div>

      {/* Resend Button */}
      <button
        type="button"
        onClick={onResendEmail}
        disabled={isLoading}
        className="w-full max-w-[320px] bg-accent hover:bg-[#5C3EC5] active:bg-[#5034B3] text-white font-sans font-medium text-[15px] py-4 rounded-[18px] transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending…' : 'Resend email'}
      </button>

      {/* Back to Sign In */}
      <button
        type="button"
        onClick={onBackToSignIn}
        disabled={isLoading}
        className="mt-4 text-accent hover:text-[#5639BE] font-sans font-medium text-[14px] transition-colors duration-150 focus:outline-none cursor-pointer disabled:opacity-50"
      >
        Back to sign in
      </button>
    </div>
  );
};
