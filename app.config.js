/**
 * Expo dynamic config — loads .env and injects EXPO_PUBLIC_* into app extra.
 * Required for Expo Go to receive Firebase credentials at runtime.
 */
const path = require('path');
const fs = require('fs');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/** Read API key from google-services.json when present (Android Firebase config). */
function loadFromGoogleServices() {
  const candidates = [
    path.join(__dirname, 'google-services.json'),
    path.join(__dirname, '.expo', 'google-services.json'),
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!filePath) return {};

  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const client = json.client?.[0];
    const apiKey = client?.api_key?.[0]?.current_key;
    const projectId = json.project_info?.project_id;
    const storageBucket = json.project_info?.storage_bucket;
    const messagingSenderId = json.project_info?.project_number;
    const appId = client?.client_info?.mobilesdk_app_id;
    const packageName = client?.client_info?.android_client_info?.package_name;

    const derived = {};
    if (apiKey) derived.EXPO_PUBLIC_FIREBASE_API_KEY = apiKey;
    if (projectId) {
      derived.EXPO_PUBLIC_FIREBASE_PROJECT_ID = projectId;
      derived.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = `${projectId}.firebaseapp.com`;
    }
    if (storageBucket) derived.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = storageBucket;
    if (messagingSenderId) derived.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = String(messagingSenderId);
    if (appId) derived.EXPO_PUBLIC_FIREBASE_APP_ID = appId;
    if (packageName) derived.ANDROID_PACKAGE = packageName;
    return derived;
  } catch {
    return {};
  }
}

const APP_ENV = process.env.APP_ENV || 'development';

function loadEnvForEnvironment(baseEnv) {
  const envFiles = ['.env'];
  if (APP_ENV === 'development') envFiles.push('.env.development');
  else if (APP_ENV === 'staging') envFiles.push('.env.staging');
  else if (APP_ENV === 'production') envFiles.push('.env.production');
  envFiles.push('.env.local');

  let merged = { ...baseEnv };
  for (const file of envFiles) {
    merged = { ...merged, ...loadDotEnv(path.join(__dirname, file)) };
  }
  return merged;
}

const dotEnv = loadEnvForEnvironment({});
const googleEnv = loadFromGoogleServices();

function pick(key) {
  return dotEnv[key] || googleEnv[key] || process.env[key] || '';
}

const firebaseExtra = {
  APP_ENV,
  EXPO_PUBLIC_FIREBASE_API_KEY: pick('EXPO_PUBLIC_FIREBASE_API_KEY') || pick('VITE_FIREBASE_API_KEY'),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: pick('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') || pick('VITE_FIREBASE_AUTH_DOMAIN'),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: pick('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || pick('VITE_FIREBASE_PROJECT_ID'),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
    pick('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') || pick('VITE_FIREBASE_STORAGE_BUCKET'),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    pick('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || pick('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  EXPO_PUBLIC_FIREBASE_APP_ID: pick('EXPO_PUBLIC_FIREBASE_APP_ID') || pick('VITE_FIREBASE_APP_ID'),
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID:
    pick('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID') || pick('VITE_FIREBASE_MEASUREMENT_ID'),
  EXPO_PUBLIC_API_BASE_URL: pick('EXPO_PUBLIC_API_BASE_URL') || pick('VITE_API_BASE_URL') || '/api',
  EXPO_PUBLIC_USE_FIREBASE_EMULATORS:
    pick('EXPO_PUBLIC_USE_FIREBASE_EMULATORS') || pick('VITE_USE_FIREBASE_EMULATORS') || 'false',

  EXPO_PUBLIC_SENTRY_DSN: pick('EXPO_PUBLIC_SENTRY_DSN'),

  EXPO_PUBLIC_SUPABASE_URL: pick('EXPO_PUBLIC_SUPABASE_URL') || pick('VITE_SUPABASE_URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    pick('EXPO_PUBLIC_SUPABASE_ANON_KEY') || pick('VITE_SUPABASE_ANON_KEY'),
};

const androidPackage =
  googleEnv.ANDROID_PACKAGE || pick('EXPO_PUBLIC_ANDROID_PACKAGE') || 'com.jouspace.app';

function appNameForEnvironment() {
  return 'Jouspace';
}

module.exports = {
  expo: {
    name: appNameForEnvironment(),
    slug: 'jouspace',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/shared/assets/icon.png',
    scheme: ['jouspace'],
    userInterfaceStyle: 'automatic',
    splash: {
      image: './src/shared/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#7866D7',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: APP_ENV === 'production' ? 'com.jouspace.app' : `com.jouspace.app.${APP_ENV}`,
      infoPlist: {
        NSMicrophoneUsageDescription: 'Jouspace uses the microphone to convert your speech into text, making it easier to express yourself.',
        NSSpeechRecognitionUsageDescription: 'Jouspace uses speech recognition to transcribe your voice into text for messaging.',
      },
    },
    android: {
      softwareKeyboardLayoutMode: 'resize',
      adaptiveIcon: {
        foregroundImage: './src/shared/assets/adaptive-icon.png',
        backgroundColor: '#7866D7',
      },
      package: APP_ENV === 'production' ? androidPackage : `${androidPackage}.${APP_ENV}`,
    },
    web: {
      favicon: './src/shared/assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-speech-recognition',
      'expo-system-ui',
      'expo-web-browser',
    ],
    extra: {
      ...firebaseExtra,
      eas: {
        projectId: pick('EAS_PROJECT_ID') || undefined,
      },
    },
  },
};
