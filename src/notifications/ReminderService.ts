/**
 * ReminderService — the "gentle nudge" brain for Jouspace.
 *
 * Design goals (per product direction):
 *  - Remind the user to journal *time-to-time*, even after the app is closed.
 *  - Cover both cases: the user already wrote something today, OR they were
 *    mid-entry (an unsaved draft) and closed the app.
 *  - Sophisticated but simple: a single recurring evening reminder plus a
 *    one-off "finish your thought" nudge for an open draft. No recursion, no
 *    complex rescheduling loops — the OS repeats the daily reminder for us.
 *
 * Wiring:
 *  - On app foreground / after saving an entry → `refresh()`.
 *  - On app background (user leaves) → `armOnBackground()` (schedules the draft
 *    nudge for native; shows a best-effort notification on web).
 *  - Tapping a reminder → `onReminderOpen` callback opens the composer.
 *
 * Gating: reminders run only when the notifications permission is `granted` AND
 * the app-level `remindersEnabled` preference is true (so the primer's "opt out"
 * truly stops them).
 */

import { readDraft } from '../utils/draft';
import { journalStore } from '../store';
import { loadProfile, DEFAULT_DISPLAY_NAME } from '../hooks/useProfile';
import { queueUserPrefsSync } from '../lib/supabaseUserPrefs';
import { PermissionService } from '../permissions';
import {
  nativeSchedule,
  nativeCancel,
  nativeCancelAll,
  nativeOnTap,
  type ScheduledReminder,
} from './nativeBridge';
import { webNotify, webOnTap, type WebReminder } from './webBridge';

const DAILY_ID = 1001;
const DRAFT_ID = 1002;

const EVENING_HOUR = 20; // 8 PM local
const EVENING_MINUTE = 0;
const DRAFT_NUDGE_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

const ENABLED_KEY = 'jouspace:reminders:v1';

// Calm, quiet copy (matches the app's tone). Rotated daily so it feels fresh.
const EVENING_MESSAGES = [
  'Your journal is here whenever you’re ready.',
  'A quiet moment to write — how was your day?',
  'Take a breath. Your thoughts are worth keeping.',
  'What’s on your mind this evening?',
  'A few lines today can lighten tomorrow.',
  'Your journal missed you today.',
  'Pause, and let the day settle onto the page.',
];

const DRAFT_MESSAGES = [
  'You started something earlier — your unfinished thought is still here.',
  'Your half-written entry is waiting whenever you return.',
  'You left a thought unfinished. Pick it back up when you’re ready.',
];

const DRAFT_TITLE = 'Your thought is waiting';

function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();
}

function readEnabled(): boolean {
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (!raw) return true; // default on once permission is granted
    return (JSON.parse(raw) as { enabled?: boolean }).enabled !== false;
  } catch {
    return true;
  }
}

function writeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, JSON.stringify({ enabled }));
  } catch {
    /* ignore */
  }
  void queueUserPrefsSync();
}

function getDisplayName(): string {
  try {
    const name = loadProfile().displayName?.trim() ?? '';
    if (name && name !== DEFAULT_DISPLAY_NAME) return name;
  } catch {
    /* ignore */
  }
  return '';
}

function personalize(message: string, name: string): string {
  if (!name) return message;
  const lower = message.charAt(0).toLowerCase() + message.slice(1);
  return `${name}, ${lower}`;
}

function wroteToday(): boolean {
  try {
    const entries = journalStore.list();
    if (entries.length === 0) return false;
    const newest = entries[0]; // list() is sorted newest-first by updatedAt
    const d = new Date(newest.updatedAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

function nextEvening(): number {
  const d = new Date();
  d.setHours(EVENING_HOUR, EVENING_MINUTE, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return dayOfYear % EVENING_MESSAGES.length;
}

interface Plan {
  notifications: ScheduledReminder[];
  webReminder: WebReminder | null;
}

function buildPlan(): Plan {
  const draft = readDraft();
  const wrote = wroteToday();
  const name = getDisplayName();

  const evening = EVENING_MESSAGES[dayIndex()];
  const daily: ScheduledReminder = {
    id: DAILY_ID,
    title: 'Jouspace',
    body: personalize(evening, name),
    at: nextEvening(),
    repeats: true,
    extra: { screen: 'journal' },
  };

  const notifications: ScheduledReminder[] = [daily];
  let webReminder: WebReminder | null = null;

  const hasDraft = !!(draft && (draft.title.trim() || draft.body.trim()));
  if (hasDraft) {
    const draftMsg = DRAFT_MESSAGES[Math.floor(Math.random() * DRAFT_MESSAGES.length)];
    notifications.push({
      id: DRAFT_ID,
      title: DRAFT_TITLE,
      body: personalize(draftMsg, name),
      at: Date.now() + DRAFT_NUDGE_DELAY_MS,
      repeats: false,
      extra: { screen: 'journal' },
    });
    webReminder = {
      title: DRAFT_TITLE,
      body: personalize(draftMsg, name),
      extra: { screen: 'journal' },
    };
  } else if (!wrote) {
    // No entry today and no draft — worth a gentle web nudge when they leave.
    webReminder = { title: daily.title, body: daily.body, extra: daily.extra };
  }

  return { notifications, webReminder };
}

async function scheduleNative(plan: Plan): Promise<void> {
  // Cancel first so a removed draft nudge (or changed daily time) doesn't linger.
  await nativeCancel([DAILY_ID, DRAFT_ID]);
  if (plan.notifications.length > 0) await nativeSchedule(plan.notifications);
}

/** Re-arm reminders. Call on foreground and after saving an entry. */
export async function refresh(): Promise<void> {
  const { state } = await PermissionService.getStatus('notifications');
  if (state !== 'granted' || !readEnabled()) {
    if (isNative()) await nativeCancelAll();
    return;
  }
  const plan = buildPlan();
  if (isNative()) await scheduleNative(plan);
  // Web can't defer; the background handler covers the visible-tab case.
}

/** Arm reminders as the user leaves the app (closes / backgrounds it). */
export async function armOnBackground(): Promise<void> {
  const { state } = await PermissionService.getStatus('notifications');
  if (state !== 'granted' || !readEnabled()) return;
  const plan = buildPlan();
  if (isNative()) {
    await scheduleNative(plan);
  } else if (
    plan.webReminder &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'hidden'
  ) {
    // Best-effort: fire now while the page is still alive in the background.
    webNotify(plan.webReminder);
  }
}

/** Stop and clear all reminders (e.g. when reminders are disabled). */
export async function cancel(): Promise<void> {
  if (isNative()) await nativeCancelAll();
}

/** Enable or disable reminders at the app level (honours primer opt-out). */
export function setRemindersEnabled(enabled: boolean): void {
  writeEnabled(enabled);
  if (!enabled) void cancel();
  else void refresh();
}

/** Current app-level reminder preference. */
export function areRemindersEnabled(): boolean {
  return readEnabled();
}

/** Register the handler invoked when a reminder is tapped. Returns unsubscribe. */
export function onReminderOpen(
  cb: (extra: Record<string, unknown> | undefined) => void,
): () => void {
  const offNative = nativeOnTap(cb);
  webOnTap(cb);
  return () => {
    offNative();
  };
}

export const ReminderService = {
  refresh,
  armOnBackground,
  cancel,
  setRemindersEnabled,
  areRemindersEnabled,
  onReminderOpen,
};
