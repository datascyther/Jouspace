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

### 1.2 Self-host + free tunnel (free, no card, no account)

If you don't want to add a payment method to a cloud host, run the runtime on
your own machine and expose it through a **free tunnel** — no credit card, no
Hugging Face or Fly account required. (Services like UptimeRobot only *monitor*
an existing URL — they don't host anything — so they can't replace this step.
You can point UptimeRobot at the tunnel URL afterwards for downtime alerts.)

1. Start the runtime (reads `NVIDIA_API_KEY` from your environment):
   ```bash
   cd server && npm install --omit=dev && PORT=3001 npm start
   ```
   Check locally: `curl http://localhost:3001/api/health`

2. Expose it with a free tunnel (pick one):
   - **Cloudflare quick tunnel** (no account): `brew install cloudflared && cloudflared tunnel --url http://localhost:3001`
   - **localhost.run** (no install, uses `ssh`): `ssh -R 80:localhost:3001 localhost.run`

   Both print a public `https://….` URL — set it as `RUNTIME_URL` in the app
   (and in Supabase `site_url` / `additional_redirect_urls` if you enable Google
sign-in).

A convenience script does both steps: `bash scripts/serve.sh`.

> **Caveat:** the runtime is reachable only while this machine is on and the
tunnel is running. Fine for personal use / testing. Use Fly (§1.3) or Hugging
Face Spaces (free, no card, but requires a real API token — not your account
password) for a 24/7 hosted URL.

### 1.3 Deploy to Fly.io (needs a payment method)

Fly.io runs the existing `server/Dockerfile` as a container with a stable
`https://<app>.fly.dev` URL — this matches the `https://jouspace.fly.dev`
production origin already configured in Supabase. Free tier, scales to zero when
idle.

**One-time setup (in your own terminal — the VS Code terminal is network-sandboxed):**

```bash
brew install flyctl
fly auth login
fly apps create jouspace-runtime          # or just: fly launch
fly secrets set NVIDIA_API_KEY=sk-...     # required for real AI
```

The repo already contains `fly.toml` (builds `server/Dockerfile`, listens on
`7860`, sets `NODE_ENV=production`, `GATEWAY_PROVIDER=nvidia`). After the
one-time setup, **every push to `main` deploys automatically** via
`.github/workflows/deploy-fly.yml` — just add `FLY_API_TOKEN` (Fly → Account →
Tokens → full access) as a repo **Actions secret**.

Set the GitHub secret `RUNTIME_URL` = `https://jouspace-runtime.fly.dev`
(no trailing slash; the client strips it anyway) before building the APK (see §2).

> **Trade-off:** with `min_machines_running = 0` the free tier sleeps after
> inactivity; the first request after sleep takes ~10–30 s to wake. The APK
> handles this with a "thinking" state and one retry on transient errors. Set
> `min_machines_running = 1` in `fly.toml` if you want it always warm (billed).

### 1.4 Deploy to Railway

1. Create a new project in Railway, connect this repo.
2. Set `PORT=3001`, `NVIDIA_API_KEY=…`, `CORS_ORIGINS=…` in the service's variables.
3. Start command: `cd server && npm install && npm start` (or a root script).
4. Railway gives you a `https://*.up.railway.app` URL — use it as `VITE_API_BASE_URL`.

### 1.5 Deploy to Render (free tier — requires a card on file)

Render's free web-service tier is $0, but it requires a credit/debit card for
verification (a $1 hold, refunded). It runs the `server/` Node app directly
(TypeScript via `tsx`, no build step).

**Fastest (Blueprint):** the repo includes `render.yaml`. In Render → *New* →
*Blueprint* → connect this repo → it creates the `jouspace-runtime` web service
(Node, free, health check on `/api/health`).

**Manual:** New **Web Service** → connect repo, then:
- Root directory: `server`
- Build command: `npm install`  ·  Start command: `npm start`
- Plan: **Free**

Set these environment variables (the Blueprint sets the first three):
- `NODE_ENV=production`
- `GATEWAY_PROVIDER=nvidia`
- `CORS_ORIGINS=https://jouspace-runtime.onrender.com`
- **`NVIDIA_API_KEY`** — set as a secret (your `nvapi-…` key). Required for real AI.

Use the generated `https://jouspace-runtime.onrender.com` URL as `RUNTIME_URL`
(no trailing slash). Set it as the GitHub secret before building the APK (§2).

> **Trade-off:** the free tier spins down after ~15 min idle; the first request
> after that takes ~30–60 s to wake. The APK already retries on transient errors.

### 1.6 Verify the deployment

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
