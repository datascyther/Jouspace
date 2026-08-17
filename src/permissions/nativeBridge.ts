/**
 * Runtime bridge to Capacitor's native permission plugins.
 *
 * We talk to Capacitor through its injected `window.Capacitor` global. The mic
 * permission is owned by the local `MicPermission` plugin (registered in
 * MainActivity) which requests RECORD_AUDIO through the real Android
 * permission API — the same path OS Settings uses, which persists to
 * com.jouspace.app. The web build works because the plugin is only imported
 * inside a native shell.
 *
 * Packages that provide these plugins (add to package.json, then `npx cap sync`):
 *   @capacitor/core
 *   @capacitor/local-notifications           → Plugins.LocalNotifications
 *   @capacitor/app                           → Plugins.App (openSettings)
 */

import { registerPlugin } from '@capacitor/core';

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
  const native = !!capacitor()?.isNativePlatform?.();
  // DIAGNOSTIC: capture ground truth about which permission path the app
  // actually takes on this device (see mic issue investigation).
  console.log('[JousPACE-MIC-DIAG] isNativePlatform=' + native);
  return native;
}

function plugin(name: string): AnyPlugin | undefined {
  return capacitor()?.Plugins?.[name];
}

// Lazily resolved so the MicPermission plugin is only looked up when actually
// called — tests can mock @capacitor/core before the first mic call, and the
// web build never triggers this path.
type MicPlugin = {
  checkPermissions: () => Promise<{ microphone?: string }>;
  requestPermissions: () => Promise<{ microphone?: string }>;
};
let mic: MicPlugin | null = null;
function getMicPermission(): MicPlugin {
  if (!mic) {
    mic = registerPlugin<MicPlugin>('MicPermission');
  }
  return mic;
}

// ── Microphone (RECORD_AUDIO) ────────────────────────────────────────────────
//
// @capacitor-community/speech-recognition's checkPermissions / requestPermissions
// are NOT implemented on Android, and WebView getUserMedia does not persist a
// grant to the app's native RECORD_AUDIO on this device. MicPermission drives
// the permission through the real Android API instead.

/**
 * Read the microphone permission from the OS. Returns `null` only when the
 * platform genuinely can't report it (never a false "blocked").
 */
export async function nativeCheckMicrophone(): Promise<string | null> {
  try {
    const r = await getMicPermission().checkPermissions();
    const mic = r?.microphone ?? null;
    console.log('[JousPACE-MI-DIAG] nativeCheckMicrophone raw=' + JSON.stringify(r) + ' -> ' + mic);
    return mic;
  } catch (e) {
    console.log('[JousPACE-MI-DIAG] nativeCheckMicrophone threw: ' + (e && (e as Error).message ? (e as Error).message : String(e)));
    return null;
  }
}

/**
 * Prompt the OS for the microphone permission. Resolves with the new state
 * ('granted' | 'denied' | 'prompt-with-rationale' | …) after the dialog.
 */
export async function nativeRequestMicrophone(): Promise<string | null> {
  try {
    const r = await getMicPermission().requestPermissions();
    const mic = r?.microphone ?? null;
    console.log('[JousPACE-MI-DIAG] nativeRequestMicrophone raw=' + JSON.stringify(r) + ' -> ' + mic);
    return mic;
  } catch (e) {
    console.log('[JousPACE-MI-DIAG] nativeRequestMicrophone threw: ' + (e && (e as Error).message ? (e as Error).message : String(e)));
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
