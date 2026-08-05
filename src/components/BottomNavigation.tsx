import React from 'react';
import { CenterWriteButton } from './CenterWriteButton';
import { Home, BookOpen, Layers, Sparkles } from 'lucide-react';

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
      className={`relative bg-[#FFFEFC] border border-[#E7E1EF] rounded-[28px] shadow-sm px-4 py-2 flex items-center justify-between min-h-[72px] ${className}`}
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => onTabChange?.('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'home' ? 'text-[#6D4FD7]' : 'text-[#8B8998] hover:text-[#0D102B]'
        }`}
      >
        <Home className={`w-[22px] h-[22px] ${activeTab === 'home' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
        <span className="text-[11.5px] font-sans mt-1 font-medium leading-none">Home</span>
      </button>

      {/* 2. Journal */}
      <button
        type="button"
        onClick={() => onTabChange?.('journal')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'journal' ? 'text-[#6D4FD7]' : 'text-[#8B8998] hover:text-[#0D102B]'
        }`}
      >
        <BookOpen className={`w-[22px] h-[22px] ${activeTab === 'journal' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
        <span className="text-[11.5px] font-sans mt-1 font-medium leading-none">Journal</span>
      </button>

      {/* 3. Center Write Floating Button */}
      <div className="flex-1 flex justify-center items-center relative">
        <CenterWriteButton onClick={() => onTabChange?.('write')} />
      </div>

      {/* 4. Memory */}
      <button
        type="button"
        onClick={() => onTabChange?.('memory')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'memory' ? 'text-[#6D4FD7]' : 'text-[#8B8998] hover:text-[#0D102B]'
        }`}
      >
        <Layers className={`w-[22px] h-[22px] ${activeTab === 'memory' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
        <span className="text-[11.5px] font-sans mt-1 font-medium leading-none">Memory</span>
      </button>

      {/* 5. AI */}
      <button
        type="button"
        onClick={() => onTabChange?.('ai')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'ai' ? 'text-[#6D4FD7]' : 'text-[#8B8998] hover:text-[#0D102B]'
        }`}
      >
        <Sparkles className={`w-[22px] h-[22px] ${activeTab === 'ai' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
        <span className="text-[11.5px] font-sans mt-1 font-medium leading-none">AI</span>
      </button>
    </nav>
  );
};
