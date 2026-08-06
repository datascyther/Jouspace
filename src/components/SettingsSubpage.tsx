import React from 'react';
import { ArrowLeft, Bell, Palette, Lock, Download, HelpCircle, Info, ChevronRight } from 'lucide-react';

interface SettingsSubpageProps {
  onBack?: () => void;
  className?: string;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, subtitle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3.5 w-full text-left py-3.5 hover:bg-accentSoft rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer -mx-1 px-2.5"
  >
    <div className="w-9 h-9 rounded-full bg-accentSoft flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-sans text-[14px] font-medium text-primaryText">{label}</p>
      {subtitle && <p className="font-sans text-[12px] text-muted">{subtitle}</p>}
    </div>
    <ChevronRight className="w-[18px] h-[18px] text-muted stroke-[1.6] shrink-0" />
  </button>
);

export const SettingsSubpage: React.FC<SettingsSubpageProps> = ({ onBack, className = '' }) => {
  return (
    <div className={`flex flex-col w-full pt-4 px-6 animate-fadeIn ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <ArrowLeft className="w-[18px] h-[18px] stroke-[1.8]" />
        </button>
        <h1 className="font-serif font-medium text-[22px] text-primaryText tracking-tight">Settings</h1>
      </div>

      {/* Settings List */}
      <div className="flex flex-col">
        <SettingsItem
          icon={<Bell className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
          label="Notifications"
          subtitle="Memory reminders, journal prompts"
        />
        <SettingsItem
          icon={<Palette className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
          label="Appearance"
          subtitle="Theme, text size"
        />
        <SettingsItem
          icon={<Lock className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
          label="Privacy"
          subtitle="Data, permissions"
        />
        <SettingsItem
          icon={<Download className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
          label="Export"
          subtitle="Download your journal"
        />
        <SettingsItem
          icon={<HelpCircle className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
          label="Help"
          subtitle="FAQ, contact support"
        />
        <SettingsItem
          icon={<Info className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
          label="About"
          subtitle="Version 1.0.0"
        />
      </div>
    </div>
  );
};
