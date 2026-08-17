/**
 * PermissionService — the single entry point the rest of the app uses.
 *
 * Responsibilities:
 *  - Normalize both native (Capacitor) and web permission strings into one model.
 *  - Expose `getStatus`, `request`, `ensure`, and `openSettings`.
 *  - Remember that a request was attempted so a second denial can be treated as
 *    "permanently denied" (the OS won't prompt again → send the user to Settings).
 *
 * Usage (always use `ensure`, never call the OS prompt directly):
 *   const res = await PermissionService.ensure('microphone');
 *   if (!res.ok) { /* show res.reason or offer openSettings *\/ return; }
 *   startVoice();
 */
import type { PermissionKey, PermissionState, PermissionResult, PermissionStatus } from './types';
import { PERMISSIONS } from './registry';
import * as native from './nativeBridge';
import * as web from './webBridge';

const STORAGE_KEY = 'jouspace.permissions.v1';

type Store = Partial<Record<PermissionKey, { attempted: boolean; last: PermissionState }>>;

function readStore(): Store {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Store;
  } catch {
    return {};
  }
}

function writeStore(s: Store): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function normalizeMic(raw: string | null, attempted: boolean): PermissionState {
  switch (raw) {
    case 'granted':
    case 'limited':
      return 'granted';
    case 'denied':
      // After we've asked once, the platform won't re-prompt without Settings.
      return attempted ? 'deniedPermanently' : 'denied';
    case 'prompt':
    case 'prompt-with-rationale':
      // Android re-prompts on these — treat as a fresh, re-promptable prompt.
      return 'prompt';
    case 'unsupported':
      return 'unsupported';
    case 'restricted':
      return 'restricted';
    default:
      // On native, a genuinely absent plugin yields `null` → 'unsupported'
      // (the feature truly can't be provided here). On web a null means
      // "couldn't determine" → 'unknown' (ask when needed). Crucially this is
      // never treated as 'denied', so we never fabricate a "blocked" state.
      return native.isNativePlatform() ? 'unsupported' : 'unknown';
  }
}

function normalizeNotif(raw: string | null, attempted: boolean): PermissionState {
  switch (raw) {
    case 'granted':
    case 'limited':
      return 'granted';
    case 'denied':
      return attempted ? 'deniedPermanently' : 'denied';
    case 'prompt':
    case 'default':
      return 'prompt';
    case 'unsupported':
      return 'unsupported';
    case 'restricted':
      return 'restricted';
    default:
      return 'unknown';
  }
}

function normalize(key: PermissionKey, raw: string | null, attempted: boolean): PermissionState {
  return key === 'microphone' ? normalizeMic(raw, attempted) : normalizeNotif(raw, attempted);
}

function toResult(key: PermissionKey, state: PermissionState): PermissionResult {
  const ok = state === 'granted';
  let reason: string | undefined;
  if (!ok) {
    const title = PERMISSIONS[key].title;
    if (state === 'deniedPermanently') reason = `${title} access is blocked. Enable it in your device Settings.`;
    else if (state === 'denied') reason = `${title} permission was denied. Tap to try again.`;
    else if (state === 'unsupported') reason = `${title} is not available on this device.`;
    else if (state === 'restricted') reason = `${title} is restricted on this device.`;
    else if (state === 'prompt') reason = `Couldn't confirm ${title.toLowerCase()} access. Tap the mic to try again.`;
    else reason = `Couldn't confirm ${title.toLowerCase()} access. Tap the mic to try again.`;
  }
  return { key, state, ok, reason };
}

/** Read the current status without prompting. Safe to call on mount. */
export async function getStatus(key: PermissionKey): Promise<PermissionStatus> {
  const store = readStore();
  const attempted = store[key]?.attempted ?? false;

  let raw: string | null = null;
  if (key === 'microphone') {
    raw = native.isNativePlatform() ? await native.nativeCheckMicrophone() : await web.webCheckMicrophone();
  } else if (key === 'notifications') {
    raw = native.isNativePlatform()
      ? await native.nativeCheckNotifications()
      : await web.webCheckNotifications();
  }

  const state = normalize(key, raw, attempted);
  writeStore({ ...store, [key]: { attempted, last: state } });
  return { key, state };
}

/** Prompt the OS for the permission. Use `ensure` in feature code instead. */
export async function request(key: PermissionKey): Promise<PermissionResult> {
  const store = readStore();
  // The PRIOR attempted flag decides whether this denial is the first (still
  // re-promptable) or a repeat (permanently denied). We then persist attempted.
  const attemptedBefore = store[key]?.attempted ?? false;
  let raw: string | null = null;

  if (key === 'microphone') {
    raw = native.isNativePlatform()
      ? await native.nativeRequestMicrophone()
      : await web.webRequestMicrophone();
  } else if (key === 'notifications') {
    raw = native.isNativePlatform()
      ? await native.nativeRequestNotifications()
      : await web.webRequestNotifications();
  }

  const state = normalize(key, raw, attemptedBefore);
  writeStore({ ...store, [key]: { attempted: true, last: state } });
  return toResult(key, state);
}

/**
 * The "just works" helper. Returns immediately if already granted; otherwise
 * prompts (only when the state is prompt/unknown). If the permission is denied,
 * permanently denied, restricted, or unsupported, it returns without prompting
 * again and lets the caller degrade gracefully.
 *
 * Web microphone note: `request('microphone')` on the web calls getUserMedia.
 * Chrome shares a single "microphone" grant between getUserMedia and the Web
 * Speech API, so this is a *single* prompt — Web Speech then runs without
 * re-prompting. We intentionally do not skip the request, otherwise the primer
 * couldn't reflect a real grant and the in-app button would have no way to know
 * a fresh grant occurred.
 */
export async function ensure(key: PermissionKey): Promise<PermissionResult> {
  const status = await getStatus(key);
  if (status.state === 'granted') return toResult(key, 'granted');
  if (status.state === 'prompt' || status.state === 'unknown') return request(key);
  return toResult(key, status.state);
}

/** Open the OS settings screen (native only). Returns true if it could. */
export async function openSettings(key: PermissionKey): Promise<boolean> {
  if (!native.isNativePlatform()) return false; // web users manage it in-browser
  const ok = await native.nativeOpenSettings();
  if (ok) {
    // Re-check shortly after the user returns from Settings.
    setTimeout(() => void getStatus(key), 600);
  }
  return ok;
}

export const PermissionService = { getStatus, request, ensure, openSettings };
