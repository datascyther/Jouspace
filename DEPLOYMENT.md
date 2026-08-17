# Deployment Guide

Covers two things:

1. **Hosting the Jouspace Intelligence Runtime** so the APK/PWA can reach it over HTTPS.
2. **Signing & releasing the Android APK** (debug → Play Store release).

**Hosting:** the Jouspace Intelligence Runtime is deployed to **Cloudflare Workers** (free tier, **no credit card**). It is stateless: the device sends its own journal entries with each request, so **no database is required**.

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


### 1.2 Deploy to Cloudflare Workers (free, no credit card) ⭐

Cloudflare Workers has a generous free tier and **does not require a credit
card**. The runtime is ported to the Workers runtime in `worker/` — it reuses
the exact same pure-logic modules from `server/` (`reasoning.ts`, `guard.ts`,
`schemas.ts`, `prompt/PromptAssembler.ts`, `context/ContextAssembler.ts`) so
behaviour is identical; only the transport layer is rewritten for the Workers
`fetch` model (native `fetch`, Web Streams, Web Crypto — no Express or Node
built-ins). The AI features (chat / reflect / insight / summarize / memory) and
the `/api/health` endpoint are all served from `worker/src/index.ts`.

**One-time setup (in your own terminal — the VS Code terminal is network-sandboxed):**

```bash
cd worker
npm install
npx wrangler login                      # opens a browser; no card required
npx wrangler secret put NVIDIA_API_KEY   # paste your nvapi-… key when prompted
# (optional) edit wrangler.toml → [vars] CORS_ORIGINS to add your production origin
npx wrangler deploy
```

You get a `https://jouspace-runtime.<subdomain>.workers.dev` URL (or attach a
custom domain). Set it as `RUNTIME_URL` (and the GitHub Actions secret
`RUNTIME_URL`) before building the APK (§2).

| `wrangler.toml` setting | How it's set | Purpose |
|---|---|---|
| `GATEWAY_PROVIDER` | `[vars]` | Always `nvidia` for now (single provider) |
| `CORS_ORIGINS` | `[vars]` | Comma-separated origins allowed to call the runtime. `capacitor://localhost` + `https://localhost` are already in the default list — add your production origin here |
| `NVIDIA_API_KEY` | `wrangler secret put` | Never commit it; it's encrypted at rest |

> **Limits to know:** free tier = 100k requests/day, and each request gets
> **10 ms of CPU time** (wall-clock can be much longer — long AI streams are
> fine because they're *waiting* on NVIDIA, not burning CPU). The worker streams
> SSE back to the client while NVIDIA generates, so a multi-minute response fits
> comfortably. If you later outgrow the free tier, attach a custom domain and/or
> upgrade — the free plan itself still needs no card.

> **Type-check before deploy:** `cd worker && npm run typecheck` (runs
> `tsc --noEmit`) once `npm install` has pulled `zod` + `wrangler`. CI can also
> run `wrangler deploy --dry-run` to validate the build offline.




### 1.3 Verify the deployment

```bash
curl https://your-runtime-host/api/health
# → {"status":"ok","runtime":"jouspace-intelligence",...}
```

---

## 2. Signing & releasing the APK

The `android/` platform is **committed to the repo** with branded icons, native
permissions, and a permanent signing configuration. Every CI build produces a
**signed release APK** — there is no debug fallback.

### 2.1 Signing setup (one time, already done)

A release keystore is committed at `android/keystore/jouspace-release.keystore`
(alias `jouspace`, RSA 2048, SHA256, valid ~27 years). Credentials are in
`android/keystore.properties` (also committed — intentional).

`android/app/build.gradle` loads `keystore.properties` at build time and signs
**both** debug and release build types with the committed keystore. This means
every build — local or CI — shares the **same signing certificate**, so APKs
install over previous builds (no "App not installed as package conflicts with an
existing package").

> **IMPORTANT:** losing this keystore means you can NEVER update an app
> installed from a previous release (users must uninstall first). Back up the
> keystore + credentials somewhere safe (password manager, separate from the
> repo).

### 2.2 Versioning

The CI workflow derives `versionCode` and `versionName` from the git tag:

| Tag | versionName | versionCode |
|---|---|---|
| `v1.0.4` | `1.0.4` | `10004` |
| `v1.0.5` | `1.0.5` | `10005` |
| `v2.1.3` | `2.1.3` | `20103` |

Pass a manual `version` input in the Actions UI to override the tag.

### 2.3 CI build (automated)

The workflow (`.github/workflows/build-apk.yml`):

1. Checks out the committed `android/` platform
2. Builds the Vite web app → `dist/`
3. `npx cap sync android` copies `dist/` + plugin files into the native shell
4. Stamps `versionCode`/`versionName` from the git tag or manual input
5. Runs `./gradlew assembleRelease` (signed with committed keystore)
6. Uploads `app-release.apk` as a build artifact

No keystore secrets, no debug fallback, no icon/manifest patching steps.

### 2.4 Upload to Play Store

1. `applicationId` is `com.jouspace.app` (set in `android/app/build.gradle`).
2. Build: `./gradlew bundleRelease` → produces `app-release.aab` (Android App Bundle — required by Play).
3. Create a Play Console app, upload the `.aab`, complete the Data safety & content ratings forms.

---

## 3. Auth status

**Google sign-in = Firebase Auth (identity only).**

The client obtains a verified Google credential from **Firebase Auth**.
Profile data (display name, joined date) is stored locally in localStorage.
Email/password flows go through Firebase as well.

Setup (one time):

1. **Firebase Console** → Add project → Build → Authentication → Sign-in
   method → enable **Google**.
2. **Add a Web app** → copy the `firebaseConfig` values into `.env`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
3. **Add an Android app** (package `com.jouspace.app`) → register the release
   SHA-1 (`F5:C0:60:33:0D:02:BC:B6:77:76:67:98:A6:E9:8C:1D:E8:CD:8A:8C`) →
   download **`google-services.json`** to `android/app/google-services.json`
   (the gradle build auto-applies the Google Services plugin when present).

On Android, sign-in uses the native Google Sign-In sheet via
`@capacitor-firebase/authentication` with `skipNativeAuth: true` (returns the
ID token without a redundant Firebase session); on web it falls back to the
Firebase JS SDK redirect flow. "Continue without an account" still works locally.
