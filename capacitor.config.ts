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
  },

  server: {
    // androidScheme https keeps requests same-origin with the WebView and
    // avoids cleartext restrictions; matches the https://localhost origin we
    // allow in the runtime's CORS config.
    androidScheme: 'https',
  },
};

export default config;
