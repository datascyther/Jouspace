import React, { useState } from 'react';

interface SignInScreenProps {
  onSignIn?: () => void;
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onClose?: () => void;
  className?: string;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignIn,
  onCreateAccount,
  onForgotPassword,
  isLoading = false,
  error = null,
  onClose,
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center px-8 py-12 animate-fadeIn relative ${className}`}
    >
      {/* Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-primaryText hover:bg-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4L12 12" />
            <path d="M12 4L4 12" />
          </svg>
        </button>
      )}

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
        Welcome back
      </h1>
      <p className="font-sans text-[14px] text-secondaryText text-center mb-8">
        Sign in to continue your journal
      </p>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-[320px] bg-[#FDECEC] border border-[#F5C6C6] rounded-xl px-4 py-3 mb-6">
          <p className="font-sans text-[13px] text-[#C53030] text-center">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="w-full max-w-[320px] flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="w-full bg-surface border border-border rounded-[14px] px-4 py-3.5 font-sans text-[15px] text-primaryText placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="w-full bg-surface border border-border rounded-[14px] px-4 py-3.5 font-sans text-[15px] text-primaryText placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all disabled:opacity-50"
        />
      </div>

      {/* Forgot Password */}
      <button
        type="button"
        onClick={onForgotPassword}
        disabled={isLoading}
        className="mt-4 text-accent hover:text-[#5639BE] font-sans font-medium text-[13px] transition-colors duration-150 focus:outline-none cursor-pointer disabled:opacity-50"
      >
        Forgot password?
      </button>

      {/* Sign In Button */}
      <button
        type="button"
        onClick={onSignIn}
        disabled={isLoading}
        className="w-full max-w-[320px] mt-6 bg-accent hover:bg-[#5C3EC5] active:bg-[#5034B3] text-white font-sans font-medium text-[15px] py-4 rounded-[18px] transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>

      {/* Create Account */}
      <button
        type="button"
        onClick={onCreateAccount}
        disabled={isLoading}
        className="mt-4 text-accent hover:text-[#5639BE] font-sans font-medium text-[14px] transition-colors duration-150 focus:outline-none cursor-pointer disabled:opacity-50"
      >
        Don't have an account? Create one
      </button>
    </div>
  );
};
