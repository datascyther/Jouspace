/**
 * Voice configuration.
 *
 * Voice input uses the best engine available on the current platform:
 *  - On Android (inside the Capacitor shell) it uses the OS speech recognizer
 *    via `@capacitor-community/speech-recognition`.
 *  - On the desktop web build (and as a fallback) it uses the browser's Web
 *    Speech API.
 *
 * Honest privacy note: on Android the audio is sent to the device's own
 * speech-recognition service (typically Google's) for transcription — it is
 * used only to turn your speech into text for the entry. No audio or transcript
 * is sent to any Jouspace server.
 */
export type VoiceEngineChoice = 'auto' | 'native' | 'web-speech';

export interface VoiceConfig {
  /** Which engine to use. 'auto' picks native on Android, else Web Speech. */
  engine: VoiceEngineChoice;
  /**
   * Preload the engine in the background once the voice hook mounts, so the
   * first tap is instant. Set `false` to load lazily on first use instead.
   */
  preloadOnMount: boolean;
  /** BCP-47 language tag for recognition (e.g. 'en-US'). */
  lang: string;
}

export const voiceConfig: VoiceConfig = {
  engine: 'auto',
  preloadOnMount: true,
  lang: 'en-US',
};
