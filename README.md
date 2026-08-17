# Jouspace — AI-Native Private Journal

A calm, private journaling app with on-device-feeling AI reflection. React +
Vite + Tailwind frontend, backed by the **Jouspace Intelligence Runtime** (an
Express server that orchestrates a hosted NVIDIA NIM model).

## Project address

- **Repository:** https://github.com/datascyther/Jouspace
- **Live AI Runtime (Cloudflare Workers):** https://jouspace-runtime.jouspace.workers.dev
- **Releases / APK downloads:** https://github.com/datascyther/Jouspace/releases

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| Build | `vite-plugin-singlefile` — the whole app inlines into one `dist/index.html` |
| PWA | Manifest + icons + self-hosted fonts in `public/` (offline-safe) |
| AI Runtime | Express 4 + OpenAI SDK (NVIDIA NIM gateway), SSE streaming |
| Mobile shell | Capacitor — committed `android/` platform with branded icons, native permissions, and release signing |

## Quick start

```bash
npm install          # install frontend deps
cd server && npm i   # install runtime deps

# create server/.env (project root, gitignored)
#   NVIDIA_API_KEY=your_nvidia_nim_key

npm run dev:all      # Vite (http://localhost:5173) + Runtime (:3001) together
```

## Architecture

```text
Frontend (React)
  ├── useJouspaceIntelligence(capability)  → POST {runtime}/api/ai/<capability>
  ├── AI chat, reflection drawer, insight cards, writing summary
  └── API base URL is configurable (VITE_API_BASE_URL)

Intelligence Runtime (Express, server/)
  ├── routes/*          chat · reflect · insight · summarize (all SSE streaming)
  ├── ContextAssembler  journal context from client-sent entries (seeded if absent)
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

The `android/` platform is **committed** to the repo with branded icons, native
permissions, and a permanent release signing config. The web app compiles to a
single `dist/index.html` which Capacitor syncs into the committed native shell.

### Option A — GitHub Actions (recommended, zero local setup)

1. Push this repo to GitHub.
2. GitHub → **Actions** → **Build Android APK** → **Run workflow**.
3. Download `jouspace-release.apk` from the run's **Artifacts** section.

The workflow (`.github/workflows/build-apk.yml`) builds the web app, runs
`npx cap sync android` into the committed platform directory, and produces a
**signed release APK** using the committed keystore. Version is stamped from
the git tag (e.g. `v1.1.0-beta.1` → versionName `1.1.0-beta.1`, versionCode
`11001`).

### Option B — local build (needs JDK 17 + Android SDK)

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

### Versioning

The app follows **Semantic Versioning** with a `-beta.N` pre-release tag:

| Tag | versionName | versionCode |
|---|---|---|
| `v1.1.0-beta.1` | `1.1.0-beta.1` | `11001` |
| `v1.1.0-beta.2` | `1.1.0-beta.2` | `11002` |
| `v1.1.0` (stable) | `1.1.0` | `11100` |

- `versionCode = MAJ·10000 + MIN·1000 + PAT·100 + iteration`, where *iteration*
  is the beta number for `-beta.N` builds (01–99) and `100` for the stable
  release. This keeps `versionCode` **strictly increasing on every release** so
  Android/Play always orders a newer build over an older one.
- Bump the beta number for each beta iteration (`1.1.0-beta.1` → `-beta.2` → …).
- When ready for stable, **drop the `-beta.N` suffix** (`1.1.0`) — it maps to a
  higher versionCode than any beta of that version.
- Keep `package.json`'s `version` in sync with the current beta versionName.
- Builds are triggered by pushing a tag like `v1.1.0-beta.1` (the workflow's
  `v*` filter matches it) or by the Actions UI "Build Android APK" manual
  `version` input. See `DEPLOYMENT.md` §2.2 for the full scheme.

### Production notes

- **Deployment:** see [`DEPLOYMENT.md`](./DEPLOYMENT.md) for step-by-step
  hosting (Cloudflare Workers), runtime env vars, APK release signing
  (keystore → `assembleRelease`), and the current auth status.
- **Backend:** deploy the runtime to **Cloudflare Workers** (see
  [`DEPLOYMENT.md`](./DEPLOYMENT.md)) and build the app with
  `VITE_API_BASE_URL=https://jouspace-runtime.<subdomain>.workers.dev`.
  The runtime is intentionally simple and **stateless** — no database required.
- **Data (local-first hybrid):** the frontend persists journal entries in
  `localStorage` (`src/store/`) and sends the most recent ones to the runtime
  with every AI request. The server falls back to seed data only when the
  client sends none. A future cloud sync can be added behind the
  `JournalStore` interface without touching the AI pipeline.
- **Auth:** Google sign-in is wired through **Firebase Auth** (identity only).
  Email/password also goes through Firebase. Profile data (display name, join
  date) is stored locally in localStorage. Requires Firebase web-app config in
  `.env` (`VITE_FIREBASE_*`) and, for Android, a `google-services.json` at
  `android/app/google-services.json`. See `DEPLOYMENT.md` §3.

## Scripts

| Command | What it does |
| --- | --- |
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

## Privacy

Jouspace v1 is **local-first and account-free**. Your journal is stored entirely
on your device (in the browser's `localStorage` inside the app's WebView). There
is no account, no cloud sync, and no server that can read your journal.

- **No telemetry, no analytics, no remote logging** of your entries.
- **AI is opt-in.** The AI tab does nothing until you set a runtime URL in
  Profile. When you do, the entries you send are shared with *that* runtime to
  generate reflections — choose a runtime you trust. The default build has no
  runtime configured.
- **Export / import** is available in Profile (JSON) so you control your data.
- **Loss risk.** Because data is device-local, uninstalling the app or clearing
  site data erases your journal. Export regularly.

## License

Released under the [MIT License](./LICENSE).
