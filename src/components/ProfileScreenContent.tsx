import React from 'react';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { ProfileCard } from './ProfileCard';
import { WritingSummaryCard } from './WritingSummaryCard';
import { SectionTitle } from './SectionTitle';
import { SettingsRow } from './SettingsRow';
import {
  ArrowLeft,
  Bell,
  Eye,
  Shield,
  Download,
  LifeBuoy,
  MessageCircle,
  Info,
  LogOut,
} from 'lucide-react';

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
  isOffline?: boolean;
  isEmptyJournal?: boolean;
  isSignedOut?: boolean;
  onToast?: (msg: string) => void;
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
  isOffline = false,
  isEmptyJournal = false,
  isSignedOut = false,
  onToast,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
          <div className="flex flex-col gap-7 w-full animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-border rounded" />
                <div className="h-7 bg-border rounded w-24" />
              </div>
              <div className="w-9 h-9 bg-border rounded-full" />
            </div>
            <div className="bg-surface rounded-[24px] border border-border p-6 flex flex-col items-center gap-4">
              <div className="w-[72px] h-[72px] rounded-full bg-border" />
              <div className="h-5 bg-border rounded w-20" />
              <div className="h-4 bg-border rounded w-32" />
              <div className="h-3 bg-border rounded w-36" />
              <div className="h-10 bg-border rounded-[14px] w-28 mt-1" />
            </div>
            <div className="bg-surface rounded-[24px] border border-border p-6 flex flex-col gap-4">
              <div className="h-3 bg-border rounded w-24" />
              <div className="space-y-2">
                <div className="h-4 bg-border rounded w-full" />
                <div className="h-4 bg-border rounded w-3/4" />
                <div className="h-4 bg-border rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 mx-2 pb-2 pb-safe">
          <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
    );
  }

  if (isSignedOut) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
          <div className="flex flex-col gap-7 w-full">
            <header className="flex items-center justify-between py-2 bg-transparent">
              <span className="font-serif font-medium text-[26px] text-primaryText tracking-tight select-none">
                Profile
              </span>
            </header>
            <div className="bg-surface rounded-[24px] border border-border p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-[72px] h-[72px] rounded-full bg-avatarBg flex items-center justify-center">
                <LogOut className="w-8 h-8 text-muted stroke-[1.5]" />
              </div>
              <p className="font-sans text-[15px] text-secondaryText leading-relaxed m-0">
                You've signed out.
                <br />
                Your journal entries are safe and private.
              </p>
            </div>
          </div>
        </div>
        <div className="shrink-0 mx-2 pb-2 pb-safe">
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
            <header className="flex items-center justify-between py-2 bg-transparent">
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
                aria-label="Notifications"
                className="w-[38px] h-[38px] rounded-full bg-avatarBg hover:bg-border flex items-center justify-center text-primaryText transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
              >
                <Bell className="w-[20px] h-[20px] text-primaryText stroke-[1.75]" />
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
            onEditProfile={() => onToast?.('Edit profile')}
          />

          {isEmptyJournal ? (
            <div className="bg-surface rounded-[24px] border border-border p-6 flex flex-col gap-4">
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
              onExploreMemories={() => onTabChange('memory')}
            />
          )}

          <div className="flex flex-col">
            <SectionTitle className="mb-1 px-0">Preferences</SectionTitle>
            <div className="flex flex-col">
              <SettingsRow
                icon={<Bell className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Notifications"
                onClick={() => onToast?.('Notifications settings')}
              />
              <div className="h-px bg-divider ml-10" />
              <SettingsRow
                icon={<Eye className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Appearance"
                onClick={() => onToast?.('Appearance settings')}
              />
              <div className="h-px bg-divider ml-10" />
              <SettingsRow
                icon={<Shield className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Privacy"
                onClick={() => onToast?.('Privacy settings')}
              />
              <div className="h-px bg-divider ml-10" />
              <SettingsRow
                icon={<Download className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Export journal"
                onClick={() => onToast?.('Export journal')}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <SectionTitle className="mb-1 px-0">Support</SectionTitle>
            <div className="flex flex-col">
              <SettingsRow
                icon={<LifeBuoy className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Help Center"
                onClick={() => onToast?.('Help Center')}
              />
              <div className="h-px bg-divider ml-10" />
              <SettingsRow
                icon={<MessageCircle className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="Send Feedback"
                onClick={() => onToast?.('Send Feedback')}
              />
              <div className="h-px bg-divider ml-10" />
              <SettingsRow
                icon={<Info className="w-[18px] h-[18px] text-muted stroke-[1.6]" />}
                title="About Jouspace"
                onClick={() => onToast?.('About Jouspace')}
              />
              <div className="h-px bg-divider ml-10" />
              <SettingsRow
                icon={<LogOut className="w-[18px] h-[18px] stroke-[1.6]" />}
                title="Sign Out"
                variant="danger"
                onClick={() => onToast?.('Sign Out')}
              />
            </div>
          </div>

          {isOffline && (
            <div className="bg-surface rounded-[16px] border border-border px-5 py-3 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-muted animate-pulse shrink-0" />
              <span className="font-sans text-[12.5px] text-secondaryText">
                Offline — changes will sync when you reconnect
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 mx-2 pb-2 pb-safe">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
