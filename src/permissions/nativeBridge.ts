/**
 * Runtime bridge to Capacitor's native permission plugins.
 *
 * We talk to Capacitor through its injected `window.Capacitor.Plugins` global
 * rather than statically importing the plugin packages. That keeps the web build
 * working even when the optional native packages are not installed in this
 * environment, and automatically activates the native path once they are present
 * inside a Capacitor shell (after `npm install` + `npx cap sync`).
 *
 * Packages that provide these plugins (add to package.json, then `npx cap sync`):
 *   @capacitor/core
 *   @capacitor/microphone           → Plugins.Microphone
 *   @capacitor/local-notifications  → Plugins.LocalNotifications
 *   @capacitor/app                  → Plugins.App (openSettings)
 */

type AnyPlugin = { [method: string]: (...args: any[]) => Promise<any> };
type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, AnyPlugin>;
};

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNativePlatform(): boolean {
  return !!capacitor()?.isNativePlatform?.();
}

function plugin(name: string): AnyPlugin | undefined {
  return capacitor()?.Plugins?.[name];
}

// ── Microphone ──────────────────────────────────────────────────────────────
export async function nativeCheckMicrophone(): Promise<string | null> {
  const m = plugin('Microphone');
  if (!m?.checkPermissions) return null;
  try {
    const r = await m.checkPermissions();
    return (r?.permission as string) ?? null;
  } catch {
    return null;
  }
}

export async function nativeRequestMicrophone(): Promise<string | null> {
  const m = plugin('Microphone');
  if (!m?.requestPermissions) return null;
  try {
    const r = await m.requestPermissions();
    return (r?.permission as string) ?? null;
  } catch {
    return null;
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
function normalizeNotifResult(r: any): string | null {
  if (!r) return null;
  if (typeof r.display === 'string') return r.display;
  if (typeof r.granted === 'boolean') return r.granted ? 'granted' : 'denied';
  return null;
}

export async function nativeCheckNotifications(): Promise<string | null> {
  const n = plugin('LocalNotifications');
  if (!n?.checkPermissions) return null;
  try {
    return normalizeNotifResult(await n.checkPermissions());
  } catch {
    return null;
  }
}

export async function nativeRequestNotifications(): Promise<string | null> {
  const n = plugin('LocalNotifications');
  if (!n?.requestPermissions) return null;
  try {
    return normalizeNotifResult(await n.requestPermissions());
  } catch {
    return null;
  }
}

// ── Settings deep-link (for permanently denied permissions) ───────────────────
export async function nativeOpenSettings(): Promise<boolean> {
  const app = plugin('App');
  if (!app?.openSettings) return false;
  try {
    await app.openSettings();
    return true;
  } catch {
    return false;
  }
}
