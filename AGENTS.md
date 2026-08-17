# AGENTS.md

Guide for AI agents working in this repository.

## Project

**Jouspace** — a local-first, account-free AI journaling app. Two packages:

- **Frontend** (repo root): React 19 + TypeScript + Vite 7 + Tailwind CSS 4. Builds to a *single* `dist/index.html` via `vite-plugin-singlefile`; wrapped in a Capacitor Android shell for APK builds. The `android/` platform directory is **committed** to the repo with branded icons, native permissions, and a permanent release signing config — it is NOT regenerated each build.
- **Intelligence Runtime** (`server/`): Express 4 + tsx, own `package.json`. Provider-agnostic AI orchestration (currently NVIDIA NIM via OpenAI SDK) exposing SSE endpoints under `/api/ai/*`. It is **stateless** — no database; the client sends its own journal entries with every request.

## Commands

```bash
npm install                 # frontend deps
cd server && npm install    # runtime deps (separate package)

npm run dev                 # Vite dev server only (http://localhost:5173)
npm run server              # runtime only (tsx watch, http://localhost:3001)
npm run dev:all             # both together (kills anything on :3001 first)

npm test                    # vitest run (all tests, one pass)
npx vitest run src/utils/nav.test.ts   # single file
npm run test:watch

npx tsc --noEmit            # type-check (no dedicated npm script)
npm run build               # production build → single-file dist/index.html
```

- **There is no linter/formatter configured.** CI (`.github/workflows/ci.yml`) only runs `tsc --noEmit`, `build`, and `test`. Do not add lint tooling unprompted.
- **Server must be running for AI features in dev.** Without it, `/api` proxy requests fail; the frontend degrades gracefully (`isRuntimeConfigured()` checks for a URL).
- `.env` goes in the **project root**, not `server/` (the runtime resolves `../.env` explicitly). Needs `NVIDIA_API_KEY` for real AI responses; without it the runtime boots but streams fail.
- APK builds happen in GitHub Actions (`.github/workflows/build-apk.yml`); the committed `android/` directory provides the native shell. CI runs `npx cap sync android` then `assembleRelease` with the committed keystore. `android/` is NOT gitignored.

## Architecture

### Frontend

```text
src/main.tsx → ErrorBoundary → OverlayStackProvider → App
```

- **`src/App.tsx` is the hub.** One large component owns navigation state (`Screen`/`NavTab` from `src/utils/nav.ts`), all overlay/sheet state, toasts, and passes callbacks down. Screen contents live in `src/components/*ScreenContent.tsx` / `*Screen.tsx`. When adding cross-cutting UI state, this file is usually the right home.
- **Persistence is a swappable singleton**: `src/store/JournalStore.ts` defines the `JournalStore` interface; `src/store/index.ts` exports the `journalStore` localStorage implementation. Components consume it via `useJournalStore()` (`src/hooks/useJournalStore.ts`) — never call localStorage for entries directly. Starts **empty** on first run; sample data is injected only via Profile → "Load sample data" (`loadDemoData()`).
- **All AI features go through one hook**: `useJouspaceIntelligence(capability)` (`src/hooks/useJouspaceIntelligence.ts`). It streams SSE, accumulates tokens, and drives `isThinking`/`isStreaming`. Runtime URL resolution order: localStorage `jouspace:runtimeUrl` (Profile) → build-time `VITE_API_BASE_URL` → empty (dev uses the Vite `/api` proxy to `localhost:3001`). Only `'chat' | 'reflect'` capabilities are wired on the client even though the server also has `insight` and `summarize` routes.
- **Local-only intelligence utilities** (`src/utils/`): `sentiment.ts` (keyword-bucket heuristic for composer "whispers"), `atmosphere.ts` (per-theme composer color wash), `draft.ts` (unsaved new-entry persistence), `nav.ts` (last-screen restore), `validation.ts`. These are pure, offline, no-network by design.
- React 19 + `StrictMode` is on; tests must account for double-invoked effects.

### Runtime (`server/`)

Pipeline per request: **Zod validation → ContextAssembler → PromptAssembler → ModelGateway → StreamController (SSE)**.

- `routes/` — one router per capability (`chat`, `reflect`, `insight`, `summarize`), all mounted under `/api/ai`.
- `context/ContextAssembler.ts` — uses client-sent entries; falls back to built-in seed data only when the client sends none.
- `gateway/` — `ModelGateway` interface; only `NvidiaGateway` implemented (`openai`/`anthropic` throw). Factory in `gateway/index.ts` switches on `GATEWAY_PROVIDER`.
- Server imports **must use explicit `.js` extensions** on relative imports (ESM under tsx). Frontend imports use no extensions.
- Security invariants: API keys never serialized, client `system` role messages rejected, `reasoning_content` discarded, errors return generic `{ error: "Intelligence unavailable" }`.

## Conventions

- **Imports are relative** (`../components/...`, `../store`). A `@` alias exists (Vite + tsconfig `paths`) but is **not used** in source — keep using relative paths.
- Components are named function exports (`export function X` / `export const X`), PascalCase files in `src/components/`; hooks `useX.ts` in `src/hooks/`; utilities camelCase in `src/utils/`.
- Class merging uses `cn()` from `src/utils/cn.ts` (clsx + tailwind-merge).
- Icons: `lucide-react` (plus `react-icons` available).
- **localStorage keys are namespaced `jouspace:*`** (`jouspace:journal:v1`, `jouspace:nav`, `jouspace:theme`, `jouspace:profile`, `jouspace:journal:draft`, `jouspace:ai:chat:messages`, `jouspace:ai:context`, `jouspace:runtimeUrl`). Follow the pattern and validate/corrupt-safely parse any stored payload (see `readStoredNav`/`readDraft` for the idiom).
- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` — unused vars fail CI.
- Accessibility is taken seriously: semantic roles, `aria-label`s on icon buttons, focus traps (`useFocusTrap`), Escape handling (`useEscapeKey`). Tests assert accessible labels — keep them.
- Tone: UI copy is calm/quiet; code comments use section banners (`// ── Name ──…`) in larger files.

## Design system (do not violate)

- **Three synchronized sources of truth** for colors/spacing/radii: `src/theme.css` (CSS custom properties), the `@theme` block in `src/index.css` (Tailwind v4 tokens → utilities like `bg-base`, `bg-surface`, `border-borderSubtle`, `text-primary`), and `src/tokens.ts`. When changing a color, update **all three**.
- **Canonical tokens.** Background/border/role utilities use the spec names: `bg-base`, `bg-baseTint`, `bg-surface`, `bg-elevated`, `border-borderSubtle`, `bg-borderSubtle`, `divide-borderSubtle`, `text-primary`, `text-secondary`, `text-muted`. The legacy spellings `bg-background`, `bg-canvasTint`, `border-border`, `border-divider`, `text-primaryText`, `text-secondaryText` are **deprecated aliases** that resolve to the same values — keep them only where renaming every component is impractical. Note: Tailwind v4 only emits `--color-*` theme variables that are referenced by *used* utilities, so an unused canonical utility (e.g. `text-primary`) won't appear in the compiled CSS until a component actually uses it; the alias versions are what the current components consume.
- **The canvas color has four *additional* mirrors** beyond those three: `src/hooks/useTheme.ts` (`LIGHT_BASE`/`DARK_BASE`), `index.html` (`meta[name=theme-color]`), and `public/manifest.json` (`background_color` **and** `theme_color`). Changing `--bg-base` means updating **seven** places.
- **The app background is one flat token color, owned solely by `src/components/AppBackground.tsx`.** It mounts once as the first child of the phone frame in `AppScreen` and takes no props. Do **not** add gradients, washes, or per-screen backgrounds to it, and do not paint backgrounds on screen components. Anything that varies per screen belongs *above* the canvas, which means `relative z-10` (a positioned `z-index: 0` layer paints above in-flow content). See the comment block above `.app-background` in `index.css` for why gradients were removed: near black, hex deltas that look tiny are enormous in relative terms — the old dark canvas measured up to 2.35× base luminance at the center and read as a visible blob.
- **Never introduce new color literals** — use the token utilities. `scripts/refactor-colors.mjs` was a one-time migration of arbitrary hex values to tokens.
- Dark mode = `html[data-theme="dark"]` overriding CSS vars (managed by `useTheme`/`applyTheme`; applied pre-paint in `main.tsx`). In dark mode, dark-theme overrides must beat both `:root` var sets — see the specificity note in `theme.css` before adding dark-mode styles.
- Layout lives inside `AppScreen`'s "mobile prison": a centered max-w-[430px] column that renders as a phone frame on desktop. **Modals/drawers/toasts must be passed via `AppScreen`'s `overlays` prop** so they clip inside the frame instead of covering the browser viewport.
- Overlay closing order is managed by `OverlayStackProvider` (`useFocusTrap.tsx`) — register new overlays with it so only the topmost handles Escape/focus trap.
- Fonts (Playfair Display / Inter) are self-hosted in `public/fonts/`; offline-safe PWA, don't add remote assets.

## Testing

- Vitest + Testing Library + jsdom; config lives in **`vite.config.ts`** (`test:` block), setup in `src/test/setup.ts`.
- `setup.ts` installs an in-memory `localStorage` polyfill globally — tests share it; clear keys you depend on rather than assuming a fresh store.
- Tests are co-located (`Foo.test.tsx` next to `Foo.tsx`). Frontend only — **the server has no tests**.
- Vitest globals are enabled (`describe`/`it` available without import, though existing files import from `vitest` explicitly).

## Gotchas

- `package.json` `name` is the scaffold leftover (`react-vite-tailwind`) — harmless.
- `npm run dev:all` runs `kill $(lsof -ti:3001)` before starting; on non-macOS shells this may fail loudly but the script continues.
- The chat history persists (`jouspace:ai:chat:messages`) but only when the hook is idle — aborted/partial assistant messages are intentionally never saved. Reflect sessions are ephemeral.
- `StoredEntry` (store) is structurally compatible with the UI `Entry` type but adds `createdAt`/`updatedAt`; entries sort by `updatedAt` desc.
- Draft persistence (`jouspace:journal:draft`) applies only to **new** entries, never edits of existing ones.
- Auth: **Firebase is the identity provider (Google + email/password), identity only**. Profile data (display name, joined date) stored locally in localStorage; journal stays local-first with no cloud DB. Firebase is initialized in `src/lib/firebaseClient.ts`; native uses `@capacitor-firebase/authentication` (`skipNativeAuth: false` so the native session persists and `authStateChange` fires like the web SDK), web uses the Firebase JS SDK **redirect** flow (chosen for robustness on browsers where popups are blocked). Requires `.env` `VITE_FIREBASE_*` + `android/app/google-services.json` (see `DEPLOYMENT.md` §3).
- `DEPLOYMENT.md` documents hosting (Cloudflare Workers) and APK signing; `README.md` and `server/README.md` have deeper architecture detail — keep them in sync when changing those areas.
