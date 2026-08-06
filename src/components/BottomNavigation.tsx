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
      className={`relative bg-surface border border-border rounded-[20px] shadow-sm px-4 py-2 flex items-center justify-between min-h-[60px] ${className}`}
    >
      <button
        type="button"
        onClick={() => onTabChange?.('home')}
        aria-label="Home"
        aria-current={activeTab === 'home' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-2.5 min-h-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl ${
          activeTab === 'home' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">Home</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange?.('journal')}
        aria-label="Journal"
        aria-current={activeTab === 'journal' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-2.5 min-h-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl ${
          activeTab === 'journal' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
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
        className={`flex flex-col items-center justify-center flex-1 py-2.5 min-h-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl ${
          activeTab === 'memory' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <Layers className={`w-5 h-5 ${activeTab === 'memory' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">Memory</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange?.('ai')}
        aria-label="AI"
        aria-current={activeTab === 'ai' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-2.5 min-h-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl ${
          activeTab === 'ai' ? 'text-accent' : 'text-muted hover:text-primaryText'
        }`}
      >
        <TbSparkle className={`w-5 h-5 ${activeTab === 'ai' ? 'stroke-2' : 'stroke-[1.6]'}`} />
        <span className="text-[10.5px] font-sans mt-1 font-medium leading-none">AI</span>
      </button>
    </nav>
  );
};
