/**
 * Notifications module barrel — journal reminder scheduling.
 *
 * Primary entry point: `ReminderService` (refresh / armOnBackground / cancel /
 * setRemindersEnabled / onReminderOpen). Bridges mirror the permission module:
 * `nativeBridge` talks to Capacitor's LocalNotifications; `webBridge` is the
 * best-effort browser fallback.
 */
export {
  ReminderService,
  refresh,
  armOnBackground,
  cancel,
  setRemindersEnabled,
  areRemindersEnabled,
  onReminderOpen,
} from './ReminderService';

export type { ScheduledReminder } from './nativeBridge';
export type { WebReminder } from './webBridge';
