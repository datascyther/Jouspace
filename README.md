# Jouspace — AI-Native Private Journal

A calm, private journaling app with on-device-feeling AI reflection. React +
Vite + Tailwind frontend, backed by the **Jouspace Intelligence Runtime** (an
Express server that orchestrates a hosted NVIDIA NIM model).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| Build | `vite-plugin-singlefile` — the whole app inlines into one `dist/index.html` |
| PWA | Manifest + icons + self-hosted fonts in `public/` (offline-safe) |
| AI Runtime | Express 4 + OpenAI SDK (NVIDIA NIM gateway), SSE streaming |
| Mobile shell | Capacitor (config + cloud CI provided; no local Android SDK required) |

## Quick start

```bash
npm install          # install frontend deps
cd server && npm i   # install runtime deps

# create server/.env (project root, gitignored)
#   NVIDIA_API_KEY=your_nvidia_nim_key

npm run dev:all      # Vite (http://localhost:5173) + Runtime (:3001) together
```

## Architecture

```
Frontend (React)
  ├── useJouspaceIntelligence(capability)  → POST {runtime}/api/ai/<capability>
  ├── AI chat, reflection drawer, insight cards, writing summary
  └── API base URL is configurable (VITE_API_BASE_URL)

Intelligence Runtime (Express, server/)
  ├── routes/*          chat · reflect · insight · summarize (all SSE streaming)
  ├── ContextAssembler  journal context (mock seed data → future DB)
  ├── PromptAssembler   Jouspace-branded system prompts per capability
  ├── gateway/*         provider abstraction (NvidiaGateway = live implementation)
  └── StreamController  AsyncIterable → SSE to the client
```

### Runtime endpoint configuration

In development the frontend calls its own origin (`/api/ai/*`) and Vite proxies
to `localhost:3001`. For a deployed APK/PWA, point the build at a real backend:

```bash
VITE_API_BASE_URL=https://your-runtime-host npm run build
```

The runtime's CORS already allows `capacitor://localhost` and `https://localhost`
(Android WebView origins). Add any other origin via the `CORS_ORIGINS` env var
on the server.

## Building the Android APK

The web app compiles to a single `dist/index.html` (plus `public/` assets) which
Capacitor loads inside a WebView. **No Android SDK or Java is required on your
Mac** — use the included cloud build.

### Option A — GitHub Actions (recommended, zero local setup)

1. Push this repo to GitHub.
2. GitHub → **Actions** → **Build Android APK** → **Run workflow**.
3. Download `jouspace-debug.apk` from the run's **Artifacts** section.

The workflow (`.github/workflows/build-apk.yml`) installs Node, builds the web
app, adds the Capacitor Android platform, and runs Gradle on a hosted runner
with JDK 17 + Android SDK preinstalled.

### Option B — local build (needs JDK 17 + Android SDK)

```bash
npm run build
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

### Production notes

- **Backend:** deploy the runtime to an HTTPS host and build with
  `VITE_API_BASE_URL=https://your-runtime-host`. The server is intentionally
  simple: `npm install && npm start` (set `PORT`, `NVIDIA_API_KEY`,
  `CORS_ORIGINS`).
- **Release signing:** the CI file produces a debug-signed APK. For Play Store
  release, add a keystore (`KEYSTORE`, `KEYSTORE_PASSWORD`…) and a signing
  config to Gradle, then run `assembleRelease`.
- **Data:** the app currently runs on mock/seed data on both ends. Wire the
  `ContextAssembler` to your real persistence layer and the frontend to real
  auth before shipping.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (frontend only) |
| `npm run build` | Production build → `dist/` (single file + public assets) |
| `npm run server` | Intelligence Runtime (`server/`, tsx watch) |
| `npm run dev:all` | Frontend + Runtime together |

## Security notes

- The model API key lives only in `server/` (via `.env`, gitignored) and never
  reaches the client.
- The runtime blocks client-supplied `system` role messages and injects its own
  system prompt.
- Model chain-of-thought (`reasoning_content`) is consumed and discarded — it
  never appears in the SSE output.
- The global error handler returns generic `{ error: "Intelligence unavailable" }`
  responses; stack traces never leave the server.
