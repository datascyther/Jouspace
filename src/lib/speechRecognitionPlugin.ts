/**
 * Lazy, mockable accessor for the Capacitor speech-recognition plugin.
 *
 * Both the permission layer (`nativeBridge`) and the STT engine
 * (`NativeSpeechEngine`) resolve the plugin through this single function so the
 * JS wrapper registers exactly once and tests can stub it with `vi.mock`.
 *
 * The import uses a STATIC specifier so Vite bundles it normally (it ends up
 * inlined by vite-plugin-singlefile). On a non-native runtime `getSpeechPlugin`
 * is never called — `NativeSpeechEngine.supported` is false there and the web
 * path uses `WebSpeechEngine` instead — so the bundled module is harmless dead
 * weight on the desktop web build.
 */

/** Minimal slice of the plugin surface we depend on. */
export interface SpeechPlugin {
  available(): Promise<{ available: boolean }>;
  checkPermissions(): Promise<{ speechRecognition: SpeechPermissionState }>;
  requestPermissions(): Promise<{ speechRecognition: SpeechPermissionState }>;
  start(opts: {
    language?: string;
    maxResults?: number;
    partialResults?: boolean;
    popup?: boolean;
    prompt?: string;
  }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  addListener(
    event: 'partialResults',
    cb: (data: { matches: string[] }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    event: 'listeningState',
    cb: (data: { status: 'started' | 'stopped' }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  removeAllListeners(): Promise<void>;
}

export type SpeechPermissionState =
  | 'prompt'
  | 'prompt-with-rationale'
  | 'granted'
  | 'denied';

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
};

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNativeRuntime(): boolean {
  return !!capacitor()?.isNativePlatform?.();
}

let modPromise: Promise<{ SpeechRecognition?: SpeechPlugin } | null> | null = null;

/**
 * Resolve the speech-recognition plugin, or `null` when we are not in a native
 * shell or the import fails. The module import is loaded once and cached; the
 * `SpeechRecognition` export is read fresh on each call so the plugin can still
 * report itself absent (e.g. not synced into the native shell).
 */
export async function getSpeechPlugin(): Promise<SpeechPlugin | null> {
  if (!isNativeRuntime()) return null;
  if (!modPromise) {
    modPromise = import('@capacitor-community/speech-recognition').catch(() => null);
  }
  const mod = await modPromise;
  if (!mod) return null;
  return mod.SpeechRecognition ?? null;
}
