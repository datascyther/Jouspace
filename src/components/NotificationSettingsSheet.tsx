import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Clock, X } from 'lucide-react';
import { usePermissions } from '../permissions/usePermissions';
import { ReminderService } from '../notifications';

/**
 * NotificationSettingsScreen — a full-screen route for managing notification
 * and reminder preferences. Wired to the real PermissionService and
 * ReminderService so every toggle persists and actually does what it says.
 *
 * Presentation: rendered as a dedicated route on the nav stack (only one screen
 * mounted at a time) so the background screen freezes instead of shifting. Back
 * via `onBack`.
 */
interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onBack,
}) => {
  const { states, ensure, openSettings } = usePermissions();
  const [busy, setBusy] = useState<'notifications' | 'reminders' | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(
    ReminderService.areRemindersEnabled(),
  );

  // Refresh reminders state on mount.
  useEffect(() => {
    setRemindersEnabled(ReminderService.areRemindersEnabled());
  }, []);

  const notifGranted = states.notifications === 'granted';
  const notifBlocked =
    states.notifications === 'deniedPermanently' ||
    states.notifications === 'restricted';

  const handleToggleNotifications = useCallback(async () => {
    if (busy) return;
    setBusy('notifications');
    try {
      if (notifGranted) {
        // Already granted — just send the user to system Settings to revoke.
        await openSettings('notifications');
      } else if (notifBlocked) {
        // Permanently denied — must go to system Settings.
        await openSettings('notifications');
      } else {
        // Prompt the user.
        const res = await ensure('notifications');
        if (res.ok) {
          // Permission granted — also arm reminders by default.
          ReminderService.setRemindersEnabled(true);
          setRemindersEnabled(true);
        } else if (res.state === 'deniedPermanently' || res.state === 'restricted') {
          await openSettings('notifications');
        }
      }
    } finally {
      setBusy(null);
    }
  }, [busy, notifGranted, notifBlocked, ensure, openSettings]);

  const handleToggleReminders = useCallback(() => {
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    ReminderService.setRemindersEnabled(next);
  }, [remindersEnabled]);

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-surface border border-borderSubtle flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <h1 className="font-serif font-medium text-[18px] text-primaryText tracking-tight">
          Notifications
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      {/* Settings list */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-6 pb-4 pb-safe">
        <div className="flex flex-col gap-4">
          {/* Notification permission toggle */}
          <div className="bg-surface rounded-2xl border border-borderSubtle p-4 flex items-center gap-4">
            <div
              className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                notifGranted ? 'bg-accentSoft text-accent' : 'bg-baseTint text-secondary'
              }`}
            >
              {notifGranted ? (
                <Bell className="w-5 h-5 stroke-[1.8]" />
              ) : (
                <BellOff className="w-5 h-5 stroke-[1.8]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-medium text-primaryText leading-tight">
                Push notifications
              </h3>
              <p className="text-[13px] text-secondaryText mt-0.5 leading-snug">
                {notifGranted
                  ? 'Enabled — you\'ll receive gentle reminders'
                  : notifBlocked
                    ? 'Blocked — enable in device Settings'
                    : 'Allow Jouspace to send you quiet reminders'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifGranted}
              aria-label="Toggle push notifications"
              disabled={busy === 'notifications'}
              onClick={() => void handleToggleNotifications()}
              className="relative inline-flex shrink-0 items-center justify-center rounded-pill min-w-[52px] h-8 min-h-11
                         transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2
                         disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <span
                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 rounded-pill transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                            ${notifGranted ? 'bg-accent' : 'bg-baseTint'}`}
              />
              <span
                className={`absolute top-1/2 left-1 -translate-y-1/2 w-7 h-7 rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.2)]
                            transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                            ${notifGranted ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Reminders toggle (only shown when notifications are granted) */}
          {notifGranted && (
            <div className="bg-surface rounded-2xl border border-borderSubtle p-4 flex items-center gap-4">
              <div
                className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                  remindersEnabled ? 'bg-accentSoft text-accent' : 'bg-baseTint text-secondary'
                }`}
              >
                <Clock className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-primaryText leading-tight">
                  Journal reminders
                </h3>
                <p className="text-[13px] text-secondaryText mt-0.5 leading-snug">
                  {remindersEnabled
                    ? 'Evening reminder + draft nudge active'
                    : 'Reminders paused'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={remindersEnabled}
                aria-label="Toggle journal reminders"
                onClick={handleToggleReminders}
                className="relative inline-flex shrink-0 items-center justify-center rounded-pill min-w-[52px] h-8 min-h-11
                           transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2
                           cursor-pointer"
              >
                <span
                  className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 rounded-pill transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                              ${remindersEnabled ? 'bg-accent' : 'bg-baseTint'}`}
                />
                <span
                  className={`absolute top-1/2 left-1 -translate-y-1/2 w-7 h-7 rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.2)]
                              transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                              ${remindersEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          )}

          {/* Info text */}
          <p className="text-[13px] text-muted leading-relaxed px-1">
            Jouspace sends only quiet, occasional reminders — no marketing, no
            noise. You can change these anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
