# Jouspace — Project Overview

*A precise, accurate description of the project, written for recruiters, technical reviewers, and non-technical readers alike.*

> **Scope note.** Everything in this document is verified against the source code and commit history of the repository (`datascyther/Jouspace`, branch `main`, through `v1.1.0-beta.2`). Where something is planned but not yet built, it is explicitly labelled **[PLANNED]**. Nothing here is overstated.

---

## 1. What the project is (plain language)

Jouspace is a **journaling app** — a place to write down your thoughts, reflections, and daily notes. It is built so that your writing belongs to you:

- **Your entries are stored on your own device**, not on a company server by default. The app works fully offline.
- **You can choose to sign in** with a Google or email account. If you do, your entries can sync across your devices (phone, web) through Firebase. If you don't sign in, your writing never leaves your device.
- **When you want help thinking**, the app can stream an AI reflection based only on the specific entries *you* select. That AI service is **stateless** — it keeps no copy of your journal, never logs your entries or conversations, and forgets the exchange the moment it finishes.

In one sentence: *a local-first journaling app with optional cloud sync and a privacy-preserving AI assistant.*

It is released as:
- a **web app** (installable, runs in a browser), and
- a **native Android app** (signed APK),

both built from the same codebase. The project is **open source** (MIT license) and currently in **public beta** (`v1.1.0-beta.2`).

---

## 2. Why it exists (the problem it solves)

Most journaling and note apps store your writing on their servers, tie it to an account you can't leave, and often use it to profile you. Jouspace takes the opposite stance:

- The journal is **local-first** — your words are on your hardware first, and the cloud is only an optional convenience you opt into.
- The AI is **stateless** — it receives only what you explicitly send, holds nothing in a database, and returns a streamed response that it discards afterward.

The goal is a tool that respects attention and privacy by construction, not by policy.

---

## 3. For non-technical readers — how it feels to use

- **Open it and write.** No forced sign-up. You can start a journal entry immediately.
- **It never loses your words.** Entries autosave as you type; closing and reopening keeps everything.
- **Calm design.** A paper-like light mode and a low-glare dark mode, tuned to reduce eye strain.
- **AI, on your terms.** In the AI screen, you pick which entries to reflect on; the app streams a thoughtful response word by word. You can stop at any time.
- **Optional sync.** Sign in once and your journal follows you across devices. Stay signed out and it remains entirely on your device.
- **Reminders.** Gentle, local notifications nudge you to write — set once, no account needed.

---

## 4. For technical readers — architecture

### 4.1 Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript (strict), Vite 7, Tailwind CSS 4 |
| Mobile shell | Capacitor 6 (Android), committed `android/` platform with release keystore |
| AI runtime (dev) | Node.js + Express 4, run with `tsx` |
| AI runtime (prod) | Cloudflare Workers port reusing the same core logic modules |
| Identity | Firebase Auth (Google + email/password) |
| Cloud sync | Firebase Firestore (background mirror only) |
| AI provider | NVIDIA NIM via OpenAI-compatible SDK (single implemented gateway) |
| Tests | Vitest + Testing Library + jsdom (~174 cases, 28 files) |
| CI/CD | GitHub Actions: type-check + build + test; signed APK release pipeline |

### 4.2 Frontend (the app)

- **Single-file build.** `vite-plugin-singlefile` compiles the entire web app into one self-contained `dist/index.html` with inlined, self-hosted fonts and **zero remote assets** — this is what makes the web app work offline and cold-start fast.
- **State.** No Redux/Zustand. Context + hooks + a singleton store. Navigation is a state machine in `App.tsx` (20 screens, 5 tabs) with last-screen restore.
- **Persistence.** A `JournalStore` interface with a `LocalStorage` implementation as the instant source of truth. All keys are namespaced `jouspace:*` and parsed corrupt-safely.
- **Design system.** Three synchronized token sources (CSS custom properties, Tailwind v4 `@theme`, and a TS `tokens.ts` file). The dark canvas is mathematically calibrated; gradients were removed after measuring up to 2.35× base-luminance drift at center.
- **Native-feel UX.** Custom rAF-physics pull-to-refresh, adaptive keyboard handling (no layout jumps), an overlay stack with focus traps and ordered Escape handling, and a unified Web/Android permission manager.

### 4.3 AI runtime (stateless by design)

The runtime exposes five capabilities over **Server-Sent Events (SSE)**:

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/chat` | Conversational companion over selected entries |
| `POST /api/ai/reflect` | Focused reflection on a specific insight |
| `POST /api/ai/insight` | Autonomous pattern discovery / thematic cards |
| `POST /api/ai/summarize` | Distillation of a long entry or thread |
| `POST /api/ai/memory` | Compact personalization profile from entries |
| `GET /api/health` | Status check |

Each request flows through a five-stage pipeline:

```
Zod validation → ContextAssembler → PromptAssembler → ModelGateway → StreamController (SSE)
```

Key properties:

- **No database.** The client sends its own journal context with every request; the server stores nothing between requests and never logs your entries or conversations.
- **Provider-agnostic.** A `ModelGateway` interface abstracts the LLM; only the gateway sees the API key. Adding a provider touches two files. Only `NvidiaGateway` is implemented today.
- **Security invariants.** Client-supplied `system` roles are rejected; model chain-of-thought (`reasoning_content`) is consumed and discarded; per-bucket token rate limiting; all errors return a generic `{ error: "Intelligence unavailable" }` so internals never leak.
- **Two runtimes, one contract.** The Express dev server and the Cloudflare Worker share the same pure modules (`schemas.ts`, `guard.ts`, `PromptAssembler.ts`, `ContextAssembler.ts`); only the transport differs (Node http vs. Workers `fetch`/Web Streams).

### 4.4 Identity & sync (Firebase)

- **Auth.** Firebase Auth with Google and email/password. Web uses the JS SDK **redirect** flow; Android uses the native Google Sign-In sheet via `@capacitor-firebase/authentication`. One session model across both builds.
- **Sync.** Firestore is a **background mirror**, not the source of truth. `localStorage` stays instant; the UI never blocks on the network.
  - On sign-in: initial merge, then live `onSnapshot` listeners.
  - Local writes push debounced (~1s) to Firestore.
  - Merge strategy: by-ID **last-write-wins** on `updatedAt`; deletions become `deleted:true` **tombstones** (purged after 90 days) so other devices don't resurrect removed entries.
  - A `SyncStatus` machine (`idle → syncing → synced → error`) is surfaced to the UI; an `isRemoteWrite` flag prevents echo loops.
- **Privacy boundary.** Unauthenticated users never touch Firestore. Signing in is what enables cloud sync.

### 4.5 Release engineering

- The `android/` platform is **committed** with branded icons, native permissions, and a permanent signing keystore, so every CI build produces a signed release APK (no debug fallback).
- `versionCode` is derived from the semver git tag (`MAJ·10000 + MIN·1000 + PAT·100 + iteration`) so it is strictly increasing and every build upgrades cleanly over the last.
- CI runs `tsc --noEmit`, `build`, and the full Vitest suite before any release artifact.

---

## 5. What is real vs. what is planned

**Shipped and verified:**
- Local-first storage, offline web app, autosave, draft recovery.
- Stateless AI runtime (5 SSE capabilities) on Express + Cloudflare Workers.
- Firebase Auth (Google + email/password) and Firestore cross-device sync.
- Native Android APK via Capacitor, signed releases via CI.
- Reminder notifications, memory threads (search/filter), theming, export.

**[PLANNED — not yet built]:**
- **Client-side encryption at rest.** Entries are currently stored in plaintext in `localStorage`. Encryption is on the roadmap, not implemented.
- **Additional AI providers** beyond NVIDIA NIM (the gateway abstraction supports it; only NVIDIA is wired).
- **Web app offline install robustness.** There is currently no service worker; true offline-after-first-load is guaranteed on the Android APK, and the web app is instant/local but not service-worker-cached.

---

## 6. Facts appendix (for verification)

| Metric | Value |
|---|---|
| Total TypeScript | ~18,700 LOC (15.3k frontend · 2.5k Express · 0.9k Worker) |
| Components / hooks | 69 / 14 |
| Tests | ~174 cases, 28 files |
| Version | v1.1.0-beta.2 (public beta) |
| License | MIT |
| Repo | github.com/datascyther/Jouspace |
| Live web | jouspace.pages.dev |
| AI runtime | jouspace-runtime…workers.dev |
| Migration commit | `e693fbe` — "migrate identity/sync to Firebase; drop voice dictation; beta 1.1.0 (#5)" |

**Things deliberately NOT claimed:** no user/DAU/latency/crash metrics are published (none measured); no Supabase (abandoned experiment); no voice dictation (dropped); no "account-free" branding (Firebase accounts are supported).

---

*Prepared 2026-08-23. Accurate as of the `main` branch at `v1.1.0-beta.2`.*
