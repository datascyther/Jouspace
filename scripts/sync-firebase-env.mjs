#!/usr/bin/env node
/**
 * Sync Firebase credentials from google-services.json or GoogleService-Info.plist
 * into the current environment's .env file (respects APP_ENV).
 *
 * Usage: npm run firebase:sync-env
 *
 * Also copies google-services.json to android/app/ for native builds.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const APP_ENV = process.env.APP_ENV || 'development';
const envTarget = APP_ENV === 'development' ? '.env.development'
  : APP_ENV === 'staging' ? '.env.staging'
  : APP_ENV === 'production' ? '.env.production'
  : '.env';
const envPath = path.join(root, envTarget);

const GOOGLE_SERVICES_PATHS = [
  path.join(root, 'google-services.json'),
  path.join(root, '.expo', 'google-services.json'),
];
const GOOGLE_SERVICE_INFO_PLIST_PATH = path.join(root, 'GoogleService-Info.plist');

function parsePlistXml(xml) {
  const result = {};
  const keyMatch = xml.match(/<key>([^<]+)<\/key>\s*<string>([^<]+)<\/string>/g);
  if (keyMatch) {
    for (const match of keyMatch) {
      const [, key, value] = match.match(/<key>([^<]+)<\/key>\s*<string>([^<]+)<\/string>/);
      result[key] = value;
    }
  }
  return result;
}

function syncFromGoogleServices(filePath) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const client = json.client?.[0];
  const apiKey = client?.api_key?.[0]?.current_key;
  const projectId = json.project_info?.project_id;
  const storageBucket = json.project_info?.storage_bucket;
  const messagingSenderId = json.project_info?.project_number;
  const appId = client?.client_info?.mobilesdk_app_id;

  const oauthClients = client?.services?.appinvite_service?.other_platform_oauth_client || [];
  const webClient = oauthClients.find((c) => c.client_type === 3);
  const authDomain = webClient?.client_id
    ? `${projectId}.firebaseapp.com`
    : `${projectId}.firebaseapp.com`;

  if (!apiKey || !projectId) {
    console.error('google-services.json is missing apiKey or projectId.');
    process.exit(1);
  }

  return {
    EXPO_PUBLIC_FIREBASE_API_KEY: apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket || `${projectId}.firebasestorage.app`,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: String(messagingSenderId),
    EXPO_PUBLIC_FIREBASE_APP_ID: appId,
  };
}

function syncFromGoogleServiceInfoPlist(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const plist = parsePlistXml(content);

  const apiKey = plist['API_KEY'];
  const projectId = plist['PROJECT_ID'];
  const storageBucket = plist['STORAGE_BUCKET'];
  const messagingSenderId = plist['GCM_SENDER_ID'];
  const appId = plist['GOOGLE_APP_ID'];

  if (!apiKey || !projectId) {
    console.error('GoogleService-Info.plist is missing API_KEY or PROJECT_ID.');
    process.exit(1);
  }

  return {
    EXPO_PUBLIC_FIREBASE_API_KEY: apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket || `${projectId}.firebasestorage.app`,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: String(messagingSenderId),
    EXPO_PUBLIC_FIREBASE_APP_ID: appId,
  };
}

function findGoogleServicesPath() {
  return GOOGLE_SERVICES_PATHS.find((f) => fs.existsSync(f));
}

let updates = null;
let sourceLabel = '';

const gsPath = findGoogleServicesPath();
const plistPath = fs.existsSync(GOOGLE_SERVICE_INFO_PLIST_PATH) ? GOOGLE_SERVICE_INFO_PLIST_PATH : null;

if (gsPath) {
  updates = syncFromGoogleServices(gsPath);
  sourceLabel = path.relative(root, gsPath);
} else if (plistPath) {
  updates = syncFromGoogleServiceInfoPlist(plistPath);
  sourceLabel = path.relative(root, plistPath);
} else {
  console.error('Missing google-services.json or GoogleService-Info.plist.');
  console.error('Place one in the project root directory.');
  process.exit(1);
}

let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(envContent)) {
    envContent = envContent.replace(pattern, line);
  } else {
    envContent = envContent.trimEnd() + (envContent.endsWith('\n') ? '' : '\n') + line + '\n';
  }
}

fs.writeFileSync(envPath, envContent);

if (gsPath) {
  const androidTarget = path.join(root, 'android', 'app', 'google-services.json');
  fs.mkdirSync(path.dirname(androidTarget), { recursive: true });
  fs.copyFileSync(gsPath, androidTarget);
  console.log(`  ✓ Copied to ${path.relative(root, androidTarget)}`);
}

if (plistPath) {
  const iosTarget = path.join(root, 'ios', 'Jouspace', 'GoogleService-Info.plist');
  fs.mkdirSync(path.dirname(iosTarget), { recursive: true });
  fs.copyFileSync(plistPath, iosTarget);
  console.log(`  ✓ Copied to ${path.relative(root, iosTarget)}`);
}

console.log(`Updated ${path.relative(root, envPath)} from ${sourceLabel}:`);
for (const key of Object.keys(updates)) {
  console.log(`  ✓ ${key}`);
}
