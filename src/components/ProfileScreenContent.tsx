import React from 'react';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { SectionTitle } from './SectionTitle';
import { SettingsRow } from './SettingsRow';
import {
  ArrowLeft,
  Bell,
  Eye,
  Shield,
  Download,
  Pencil,
  Trash2,
  LifeBuoy,
  MessageCircle,
  Info,
  LogOut,
  UserPlus,
  Cloud,
} from 'lucide-react';
import { type SyncStatus } from '../store/cloudSync';

export type InfoSheetKind = 'privacy' | 'help' | 'feedback' | 'about';

interface ProfileScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userInitials?: string;
  displayName?: string;
  email?: string;
  joinedDate?: string;
  isLoading?: boolean;
  isOffline?: boolean;
  onOpenNotifications?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenAppearance?: () => void;
  onOpenInfo?: (kind: InfoSheetKind) => void;
  onExport?: () => void;
  /** Distilled on-device AI memory notes (empty until first distillation). */
  aiMemoryNotes?: string;
  /** Clears the on-device AI memory. */
  onResetMemory?: () => void;  /** Opens the edit-profile screen. */
  onEditProfile?: () => void;  /** Opens the auth screen (sign in / switch account) on demand. */
  onSignIn?: () => void;
  /** Signs the user out (revives the auth screen). */
  onSignOut?: () => void;
  /** Cloud sync status indicator. */
  syncStatus?: SyncStatus;
}

export const ProfileScreenContent: React.FC<ProfileScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'VU',
  displayName = 'VU',
  email = 'vu@example.com',
  joinedDate = 'July 2026',
  isLoading = false,
  isOffline = false,
  onOpenNotifications,
  onOpenNotificationSettings,
  onOpenAppearance,
  onEditProfile,
  onOpenInfo,
  onExport,
  aiMemoryNotes,
  onResetMemory,
  onSignIn,
  onSignOut,
  syncStatus,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-4 pt-2 pb-4">
          <div className="flex flex-col gap-7 w-full animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-borderSubtle rounded" />
                <div className="h-7 bg-borderSubtle rounded w-24" />
              </div>
              <div className="w-9 h-9 bg-borderSubtle rounded-full" />
            </div>
            <div className="bg-surface rounded-3xl border border-borderSubtle overflow-hidden animate-pulse">
              <div className="flex items-center gap-4 px-5 py-5">
                <div className="w-12 h-12 rounded-full bg-borderSubtle shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-borderSubtle rounded w-20" />
                  <div className="h-3 bg-borderSubtle rounded w-32" />
                  <div className="h-3 bg-borderSubtle rounded w-28 mt-0.5" />
                </div>
              </div>
              <div className="h-px bg-borderSubtle mx-4" />
              <div className="flex items-center py-3">
                <div className="flex-1 flex justify-center"><div className="h-3 bg-borderSubtle rounded w-16" /></div>
                <div className="w-px h-5 bg-borderSubtle" />
                <div className="flex-1 flex justify-center"><div className="h-3 bg-borderSubtle rounded w-20" /></div>
                <div className="w-px h-5 bg-borderSubtle" />
                <div className="flex-1 flex justify-center"><div className="h-3 bg-borderSubtle rounded w-14" /></div>
              </div>
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
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-4 pt-2 pb-4">
        <div className="flex flex-col gap-5 w-full">
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

          {/* ── Unified Profile Card ── */}
          <div className="bg-surface rounded-3xl border border-borderSubtle overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-5">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <span className="font-sans text-[17px] font-medium text-accent select-none">{userInitials}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-[15px] font-semibold text-primaryText truncate">{displayName}</span>
                <span className="font-sans text-[12.5px] text-muted truncate leading-tight">{email}</span>
                <span className="font-sans text-[11px] text-secondaryText mt-0.5">Writing since {joinedDate}</span>
              </div>
              {(syncStatus ?? 'idle') !== 'idle' && (
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <Cloud className="w-3.5 h-3.5 text-muted" />
                  <span className="font-sans text-[11px] text-muted">
                    {(syncStatus ?? 'idle') === 'syncing'
                      ? 'Syncing…'
                      : (syncStatus ?? 'idle') === 'synced'
                        ? 'Synced'
                        : 'Error'}
                  </span>
                </div>
              )}
            </div>
            <div className="h-px bg-borderSubtle mx-4" />
            <div className="flex items-center">
              <button
                type="button"
                onClick={onEditProfile}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-transparent border-none cursor-pointer text-muted hover:text-accent transition-colors duration-150 font-sans text-[13px] font-medium"
              >
                <Pencil className="w-3.5 h-3.5 stroke-[1.8] flex-none" />
                <span className="truncate">Edit profile</span>
              </button>
              <div className="w-px h-5 bg-borderSubtle" aria-hidden="true" />
              {onSignIn && (
                <>
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-transparent border-none cursor-pointer text-muted hover:text-accent transition-colors duration-150 font-sans text-[13px] font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[1.8] flex-none" />
                    <span className="truncate">Switch account</span>
                  </button>
                  <div className="w-px h-5 bg-borderSubtle" aria-hidden="true" />
                </>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-transparent border-none cursor-pointer text-muted hover:text-secondaryText transition-colors duration-150 font-sans text-[13px] font-medium"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[1.8] flex-none" />
                <span className="truncate">Sign out</span>
              </button>
            </div>
          </div>



          {aiMemoryNotes ? (
            <div className="bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col gap-3">
              <span className="font-sans text-[12.5px] font-medium text-muted tracking-wide uppercase select-none">
                ✦ AI memory
              </span>
              <p className="font-serif text-[14px] font-normal text-primaryText leading-[1.55] tracking-tight m-0">
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
