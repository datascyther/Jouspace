/**
 * Web fallback for journal reminders.
 *
 * The browser Notification API can't deliver a notification while the tab is
 * closed (that needs a Service Worker + Push, intentionally out of scope — we
 * keep this feature simple). So on the web we do one best-effort thing: when the
 * user switches away from the tab and a reminder is warranted, fire a gentle
 * notification immediately (the page is still alive in the background briefly).
 * The tap focuses the window and runs the same "open journal" handler.
 *
 * Deferred, time-to-time reminders (8 PM daily, 2h after a draft) are a native
 * capability delivered by `nativeBridge.ts` in the Capacitor build.
 */

export interface WebReminder {
  title: string;
  body: string;
  extra?: Record<string, unknown>;
}

let tapHandler: ((extra?: Record<string, unknown>) => void) | null = null;

export function webIsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Fire an immediate, best-effort notification (web only). */
export function webNotify(reminder: WebReminder): void {
  if (!webIsSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const note = new Notification(reminder.title, {
      body: reminder.body,
      tag: 'jouspace-reminder',
      silent: false,
    });
    note.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore */
      }
      tapHandler?.(reminder.extra);
      note.close();
    };
  } catch {
    /* some browsers block non-gesture notifications; ignore */
  }
}

/** Register the handler run when a web notification is tapped. */
export function webOnTap(cb: (extra?: Record<string, unknown>) => void): void {
  tapHandler = cb;
}
