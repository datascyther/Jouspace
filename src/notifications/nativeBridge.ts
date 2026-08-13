/**
 * Native bridge to Capacitor's LocalNotifications plugin.
 *
 * Mirrors the pattern in `src/permissions/nativeBridge.ts`: talk to Capacitor via
 * the injected `window.Capacitor.Plugins` global instead of statically importing
 * `@capacitor/local-notifications`. That keeps the web build working when the
 * optional native package is absent, and activates the native path automatically
 * inside a Capacitor shell.
 *
 * Local notifications are what let Jouspace remind the user to journal after the
 * app is closed — the OS wakes the app on tap and we navigate them to the composer.
 */

type AnyPlugin = { [method: string]: (...args: any[]) => Promise<any> };
type CapacitorGlobal = { Plugins?: Record<string, AnyPlugin> };

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

function plugin(): AnyPlugin | undefined {
  return capacitor()?.Plugins?.LocalNotifications;
}

export const REMINDER_CHANNEL_ID = 'reminders';

export interface ScheduledReminder {
  id: number;
  title: string;
  body: string;
  /** Epoch ms for when the reminder should fire (also the daily repeat anchor). */
  at: number;
  /** Repeat daily at the same time as `at`. */
  repeats: boolean;
  extra?: Record<string, unknown>;
}

/** Create the Android channel for reminders (no-op on iOS / web). */
async function createChannel(): Promise<void> {
  const ln = plugin();
  if (!ln?.createChannel) return;
  try {
    await ln.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Journal reminders',
      description: 'Gentle reminders to write in your journal',
      importance: 3, // IMPORTANCE_DEFAULT — present but not intrusive
      visibility: 1, // VISIBILITY_PRIVATE — privacy-first by default
    });
  } catch {
    /* non-fatal */
  }
}

/** Schedule reminders, replacing any with the same ids. */
export async function nativeSchedule(reminders: ScheduledReminder[]): Promise<void> {
  const ln = plugin();
  if (!ln?.schedule || reminders.length === 0) return;
  try {
    await createChannel();
    await ln.schedule({
      notifications: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        schedule: { at: new Date(r.at), repeats: r.repeats },
        extra: r.extra,
        channelId: REMINDER_CHANNEL_ID,
      })),
    });
  } catch {
    /* best-effort */
  }
}

/** Cancel specific pending reminders by id. */
export async function nativeCancel(ids: number[]): Promise<void> {
  const ln = plugin();
  if (!ln?.cancel || ids.length === 0) return;
  try {
    await ln.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    /* non-fatal */
  }
}

/** Cancel every pending Jouspace reminder. */
export async function nativeCancelAll(): Promise<void> {
  const ln = plugin();
  if (!ln?.cancelAll) return;
  try {
    await ln.cancelAll();
  } catch {
    /* non-fatal */
  }
}

/** Register a handler for notification taps (native). Returns an unsubscribe. */
export function nativeOnTap(
  cb: (extra: Record<string, unknown> | undefined) => void,
): () => void {
  const ln = plugin();
  if (!ln?.addListener) return () => {};
  try {
    const handle = ln.addListener(
      'localNotificationActionPerformed',
      (event: unknown) => {
        const e = event as { notification?: { extra?: Record<string, unknown> } };
        cb(e?.notification?.extra);
      },
    );
    const remove = (handle as { remove?: () => void })?.remove;
    return () => {
      try {
        remove?.();
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => {};
  }
}
