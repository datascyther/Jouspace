/**
 * Capacitor configuration — wraps the Jouspace web build (dist/) into a
 * native Android shell.
 *
 * The web app is built by Vite into `dist/` (a single inlined index.html via
 * vite-plugin-singlefile), which Capacitor loads in a WebView.
 *
 * Commands (run on a machine with the Capacitor CLI installed):
 *   npm i -D @capacitor/cli @capacitor/core @capacitor/android
 *   npx cap add android
 *   npx cap sync android
 *   cd android && ./gradlew assembleDebug        # produces app-debug.apk
 *
 * For a fully automated cloud build (no local Android SDK needed), use the
 * included GitHub Actions workflow: .github/workflows/build-apk.yml
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jouspace.app',
  appName: 'Jouspace',
  webDir: 'dist',
  bundledWebRuntime: false,

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
 * 1) Install the plugins (already added to package.json):
 *      npm install
 *      npx cap sync android        # (and/or) npx cap add ios && npx cap sync ios
 *
 * 2) Android — android/app/src/main/AndroidManifest.xml, inside <manifest>:
 *      <uses-permission android:name="android.permission.RECORD_AUDIO" />
 *      <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
 *      <uses-permission android:name="android.permission.WAKE_LOCK" />   // if scheduling reminders
 *    Optionally add a rationale string for the mic:
 *      <application>
 *        <activity ... >
 *          <meta-data android:name="android.permission.RECORD_AUDIO"
 *                     android:resource="@string/permission_mic_rationale" />
 *        </activity>
 *      </application>
 *
 * 3) iOS — ios/App/App/Info.plist (purpose strings are REQUIRED or the app
 *    crashes on first request):
 *      <key>NSMicrophoneUsageDescription</key>
 *      <string>Jouspace uses your microphone to transcribe voice journal entries.</string>
 *      <key>NSLocalNotificationUsageDescription</key>
 *      <string>Jouspace sends gentle reminders to help you build a journaling habit.</string>
 *
 * The primer screen (PermissionPrimerScreen) requests these in-context, which
 * keeps the app compliant with Apple Guideline 5.1.1 and Google Play policies.
 */
