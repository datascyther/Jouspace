import React from 'react';
import { CenterWriteButton } from './CenterWriteButton';
import { Home, BookOpen, Layers } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';

export type NavTab = 'home' | 'journal' | 'write' | 'memory' | 'ai';

interface BottomNavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'home',
  onTabChange,
  className = '',
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className={`relative bg-surface rounded-full shadow-lg px-3 py-2 flex items-center justify-between min-h-[56px] ${className}`}
    >
      <button
        type="button"
        onClick={() => onTabChange?.('home')}
        aria-label="Home"
        aria-current={activeTab === 'home' ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center flex-1 py-2 min-h-11 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl ${
          activeTab === 'home' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <span className={`absolute inset-0 rounded-2xl bg-accent/10 transition-opacity duration-200 ${activeTab === 'home' ? 'opacity-100' : 'opacity-0'}`} />
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">Home</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange?.('journal')}
        aria-label="Journal"
        aria-current={activeTab === 'journal' ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center flex-1 py-2 min-h-11 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl ${
          activeTab === 'journal' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <span className={`absolute inset-0 rounded-2xl bg-accent/10 transition-opacity duration-200 ${activeTab === 'journal' ? 'opacity-100' : 'opacity-0'}`} />
        <BookOpen className={`w-5 h-5 ${activeTab === 'journal' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">Journal</span>
      </button>

      <div className="flex-1 flex justify-center items-center relative">
        <CenterWriteButton onClick={() => onTabChange?.('write')} />
      </div>

      <button
        type="button"
        onClick={() => onTabChange?.('memory')}
        aria-label="Memory"
        aria-current={activeTab === 'memory' ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center flex-1 py-2 min-h-11 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl ${
          activeTab === 'memory' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <span className={`absolute inset-0 rounded-2xl bg-accent/10 transition-opacity duration-200 ${activeTab === 'memory' ? 'opacity-100' : 'opacity-0'}`} />
        <Layers className={`w-5 h-5 ${activeTab === 'memory' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">Memory</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange?.('ai')}
        aria-label="AI"
        aria-current={activeTab === 'ai' ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center flex-1 py-2 min-h-11 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl ${
          activeTab === 'ai' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <span className={`absolute inset-0 rounded-2xl bg-accent/10 transition-opacity duration-200 ${activeTab === 'ai' ? 'opacity-100' : 'opacity-0'}`} />
        <TbSparkle className={`w-5 h-5 ${activeTab === 'ai' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">AI</span>
      </button>
    </nav>
  );
};
