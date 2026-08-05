import React from 'react';

interface AppScreenProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
  className?: string;
  isSmallScreen?: boolean;
  isOffline?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  showStatusBar = true,
  className = '',
  isSmallScreen = false,
  isOffline = false,
}) => {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#0D102B] font-sans antialiased flex flex-col items-center justify-start py-0 md:py-6 selection:bg-[#6D4FD7]/15">
      {/* Offline Status Bar Banner if active */}
      {isOffline && (
        <div className="w-full bg-[#0D102B] text-white text-[12px] font-sans py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 transition-all">
          <span className="w-2 h-2 rounded-full bg-[#8B8998] animate-pulse" />
          <span>Offline mode — your journal entries are saved locally</span>
        </div>
      )}

      {/* Main Container Frame */}
      <div
        className={`w-full bg-[#FBF9F5] transition-all duration-300 ${
          isSmallScreen
            ? 'max-w-[360px] min-h-[700px] my-2 rounded-[32px] border border-[#E7E1EF] shadow-xl overflow-hidden'
            : 'max-w-[430px] min-h-[880px] md:my-4 md:rounded-[40px] md:border md:border-[#E7E1EF] md:shadow-2xl overflow-hidden'
        } ${className}`}
      >
        {/* Status Bar (Simulated Mobile Top Bar) */}
        {showStatusBar && (
          <div className="flex items-center justify-between px-7 pt-3 pb-1 text-[13px] font-semibold text-[#0D102B] select-none tracking-tight">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-[#0D102B]">
              {/* Cellular */}
              <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
                <rect x="0" y="7" width="2.5" height="4" rx="0.5" />
                <rect x="4.5" y="5" width="2.5" height="6" rx="0.5" />
                <rect x="9" y="2.5" width="2.5" height="8.5" rx="0.5" />
                <rect x="13.5" y="0" width="2.5" height="11" rx="0.5" />
              </svg>
              {/* Wifi */}
              <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                <path d="M7.5 10.5C8.05228 10.5 8.5 10.0523 8.5 9.5C8.5 8.94772 8.05228 8.5 7.5 8.5C6.94772 8.5 6.5 8.94772 6.5 9.5C6.5 10.0523 6.94772 10.5 7.5 10.5Z" />
                <path d="M4.67157 6.67157C6.23367 5.10948 8.76633 5.10948 10.3284 6.67157L11.7426 5.25736C9.39949 2.91421 5.60051 2.91421 3.25736 5.25736L4.67157 6.67157Z" />
                <path d="M1.84315 3.84315C4.96734 0.718953 10.0327 0.718953 13.1569 3.84315L14.5711 2.42893C10.6658 -1.47631 4.33418 -1.47631 0.428932 2.42893L1.84315 3.84315Z" />
              </svg>
              {/* Battery */}
              <div className="w-5 h-2.5 border border-[#0D102B] rounded-[3px] p-[1px] flex items-center">
                <div className="w-3.5 h-full bg-[#0D102B] rounded-[1px]" />
              </div>
            </div>
          </div>
        )}

        {/* Inner Content Area */}
        <div className="px-6 pb-28 pt-2 flex flex-col gap-7">{children}</div>
      </div>
    </div>
  );
};
