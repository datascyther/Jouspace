/**
 * Standard web APIs for permission gating, used in the browser / WebView when
 * Capacitor is not present.
 *
 * Microphone note: the app's voice input uses the Web Speech API, which triggers
 * its own browser mic prompt. Requesting via getUserMedia here *first* is fine —
 * the browser shares the single "microphone" grant, so SpeechRecognition then
 * runs without re-prompting. We stop the temporary stream immediately.
 */

export type WebMicState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

export async function webCheckMicrophone(): Promise<WebMicState> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unknown';
  }
  try {
    const st = await navigator.permissions.query({ name: 'microphone' } as any);
    return (st.state as WebMicState) ?? 'unknown';
  } catch {
    // Some browsers throw for the 'microphone' name — can't determine, so ask.
    return 'unknown';
  }
}

export async function webRequestMicrophone(): Promise<WebMicState> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return 'granted';
  } catch (e: any) {
    if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') return 'denied';
    if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') return 'unsupported';
    return 'denied';
  }
}

export type WebNotifState = 'granted' | 'denied' | 'default' | 'unsupported';

export async function webCheckNotifications(): Promise<WebNotifState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as WebNotifState;
}

export async function webRequestNotifications(): Promise<WebNotifState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    const res = await Notification.requestPermission();
    return res as WebNotifState;
  } catch {
    return 'denied';
  }
}
