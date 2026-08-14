import React from 'react';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { ProfileCard } from './ProfileCard';
import { WritingSummaryCard } from './WritingSummaryCard';
import { SectionTitle } from './SectionTitle';
import { SettingsRow } from './SettingsRow';
import {
  isRuntimeConfigured,
  useAiSummary,
} from '../hooks/useJouspaceIntelligence';
import {
  ArrowLeft,
  Bell,
  Eye,
  Shield,
  Download,
  RefreshCw,
  Trash2,
  LifeBuoy,
  MessageCircle,
  Info,
  LogOut,
} from 'lucide-react';

export type InfoSheetKind = 'privacy' | 'help' | 'feedback' | 'about';

interface ProfileScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userInitials?: string;
  displayName?: string;
  email?: string;
  joinedDate?: string;
  avatarUrl?: string | null;
  entryCount?: number;
  topThemes?: string[];
  isLoading?: boolean;
  isNoAvatar?: boolean;
  isEmptyJournal?: boolean;
  isOffline?: boolean;
  onSave?: (name: string) => void;
  onOpenNotifications?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenAppearance?: () => void;
  onOpenInfo?: (kind: InfoSheetKind) => void;
  onExport?: () => void;
  onLoadDemo?: () => void;
  /** Distilled on-device AI memory notes (empty until first distillation). */
  aiMemoryNotes?: string;
  /** Clears the on-device AI memory. */
  onResetMemory?: () => void;
  /** Signs the user out (revives the auth screen). */
  onSignOut?: () => void;
}

export const ProfileScreenContent: React.FC<ProfileScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'VU',
  displayName = 'VU',
  email = 'vu@example.com',
  joinedDate = 'July 2026',
  avatarUrl = null,
  entryCount = 24,
  topThemes = ['clarity', 'discipline', 'purpose'],
  isLoading = false,
  isNoAvatar = false,
  isEmptyJournal = false,
  isOffline = false,
  onSave,
  onOpenNotifications,
  onOpenNotificationSettings,
  onOpenAppearance,
  onOpenInfo,
  onExport,
  onLoadDemo,
  aiMemoryNotes,
  onResetMemory,
  onSignOut,
}) => {
  // Live AI-written summary of the user's journal. Only streams when a runtime
  // is configured, the journal is non-empty, and the device is online.
  const summary = useAiSummary(
    isRuntimeConfigured() && entryCount > 0 && !isOffline
  );

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
          <div className="flex flex-col gap-7 w-full animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-borderSubtle rounded" />
                <div className="h-7 bg-borderSubtle rounded w-24" />
              </div>
              <div className="w-9 h-9 bg-borderSubtle rounded-full" />
            </div>
            <div className="bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col items-center gap-4">
              <div className="w-[72px] h-[72px] rounded-full bg-borderSubtle" />
              <div className="h-5 bg-borderSubtle rounded w-20" />
              <div className="h-4 bg-borderSubtle rounded w-32" />
              <div className="h-3 bg-borderSubtle rounded w-36" />
              <div className="h-10 bg-borderSubtle rounded-[14px] w-28 mt-1" />
            </div>
            <div className="bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col gap-4">
              <div className="h-3 bg-borderSubtle rounded w-24" />
              <div className="space-y-2">
                <div className="h-4 bg-borderSubtle rounded w-full" />
                <div className="h-4 bg-borderSubtle rounded w-3/4" />
                <div className="h-4 bg-borderSubtle rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <div className="flex flex-col">
            <header className="flex items-center justify-between py-2 bg-base">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onTabChange('home')}
                  className="p-0 bg-transparent border-none cursor-pointer text-primaryText hover:text-accent transition-colors duration-150 focus:outline-none"
                  aria-label="Back to Home"
                >
                  <ArrowLeft className="w-[22px] h-[22px] stroke-[1.8]" />
                </button>
                <span className="font-serif font-medium text-[26px] text-primaryText tracking-tight select-none">
                  Profile
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenNotifications}
                aria-label="Notifications"
                className="w-[38px] h-[38px] rounded-full bg-avatarBg hover:bg-borderSubtle flex items-center justify-center text-primaryText transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
              >
                <Bell className="w-5 h-5 text-primaryText stroke-[1.75]" />
              </button>
            </header>

            <p className="font-sans text-[13px] text-muted mt-0.5 leading-tight">
              Private journal
            </p>
          </div>

          <ProfileCard
            initials={userInitials}
            displayName={displayName}
            email={email}
            joinedDate={joinedDate}
            avatarUrl={isNoAvatar ? null : avatarUrl}
            onSave={onSave}
          />

          {onSignOut && (
            <div className="flex flex-col">
              <SectionTitle className="mb-1 px-0">Account</SectionTitle>
              <div className="flex flex-col bg-surface rounded-3xl border border-borderSubtle overflow-hidden">
                <SettingsRow
                  icon={<LogOut className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                  title="Sign out"
                  onClick={onSignOut}
                />
              </div>
            </div>
          )}

          {isEmptyJournal ? (
            <div className="bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col gap-4">
              <span className="font-sans text-[12.5px] font-medium text-muted tracking-wide uppercase select-none">
                ✦ Your journal
              </span>
              <p className="font-serif text-[17px] font-normal text-secondaryText leading-[1.65] tracking-tight m-0 italic">
                Your journal is waiting.
                <br />
                Begin writing to see your themes unfold.
              </p>
            </div>
          ) : (
            <WritingSummaryCard
              entryCount={entryCount}
              topThemes={topThemes}
              summaryText={summary.text || undefined}
              onExploreMemories={() => onTabChange('memory')}
            />
          )}

          {aiMemoryNotes ? (
            <div className="bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col gap-3">
              <span className="font-sans text-[12.5px] font-medium text-muted tracking-wide uppercase select-none">
                ✦ AI memory
              </span>
              <p className="font-serif text-[15px] font-normal text-primaryText leading-[1.6] tracking-tight m-0">
                {aiMemoryNotes}
              </p>
              <button
                type="button"
                onClick={onResetMemory}
                className="self-start mt-1 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-primaryText transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 rounded"
                aria-label="Reset AI memory"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                Reset AI memory
              </button>
            </div>
          ) : null}

          <div className="flex flex-col">
            <SectionTitle className="mb-1 px-0">Preferences</SectionTitle>
            <div className="flex flex-col">
              <SettingsRow
                icon={<Bell className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Notifications"
                onClick={onOpenNotificationSettings ?? onOpenNotifications}
              />
              <div className="h-px bg-borderSubtle ml-10" />
              <SettingsRow
                icon={<Eye className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Appearance"
                onClick={onOpenAppearance}
              />
              <div className="h-px bg-borderSubtle ml-10" />
              <SettingsRow
                icon={<Shield className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Privacy"
                onClick={() => onOpenInfo?.('privacy')}
              />
              <div className="h-px bg-borderSubtle ml-10" />
              <SettingsRow
                icon={<Download className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Export journal"
                onClick={onExport}
              />
              <div className="h-px bg-borderSubtle ml-10" />
              <SettingsRow
                icon={<RefreshCw className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Load sample data"
                onClick={onLoadDemo}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <SectionTitle className="mb-1 px-0">Support</SectionTitle>
            <div className="flex flex-col">
              <SettingsRow
                icon={<LifeBuoy className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Help Center"
                onClick={() => onOpenInfo?.('help')}
              />
              <div className="h-px bg-borderSubtle ml-10" />
              <SettingsRow
                icon={<MessageCircle className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Send Feedback"
                onClick={() => onOpenInfo?.('feedback')}
              />
              <div className="h-px bg-borderSubtle ml-10" />
              <SettingsRow
                icon={<Info className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="About Jouspace"
                onClick={() => onOpenInfo?.('about')}
              />
            </div>
          </div>


          {isOffline && (
            <div className="bg-surface rounded-2xl border border-borderSubtle px-5 py-3 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-muted animate-pulse shrink-0" />
              <span className="font-sans text-[12.5px] text-secondaryText">
                Offline — changes will sync when you reconnect
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
