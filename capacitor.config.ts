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
    // Registered in Supabase Dashboard → Auth → URL Configuration.
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
      // Handle deep links for OAuth callbacks (jouspace://)
      // The supabase-js client detects the session from the URL fragment.
    },
  },
};

export default config;

/**
 * ── Native permission setup (mic + notifications) ─────────────────────────────
 * The web build asks for these via the browser/WebView. For a real app-store
 * build you must also declare them natively, or the OS will refuse the request.
 *
 * These are already declared in the committed android/app/src/main/AndroidManifest.xml.
 * The jouspace:// deep-link intent-filter for OAuth callbacks is also in the manifest.
 *
 * 1) Plugins are installed via package.json — run `npm install && npx cap sync android`.
 *
 * 2) iOS — ios/App/App/Info.plist (purpose strings are REQUIRED or the app
 *    crashes on first request):
 *      <key>NSMicrophoneUsageDescription</key>
 *      <string>Jouspace uses your microphone to transcribe voice journal entries.</string>
 *      <key>NSLocalNotificationUsageDescription</key>
 *      <string>Jouspace sends gentle reminders to help you build a journaling habit.</string>
 *
 * The primer screen (PermissionPrimerScreen) requests these in-context, which
 * keeps the app compliant with Apple Guideline 5.1.1 and Google Play policies.
 */
