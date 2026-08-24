# Jouspace — Beta Release Report

**Version:** `1.1.0-beta.2` (frontend) · Intelligence Runtime `1.0.4` (Express) / `1.0.3` (worker)
**Status:** Soft-launched private beta · **Date:** [INSERT DATE]
**Prepared by:** Product / Engineering Release Coordination

> **Integrity note.** Anything not yet measured on a device is marked `[INSERT VALUE]` or `[NOT YET MEASURED]`. Architecture claims marked **Verified** were confirmed against source. Items flagged `Must verify — [Technology]` require a code-level or on-device check before release sign-off. Nothing here should be presented as real user data until the "How to verify" instructions are executed.

## Task 1: Product and Technical Audit

### 1. Executive Summary

Jouspace is an account-free AI journaling app: a private place to think where writing lives on the user's device, autosaves with every keystroke, and survives refresh or restart without losing a word. It solves the trust and friction problems of mainstream journaling — no forced account, no cloud dependency for daily use — while a stateless, provider-agnostic Intelligence Runtime (chat, reflect, insight, summarize over SSE) reads only the journal context the user chooses to share. The product ships as a single-file PWA wrapped in a committed Capacitor Android shell, with Firebase as an optional identity layer. Beta is soft-launched: core surfaces (journal, memory, AI chat, profile, reminders) are implemented and covered by an automated CI pipeline (type-check, build, Vitest); device-level stability, performance, and crash behavior have **not yet been formally measured** — see placeholders throughout. Core differentiators: native-feel interaction layer, zero data loss on refresh by construction, and privacy as an architectural default.

### 2. Technical Architecture Audit

#### App framework / rendering — **Verified**
- React 19.2.6 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4.1 (`package.json`). `StrictMode > ErrorBoundary > OverlayStackProvider > KeyboardProvider > App` (`src/main.tsx`).
- Single self-contained `dist/index.html` via `vite-plugin-singlefile` (`vite.config.ts`). Capacitor 6.1.0 shell (`androidScheme: 'https'`), committed `android/` platform with branded icons + release keystore.
- Self-hosted fonts, dark mode via `html[data-theme]` applied pre-paint.
- *Verify:* `npm run build`, note bundle size `[INSERT VALUE — KB]`; cold-start theme flash on device.

#### Navigation / routing — **Verified**
- No router library; state-machine navigation in `src/App.tsx` (`Screen`/`NavTab` from `src/utils/nav.ts`, 20 screens, 5 tabs). Last-screen restore via `jouspace:nav` with corrupt-safe parse (`readStoredNav`).
- *Verify:* tab walk + kill/relaunch screen restore on device.

#### State management — **Verified**
- No Redux/Zustand. Context + hooks + a singleton `LocalStorageJournalStore` consumed via `useJournalStore()`. AI state per capability via `useJouspaceIntelligence(capability)`.

#### Local data storage / async persistence — **Verified**
- All namespaced `jouspace:*` localStorage keys; corrupt-safe parse idiom everywhere; `StorageQuotaError` surfaced. Draft (`jouspace:journal:draft`) applies to **new** entries only; autosave status cycle (editing → autosaving → autosaved).
- Optional Firestore ↔ localStorage sync (`store/cloudSync.ts`, authenticated users only, merge-by-`updatedAt` LWW + tombstones) — **behavioral risk not verified on a live Firestore project.**
- *Verify:* `Must verify — production Firestore instance, firestore.rules, firebase.json deployment`. Two-device offline/online merge matrix.

#### Backend architecture — **Verified (two runtimes, one contract)**
- **Production — Cloudflare Worker** (`worker/`): `wrangler.toml` name `jouspace-runtime`, `GATEWAY_PROVIDER=nvidia`, production default URL `https://jouspace-runtime.jouspace.workers.dev` (`useJouspaceIntelligence.ts`). Same contract: `GET /api/health`, `POST /api/ai/{chat,reflect,insight,summarize,memory}`, SSE wire `data:{"text":...}` / `[DONE]` / `{error}`, heartbeat, in-memory rate limiting, native-fetch NVIDIA gateway.
- **Local/dev fallback — Express 4.21.2 + tsx** (`server/`): stateless, no DB; pipeline Zod validation → ContextAssembler → PromptAssembler → ModelGateway → StreamController; `NvidiaGateway` implemented, `openai`/`anthropic` throw; guard pre-filter, token-bucket rate limits, `reasoning_content` discarded, client `system` role rejected, generic `"Intelligence unavailable"` errors.
- *Verify:* `wrangler deploy` status `[INSERT VALUE]`; load-test worker `[INSERT VALUE — req/s]`; curl each route with `NVIDIA_API_KEY`.

#### Image / avatar handling — **Verified**
- Avatar is an initials monogram derived from the display name; no image upload pipeline — by design. Shared across Profile and Memory screen headers.
- *Verify:* change display name → monogram updates everywhere on device.

### 3. UI/UX Native Stability Audit

Status legend: **Pass** = verified on device · **Fail** = verified defect · **Needs Verification** = not yet device-tested.

| Audit Item | Status | Explanation | How to Test on Device |
|---|---|---|---|
| Splash screen (static, no swipe/bounce) | Needs Verification | Static centered mark, `overscroll-none` (`SplashScreen.tsx`) | Cold-start APK; drag while splash visible — no scroll/bounce |
| Auth screen (static; keyboard no layout jump) | Needs Verification | `--vvh` shell + `useAdaptiveKeyboard` | Tap email field — form must not shift or resize frame |
| Bottom nav (must not stick to composer/keyboard) | Needs Verification | Nav hidden while keyboard open (code intent confirmed) | Open composer + keyboard — nav hidden until dismiss |
| Safe area / cutout (front camera, gesture bar) | Needs Verification | `.pb-safe`/`.pt-safe` via `env(safe-area-inset-*)`; not device-confirmed | Notched device + gesture-bar device; check header/toast/nav clear cutouts |
| Pull-to-refresh animation (native, no jank) | Needs Verification | Custom rAF drag, resistance 0.4, spring settle (`PullToRefresh.tsx`), unit-tested | Pull slow/fast/over-fast on Memory — 60 fps, no fly-off, no white flash |
| Scroll behavior (no unwanted bounce) | Needs Verification | `overscroll-none` + inner `overflow-y-auto` containers | Over-scroll top of feed — no viewport bounce/chrome shift |
| Screen transitions (no jitter) | Needs Verification | CSS transitions + `useAnimatedPresence` throughout | Rapid tab switches + 3 sheets — no layout shift/flicker |
| Journal screen (header/date/autosave spacing) | Needs Verification | Pinned header + date + autosave status (`JournalScreenContent.tsx`) | Write entry; verify spacing across keyboard + dark/light mode |

### 4. Feature-by-Feature Audit

| Feature | Current Status | Known Bugs / Risks | Priority |
|---|---|---|---|
| Authentication (Firebase Google + email/password) | Implemented / Not verified on device | `[INSERT BUG]`; `google-services.json` must match release keystore SHA-1; web redirect needs authorized domain in Firebase console | Critical |
| AI Chat (SSE streaming) | Implemented / Not verified end-to-end | `[INSERT BUG]`; needs production runtime URL (defaults to deployed worker); partial messages never persisted by design | Critical |
| Journal (create, autosave, draft) | Implemented / Not verified on device | `[INSERT BUG]`; draft only for new entries, never edits | Critical |
| Memory (search, nav, theme list) | Implemented / Not verified on device | `[INSERT BUG]`; insight card needs runtime availability | High |
| Notifications (reminder scheduling + in-app list) | Implemented / Not verified on device | `[INSERT BUG]`; Android 13+ permission/exact-alarm behavior untested | High |
| Profile (name, export, runtime URL, sign out) | Implemented / Not verified on device | `[INSERT BUG]`; runtime URL field can break AI if mis-set | Medium |
| Pull-to-refresh | Implemented / Not verified on device | Refresh never unmounts the scroll container (data-safe by design); gesture-vs-scroll conflict untested | High |

### 5. Performance & Reliability Audit

| Metric | Target | Beta value |
|---|---|---|
| Cold start (splash → interactive) | < 1.5 s mid-range Android | [INSERT VALUE — device] |
| Memory (RAM, steady state) | < [INSERT TARGET] MB | [NOT YET MEASURED] |
| FPS during scroll/animation | 60 fps | [NOT YET MEASURED — Perfetto] |
| AI first-token latency (worker → NVIDIA) | < 2 s | [NOT YET MEASURED] |
| AI full reflection (median) | < 15 s | [NOT YET MEASURED] |
| Error/crash rate (per 100 sessions) | < 1% | [NOT YET MEASURED — no crash reporting configured] |
| Bundle size (`dist/index.html`) | [INSERT TARGET] KB | [INSERT VALUE] |
| CI pass rate (last 10 runs) | 100% | [INSERT VALUE — Actions] |

**Top 5 riskiest areas for public release:**
1. **No crash reporting/analytics** — device crashes are invisible. *Mitigation:* add `Must verify — crash reporting choice` (e.g., Sentry) or a local error-log + "report bug" surface before public beta.
2. **Firestore sync correctness** — a merge bug can silently overwrite local entries. *Mitigation:* two-device offline/online matrix, rules audit (auth-only, own docs), visible sync status in Profile.
3. **AI runtime/provider dependency** — AI degrades when worker is down or `NVIDIA_API_KEY` missing; worker CPU ceiling kills long streams. *Mitigation:* verify graceful `{error:"Intelligence unavailable"}` degradation + retry, load-test worker, provider fallback via `ModelGateway`.
4. **Android native shell drift** — keystore/`google-services.json`/plugin set must match the committed `android/`. *Mitigation:* clean-checkout `build-apk.yml` run + physical-device sign-in/notification test.
5. **localStorage quota over long use** — single-file PWA inlines everything; long sessions near the ~5 MB ceiling raise `StorageQuotaError`. *Mitigation:* instrument headroom, prompt export near limit, measure cold start on low-end devices.

## Task 2: Beta Release Plan

### 1. Loom Demo Script (60–90 s) — link: `[INSERT LOOM LINK]`

| Time | Segment | Voiceover |
|---|---|---|
| 0:00–0:10 | Cold start + Home | "Jouspace opens as fast as a native app — a single-file build inside a native Android shell. It starts clean, with no forced sign-up; you can write with no account at all." |
| 0:10–0:25 | AI Chat | "In AI, Jouspace streams a reflection on the journal you choose — sent privately to a stateless intelligence runtime, and streamed back word by word. Built on your words, not a cloud database." |
| 0:25–0:40 | Journal + pull-to-refresh | "Writing feels native — watch the autosave status here. I type, then pull down to refresh. The screen re-syncs in place, the composer never unmounts, and nothing I wrote is lost. Zero data loss on refresh." |
| 0:40–0:55 | Avatar / profile | "In Profile, my display name drives a clean monogram avatar that carries through to the Memory screen. No upload, no permissions — fully private." |
| 0:55–1:10 | Notifications | "Reminder scheduling, controlled in-app, with an honest permission primer and native notifications on the schedule you choose." |
| 1:10–1:30 | Settings / navigation | "Settings and navigation — themes, dark mode, journal export, the AI runtime. Every transition is smooth, native-feel, and everything stays on-device." |

### 2. End-User Evaluation Sheet (1 = poor, 5 = excellent)

| # | Test Task | Result (Pass/Fail) | Notes / Bug Description |
|---|---|---|---|
| 1 | Sign up / sign in (Google + email/password); session survives restart | `[ ]` | |
| 2 | Start a journal entry, type a paragraph, close app, reopen, tap "Continue writing" — text intact | `[ ]` | |
| 3 | Write a journal, pull-to-refresh while keyboard is open — text stays | `[ ]` | |
| 4 | Open AI chat, send a prompt, verify streaming response with no errors | `[ ]` | |
| 5 | Open notifications, scroll the full list | `[ ]` | |
| 6 | Update display name in Profile; verify monogram avatar updates on Profile + Memory screens | `[ ]` | |
| 7 | Sign out; confirm you reach login and back-gesture does not return | `[ ]` | |
| 8 | Open app; verify cutout (front camera) handled natively — no black bar, clean alignment | `[ ]` | |
| 9 | Toggle dark mode; confirm no color flash and readable contrast across all screens | `[ ]` | |
| 10 | Export the journal to JSON and re-import it on a fresh install (data portability) | `[ ]` | |

| Metric | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| UI smoothness | ☐ | ☐ | ☐ | ☐ | ☐ |
| Native feel | ☐ | ☐ | ☐ | ☐ | ☐ |
| Data safety | ☐ | ☐ | ☐ | ☐ | ☐ |
| AI quality | ☐ | ☐ | ☐ | ☐ | ☐ |
| Overall experience | ☐ | ☐ | ☐ | ☐ | ☐ |

*Open feedback:* `[INSERT FREEFORM NOTES]`

### 3. Real-User Feedback Capture Plan
1. **Recruit 10–20 testers.** Android: Play Console **Internal Testing** track or direct signed APK — `[INSERT — build path: android/app/build/outputs/apk/release/app-release.apk (verify)]`. iOS: `Must verify — iOS wrapper` (repo has `android/` only; confirm whether an iOS target exists) via TestFlight. Source: existing soft-launch users + `[INSERT channel]`. Mix ~60% new / 40% returning.
2. **15-minute moderated interview** — questions: (1) "First impression in one sentence — what did you expect vs. get?" (2) "Show me writing + saving. Did anything ever make you nervous about losing your writing?" (3) "What did the AI add — would you miss it?" (4) "What felt least native or clunkiest?" (5) "Would you recommend this to a friend this week?"
3. **Categorize feedback:** Critical (data loss/crash/sign-in/AI broken) · Major (core task blocked) · Minor (cosmetic friction) · Enhancement (requests). Log: `[INSERT LINK]`.
4. **Go/No-Go — all four must pass:** (a) zero Critical bugs open; (b) crash reporting live, rate < 1% over ≥ 100 sessions; (c) ≥ 70% of testers rate UI smoothness AND data safety ≥ 4/5; (d) all data-loss tasks (2, 3, 10) pass across all testers.

## Task 3: Pitch Materials (summary)

### 1. Product Pitch
Jouspace is an account-free AI journaling app where entries live on-device, autosave with every keystroke, and survive any refresh or restart without a byte lost — while a stateless, provider-agnostic Intelligence Runtime streams gentle reflections and chat from the journal's own words. Shipped as a single-file PWA wrapped in a native Android shell, with Firebase as an optional, privacy-respecting identity layer, it delivers the calm, native-feeling, honest journaling experience users expect from a premium app — without the data-gathering trade-offs they increasingly reject.

### 2. Three Key Value Propositions
1. **Zero data loss, by construction** — on-device persistence + draft layer + refresh that re-syncs in place; JSON export/import.
2. **Private AI that reads only what you choose** — stateless runtime, per-request context, no database, no entry or conversation logs, no keys exposed.
3. **Native feel, native trust** — offline-capable single-file app, custom native-style gestures, keyboard-aware layout, no forced account.

### 3. Traction and Beta Status
| Metric | Value |
|---|---|
| Version in beta | `1.1.0-beta.2` |
| Beta testers (soft launch) | [INSERT VALUE] |
| Evaluation cohort | [INSERT VALUE — target 10–20] |
| Weekly active beta users | [NOT YET MEASURED — no analytics] |
| Journal entries created | [NOT YET MEASURED] |
| AI requests served | [INSERT VALUE — worker logs / rate-limiter counters] |
| Crash-free sessions | [NOT YET MEASURED — no crash reporting] |
| Play / TestFlight installs | [INSERT VALUE] |
| App store presence | Not listed — pending go/no-go |

### 4. Key Technical Differentiators
- **Single-file offline-first PWA → native shell**: one self-contained `index.html`, committed Capacitor `android/` platform, reproducible signed APK builds.
- **Stateless, provider-agnostic Intelligence Runtime**: Zod → context/prompt → `ModelGateway` → SSE; `NvidiaGateway` live, clean seam for more providers; server holds no user data.
- **Safe, native-feel interaction layer**: custom rAF pull-to-refresh, `--vvh` keyboard avoidance, overlay/focus-trap stack, flat-token design system.
- **Privacy as an architectural default**: no crash tracking, no analytics, no remote assets; Firebase optional; journal stays local unless the user opts into Firestore sync.

### 5. Risk and Mitigation Summary
| Risk | Severity | Mitigation |
|---|---|---|
| No crash reporting / telemetry | High | Add crash reporting before public beta; instrument key events |
| Firestore sync data-loss edge cases | High | Two-device offline/online matrix; rules audit; visible sync status |
| AI runtime / provider dependency | Medium | Graceful degradation coded; load-test worker; provider fallback |
| Native shell drift (keystore, `google-services.json`, permissions) | Medium | Clean-checkout APK build + physical-device sign-in test |
| Storage quota exhaustion over long use | Medium | Instrument headroom; prompt export; `StorageQuotaError` handled |

## Data Required Legend

**Audit (Task 1):** cold start / RAM / FPS / first-token / full-reflection latencies / crash rate (device-measured) · `dist/index.html` bundle KB · CI pass rate (last 10 runs) · device screenshots/video for all 8 UI/UX rows · safe-area verification on notched device · Firestore live sync + rules deployment results · deployed worker URL responsiveness + load test · device list (make/model/OS).

**Beta plan (Task 2):** Loom link + recording · signed APK path · Play Internal Testing setup + tester emails · TestFlight/iOS status · filled evaluation sheets (10 tasks + Likert, all testers) · interview notes (15 min × 10–20) · categorized feedback log · go/no-go scorecard evidence.

**Pitch (Task 3):** tester counts · weekly active / entries created / AI requests served · crash dashboard link · install numbers · store status · Firebase console usage (sign-ins, Firestore ops).