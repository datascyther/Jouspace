# Deployment Guide

Covers two things:

1. **Hosting the Jouspace Intelligence Runtime** so the APK/PWA can reach it over HTTPS.
2. **Signing & releasing the Android APK** (debug → Play Store release).

---

## 1. Hosting the Jouspace Intelligence Runtime

The runtime (`server/`) is a small Express app. It holds the NVIDIA NIM API key
and exposes only `/api/ai/*` (SSE) + `/api/health`. It is stateless: the device
sends its own journal entries with each request, so **no database is required**.

### 1.1 Environment

| Variable | Purpose |
|---|---|
| `PORT` | Port to listen on (default `3001`) |
| `NVIDIA_API_KEY` | Required. NVIDIA NIM API key |
| `CORS_ORIGINS` | Comma-separated extra origins to allow (e.g. your app's origin). Dev + `capacitor://localhost` + `https://localhost` are always allowed |

### 1.2 Deploy to Fly.io (recommended)

```bash
# one-time
fly launch --no-deploy --region iad
# Fly will detect the Express app. Answer the prompts; it creates fly.toml.
# Add secrets:
fly secrets set NVIDIA_API_KEY=your_key CORS_ORIGINS=https://your-app-domain
# Deploy:
fly deploy
# The runtime is now at https://your-app.fly.dev
```

Then build the web app pointing at it:

```bash
VITE_API_BASE_URL=https://your-app.fly.dev npm run build
```

The runtime needs a `start` script to run under Fly's default command. The
`server/package.json` already has `"start": "tsx index.ts"`. If Fly needs a
`Dockerfile`, the minimal one is:

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

(Note: `tsx` is used as the runtime. For production you may prefer compiling
to JS: `npx tsc` → `node dist/index.js`.)

### 1.3 Deploy to Railway

1. Create a new project in Railway, connect this repo.
2. Set `PORT=3001`, `NVIDIA_API_KEY=…`, `CORS_ORIGINS=…` in the service's variables.
3. Start command: `cd server && npm install && npm start` (or a root script).
4. Railway gives you a `https://*.up.railway.app` URL — use it as `VITE_API_BASE_URL`.

### 1.4 Deploy to Render

1. New **Web Service** → connect repo.
2. Root directory: `server`, Build command: `npm install`, Start command: `npm start`.
3. Add env vars (`NVIDIA_API_KEY`, `CORS_ORIGINS`, `PORT=3001`).
4. Use the generated `https://*.onrender.com` URL as `VITE_API_BASE_URL`.

### 1.5 Verify the deployment

```bash
curl https://your-runtime-host/api/health
# → {"status":"ok","runtime":"jouspace-intelligence",...}
```

---

## 2. Signing & releasing the APK

The CI workflow (`.github/workflows/build-apk.yml`) produces a **debug-signed**
APK — fine for sideloading, not acceptable for the Play Store. For release:

### 2.1 Generate a keystore (one time)

```bash
keytool -genkeypair -v \
  -keystore jouspace-release.keystore \
  -alias jouspace \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 2.2 Configure Gradle signing (on the generated `android/` project)

Add to `android/app/build.gradle` (or `keystore.properties` + reference):

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../jouspace-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "jouspace"
            keyPassword System.getenv("KEYSTORE_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

### 2.3 CI release build (Play Store ready)

Add to `.github/workflows/build-apk.yml` a step that loads the keystore from
GitHub **secrets** (never commit the keystore):

```yaml
- name: Decode keystore
  env:
    KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
  run: echo "$KEYSTORE_BASE64" | base64 --decode > android/jouspace-release.keystore

- name: Build release APK
  working-directory: android
  env:
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
  run: ./gradlew assembleRelease
```

Store these repo secrets: `KEYSTORE_BASE64` (base64 of the keystore file) and
`KEYSTORE_PASSWORD`.

### 2.4 Upload to Play Store

1. In `android/app/build.gradle`, set a real `applicationId` (default: `com.jouspace.app`).
2. Build: `./gradlew bundleRelease` → produces `app-release.aab` (Android App Bundle — required by Play).
3. Create a Play Console app, upload the `.aab`, complete the Data safety & content ratings forms.

---

## 3. Current auth status

Sign-in screens are **mock UI** (they complete without a real account). For a
private local-first journal this is intentional for now. When accounts/sync are
needed later:

- Add a real auth provider (e.g. Supabase Auth, Firebase Auth) and swap the
  mock `handleSignIn`/`handleCreateAccount` in `src/App.tsx`.
- For on-device protection without accounts, add a PIN/biometric lock screen
  (the app already has the visual shell for it in `SignInScreen`/`WelcomeScreen`).
