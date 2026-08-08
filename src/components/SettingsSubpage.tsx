import React, { useState } from 'react';
import { ArrowLeft, Download, Sparkles, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { RUNTIME_URL_STORAGE_KEY } from '../hooks/useJouspaceIntelligence';
import { isValidRuntimeUrl } from '../utils/validation';

interface SettingsSubpageProps {
  onBack?: () => void;
  onExport?: () => void;
  onLoadDemo?: () => void;
  className?: string;
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  subtitle,
  onClick,
  trailing,
}) => (
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
    {trailing}
  </button>
);

export const SettingsSubpage: React.FC<SettingsSubpageProps> = ({
  onBack,
  onExport,
  onLoadDemo,
  className = '',
}) => {
  const [runtimeUrl, setRuntimeUrl] = useState<string>(
    () => localStorage.getItem(RUNTIME_URL_STORAGE_KEY) ?? ''
  );
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  const urlValid = isValidRuntimeUrl(runtimeUrl);
  const showError = touched && !urlValid;

  const saveRuntimeUrl = () => {
    if (!urlValid) {
      setTouched(true);
      return;
    }
    const trimmed = runtimeUrl.trim();
    if (trimmed) localStorage.setItem(RUNTIME_URL_STORAGE_KEY, trimmed);
    else localStorage.removeItem(RUNTIME_URL_STORAGE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 shrink-0 border-b border-divider">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <ArrowLeft className="w-[18px] h-[18px] stroke-[1.8]" />
        </button>
        <h1 className="font-serif font-medium text-[22px] text-primaryText tracking-tight">
          Settings
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pb-6">
        {/* AI Runtime URL */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-4 mt-5 mb-5">
          <div className="flex items-center gap-2 mb-2 text-accent">
            <Sparkles className="w-4 h-4 stroke-2" />
            <span className="font-serif text-[16px] text-primaryText">
              AI runtime URL
            </span>
          </div>
          <p className="font-sans text-[12.5px] text-muted mb-3 leading-relaxed">
            Optional. Point Jouspace at your own Intelligence Runtime so the AI
            tab can reflect on your entries. Leave blank to use the built-in
            behavior.
          </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                inputMode="url"
                placeholder="https://your-runtime-host"
                value={runtimeUrl}
                onChange={(e) => setRuntimeUrl(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={showError}
                className={`flex-1 bg-background border rounded-[12px] px-3 py-2 font-sans text-[13px] text-primaryText outline-none placeholder:text-muted focus:border-accent transition-colors ${
                  showError ? 'border-error' : 'border-border'
                }`}
              />
              <button
                type="button"
                onClick={saveRuntimeUrl}
                disabled={!urlValid}
                className="bg-accent hover:bg-accentHover disabled:opacity-50 text-white font-sans text-[13px] font-medium px-4 py-2 rounded-[12px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                Save
              </button>
            </div>
            {showError && (
              <p className="font-sans text-[12px] text-error bg-errorBg px-3 py-1.5 rounded-[10px] mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Enter a valid http(s) URL, or leave blank to clear.
              </p>
            )}
            {saved && (
              <p className="font-sans text-[12px] text-accent mt-2">
                Runtime URL saved.
              </p>
            )}
        </div>

        {/* Data actions */}
        <div className="flex flex-col">
          <SettingsRow
            icon={<Download className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
            label="Export journal"
            subtitle="Download your entries as JSON"
            onClick={onExport}
          />
          <div className="h-px bg-divider ml-10" />
          <SettingsRow
            icon={<RefreshCw className="w-[18px] h-[18px] text-accent stroke-[1.8]" />}
            label="Load sample data"
            subtitle="Add example entries to explore"
            onClick={onLoadDemo}
          />
        </div>

        {/* Privacy disclosure */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-4 mt-5">
          <div className="flex items-center gap-2 mb-2 text-accent">
            <Shield className="w-4 h-4 stroke-2" />
            <span className="font-serif text-[16px] text-primaryText">Privacy</span>
          </div>
          <p className="font-sans text-[12.5px] text-secondaryText leading-relaxed">
            Your journal is stored entirely on this device (in your browser's
            local storage). Nothing is uploaded unless you configure an AI
            runtime URL — in which case the entries you send are shared with that
            runtime to generate reflections. We have no account, no cloud sync,
            and no server that can read your journal.
          </p>
        </div>
      </div>
    </div>
  );
};
