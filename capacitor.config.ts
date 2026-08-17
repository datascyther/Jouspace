/**
 * Capacitor configuration — wraps the Jouspace web build (dist/) into a
 * native Android shell.
 *
 * The web app is built by Vite into `dist/` (a single inlined index.html via
 * vite-plugin-singlefile), which Capacitor loads in a WebView.
 *
 * The Android platform (android/) is COMMITTED to the repo with branded icons,
 * native permissions, and release signing. After building the web app, run:
 *   npx cap sync android          # copies dist/ + plugin files into android/
 *   cd android && ./gradlew assembleRelease
 *
 * The GitHub Actions workflow (.github/workflows/build-apk.yml) automates this
 * in CI, producing a signed release APK from the committed platform dir.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jouspace.app',
  appName: 'Jouspace',
  webDir: 'dist',
  android: {
    // The app talks to the Jouspace Intelligence Runtime over HTTPS in
    // production. If you ever point it at a plain-http backend during testing,
    // also set android:usesCleartextTraffic="true" in
    // android/app/src/main/AndroidManifest.xml.
    allowMixedContent: false,
    // Use a custom URI scheme for OAuth callbacks (jouspace://).
    backgroundColor: '#F5F3EF',
  },

  server: {
    // androidScheme https keeps requests same-origin with the WebView and
    // avoids cleartext restrictions; matches the https://localhost origin we
    // allow in the runtime's CORS config.
    androidScheme: 'https',
  },

  plugins: {
    App: {
      // Handle deep links for OAuth callbacks (jouspace://).
    },
    FirebaseAuthentication: {
      // Google sign-in through @capacitor-firebase/authentication.
      // skipNativeAuth: false keeps the native Firebase session so it persists
      // across app restarts and the `authStateChange` listener fires
      // symmetrically with the web SDK. Firebase is the identity provider only
      // (Google + email/password); the journal stays local-first on-device.
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;

/**
 * ── Native permission setup (notifications; microphone dormant) ──────────────
 * The web build asks for these via the browser/WebView. For a real app-store
 * build you must also declare them natively, or the OS will refuse the request.
 *
 * Notifications are declared in the committed
 * android/app/src/main/AndroidManifest.xml. The jouspace:// deep-link
 * intent-filter for OAuth callbacks is also in the manifest.
 *
 * The microphone permission is ALSO declared natively (RECORD_AUDIO) and
 * catalogued in the permission registry, but voice typing is deprecated for
 * this release — the mic is never requested in the primer or settings UI, so
 * the native declaration is inert. Reviving voice typing later needs no
 * manifest change, just the UI + engine wiring back.
 *
 * 1) Plugins are installed via package.json — run `npm install && npx cap sync android`.
 *
    * 2) iOS — ios/App/App/Info.plist (purpose strings are REQUIRED or the app
    *    crashes on first request):
    *      <key>NSMicrophoneUsageDescription</key>
    *      <string>Jouspace uses your microphone to transcribe voice journal entries.</string>
    *      <key>NSSpeechRecognitionUsageDescription</key>
    *      <string>Jouspace sends your speech to Apple’s speech recognition service to transcribe voice journal entries.</string>
    *      <key>NSLocalNotificationUsageDescription</key>
    *      <string>Jouspace sends gentle reminders to help you build a journaling habit.</string>
    *
 * NOTE: there is no `ios/` target in this repo yet (Android only). These
 * purpose strings are documented for when iOS support is added.
 *
 * The primer screen (PermissionPrimerScreen) requests permissions in-context,
 * which keeps the app compliant with Apple Guideline 5.1.1 and Google Play
 * policies. Only notifications are offered this release.
 */
