import React from 'react';

interface WelcomeScreenProps {
  onStartWriting?: () => void;
  onAlreadyHaveAccount?: () => void;
  onContinueAsGuest?: () => void;
  className?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartWriting,
  onAlreadyHaveAccount,
  onContinueAsGuest,
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center px-8 py-12 animate-fadeIn ${className}`}
    >
      {/* Brand */}
      <div className="flex flex-col items-center mb-12">
        {/* Circular Logo with Serif 'J' */}
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4 shadow-sm">
          <span className="font-serif font-medium text-[30px] leading-none text-white select-none pl-px">
            J
          </span>
        </div>

        {/* Editorial Wordmark */}
        <span className="font-serif font-medium text-[24px] text-primaryText tracking-tight select-none">
          Jouspace
        </span>
      </div>

      {/* Editorial Heading */}
      <h1 className="font-serif font-medium text-[36px] leading-[1.2] text-primaryText text-center tracking-tight mb-8">
        A private place
        <br />
        to remember
        <br />
        what matters.
      </h1>

      {/* Supporting Copy */}
      <p className="font-sans text-[15px] leading-[1.7] text-secondaryText text-center max-w-[300px] mb-12">
        Your journal grows with you.
        <br />
        Write freely.
        <br />
        Jouspace quietly remembers the themes,
        <br />
        moments and reflections that matter most.
      </p>

      {/* Primary Button */}
      <button
        type="button"
        onClick={onStartWriting}
        className="w-full bg-accent hover:bg-[#5C3EC5] active:bg-[#5034B3] text-white font-sans font-medium text-[15px] py-4 rounded-[18px] transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
      >
        Start writing
      </button>

      {/* Secondary Action */}
      <button
        type="button"
        onClick={onAlreadyHaveAccount}
        className="mt-6 text-accent hover:text-[#5639BE] font-sans font-medium text-[14px] transition-colors duration-150 focus:outline-none cursor-pointer"
      >
        I already have an account
      </button>

      {/* Guest Mode */}
      <button
        type="button"
        onClick={onContinueAsGuest}
        className="mt-3 text-muted hover:text-secondaryText font-sans font-normal text-[13px] transition-colors duration-150 focus:outline-none cursor-pointer"
      >
        Continue as guest
      </button>
    </div>
  );
};
