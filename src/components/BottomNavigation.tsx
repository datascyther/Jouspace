import React from 'react';
import { CenterWriteButton } from './CenterWriteButton';
import { Home, BookOpen } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { PiBrain } from 'react-icons/pi';

export type NavTab = 'home' | 'journal' | 'write' | 'memory' | 'ai';

interface BottomNavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  className?: string;
}

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    className="flex items-center justify-center w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-full active:scale-95 transition-transform duration-150"
  >
    {/* Active tab: light purple pill (#F1ECFB) with purple icon/text */}
    <span
      className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
        isActive
          ? 'bg-accentSoft text-accent font-semibold'
          : 'text-muted hover:text-primaryText hover:bg-black/[0.03]'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </span>
  </button>
);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'home',
  onTabChange,
  className = '',
}) => {
  const tabs: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'home', label: 'Home', icon: <Home className="w-[22px] h-[22px] stroke-[1.7]" /> },
    { tab: 'journal', label: 'Journal', icon: <BookOpen className="w-[22px] h-[22px] stroke-[1.7]" /> },
    { tab: 'memory', label: 'Memory', icon: <PiBrain className="w-[22px] h-[22px]" /> },
    { tab: 'ai', label: 'AI', icon: <TbSparkle className="w-[22px] h-[22px]" /> },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`relative z-30 w-full bg-surface/80 backdrop-blur-2xl pb-safe shadow-[0_-10px_30px_-12px_rgba(28,25,23,0.18)] ${className}`}
    >
      {/* Refined top hairline (gradient fade) — replaces the flat border-t */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative grid grid-cols-5 items-center h-[80px] px-1">
        {tabs.slice(0, 2).map((t) => (
          <TabButton
            key={t.tab}
            label={t.label}
            icon={t.icon}
            isActive={activeTab === t.tab}
            onClick={() => onTabChange?.(t.tab)}
          />
        ))}

        {/* Center write button — a purple circle that overlaps upward.
            It is NOT a standard tab. */}
        <div className="relative flex items-center justify-center">
          <CenterWriteButton
            onClick={() => onTabChange?.('write')}
            className="absolute -top-5"
          />
        </div>

        {tabs.slice(2).map((t) => (
          <TabButton
            key={t.tab}
            label={t.label}
            icon={t.icon}
            isActive={activeTab === t.tab}
            onClick={() => onTabChange?.(t.tab)}
          />
        ))}
      </div>
    </nav>
  );
};
