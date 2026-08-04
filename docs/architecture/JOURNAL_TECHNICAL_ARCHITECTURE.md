# Journal — Technical Architecture (Data & Logic)

> Phase 2 · Journal Product Architecture · Step 6 (revised)
> Status: Locked (revised) · Depends on: JOURNAL_FOUNDATION.md, JOURNAL_ARCHITECTURE.md, JOURNAL_DESIGN_SYSTEM.md

This document locks the **technical backbone** of the Journal: data model, repositories,
services, state, APIs, the **AI Analysis pipeline**, sync/offline, and security. It reuses
the verified Jouspace stack and architecture boundaries from `AGENTS.md`. Items tagged
**[EXISTS]** are in code; **[PLANNED]** are specified here. Any `journal_entries`
schema change requires a Supabase migration + freeze re-review (per `backend/FREEZE.md`).

---

## 1. Architecture Overview (layered)

```
┌─────────────────────────────────────────────────────────────┐
│  Screens (100% presentational)  HomeScreen · Journal/*      │
│  Hooks (React Query + screen hooks)  useJournal*, useReflect│
├─────────────────────────────────────────────────────────────┤
│  Feature Services / ViewModels   ReflectionService [PLANNED] │
│  Client Repositories (local-first) ReflectionRepository [PLAN]│
├─────────────────────────────────────────────────────────────┤
│  Backend Services (facade)        JournalService      [EXISTS]│
│  Backend Repositories (Supabase)  JournalRepository    [EXISTS]│
├─────────────────────────────────────────────────────────────┤
│  Supabase Postgres (journal_entries) · RLS per-user   [EXISTS]│
└─────────────────────────────────────────────────────────────┘
        │                                  │
        └── AI edge (AI Analysis) ─────────┘
   JournalService.create → AI Analysis →
     • Reflection output (summary/patterns/takeaways/actions)
     • Mood Extraction  → moods
     • Memory Extraction → Pinecone mem-<uid> (Important Moments, Preferences, Recall)
     • Recommendation signals → recommendation / personalization engine
   Chat/Companion → MemoryTool → retrieve (read-only)
```

**Boundaries (non-negotiable, per AGENTS.md):**
- Only `backend/repositories/*` may import `@supabase/supabase-js`.
- UI/features never import supabase directly; they call `JournalService` (or a future
  `ReflectionService`) → `JournalRepository`.
- AI runs server-side in `api/ai/chat.ts` (edge); the RN client never holds Pinecone
  or NVIDIA keys.

---

## 2. Data Model

### 2.1 `journal_entries` (source of truth) — [EXISTS]

```sql
journal_entries (
  id          uuid pk,
  user_id     uuid fk -> profiles(id) on delete cascade,
  title       text null,
  body        text null,
  mood_id     uuid null fk -> moods(id),
  attachments json,
  created_at  timestamptz,
  updated_at  timestamptz
)
```
- `JournalService.create` requires `title` **or** `body` (validation in facade).
- `mood_id` is an **optional** link to `moods` (feeling ↔ meaning).
- The user's writing is the canonical record. All AI outputs are derived from it.

### 2.2 Proposed additions — [PLANNED, needs migration]

| Change | Field | Impact |
|--------|-------|--------|
| Favorites | `favorite boolean not null default false` on `journal_entries` | powers Favorites screen; **requires migration + freeze review** |
| Weekly tag | optional `tags text[]` | powers Insights/Weekly filters (alternative: derive from body) |

> Decision deferred to implementation: store `tags` as a column vs. derive insights
> client/edge-side. Default recommendation: **derive**, avoid schema churn; add
> `favorite` only if the Favorites screen is built.

### 2.3 Derived (never stored as a Journal sub-table)
- **Reflection output** — AI Summary, Emotional Patterns, Key Takeaways, Suggested
  Actions. Computed at save time and on request (edge or client); shown to the user only.
- **AI memory vectors** — in Pinecone `mem-<uid>` (Important Moments, Preferences,
  Long-term Recall); canonical record stays `journal_entries`.

---

## 3. Repositories

### 3.1 Backend `JournalRepository` — [EXISTS]
`backend/repositories/JournalRepository.ts`. Methods: `list()` (desc by `created_at`,
owner-filtered), `get(id)`, `create(input)`, `update(id, patch)`, `remove(id)`. All
stamp/filter `user_id`; RLS enforces ownership. Registered in `backend/repositories/index.ts`.

### 3.2 Client `ReflectionRepository` — [PLANNED]
Mirror the existing local-first pattern (e.g., `MoodRepository`):
```ts
async loadEntries(uid) {
  const local = await this.loadFromLocal(uid);   // AsyncStorage / MMKV
  if (local.length) return local;
  const cloud = await journalService.list();
  await this.persistEntries(uid, cloud);
  return cloud;
}
```
- Offline capture writes local first; `useSyncStore` flushes to `JournalRepository`.
- Cache keyed by `uid`; invalidated on create/update/remove.

---

## 4. Services

### 4.1 `JournalService` — [EXISTS]
`backend/services/JournalService.ts`. Thin facade: `list/get/create/update/remove`.
Re-exports `JournalRow`. UI calls this, never the repository.

### 4.2 `ReflectionService` / ViewModel — [PLANNED]
Feature-level orchestrator (mirrors `HomeService`/`HomeViewModel`):
- Aggregates recent entries, "reflected today" flag, weekly aggregates, and the
  Reflection output + Memory summary for a given entry.
- Uses `safe()` per section so one failure (e.g., AI Analysis) never blanks capture/archive.
- Wraps `JournalService` + (future) the AI Analysis edge call.

---

## 5. State Management

Three tiers (per AGENTS.md):

| Tier | Mechanism | Journal use |
|------|-----------|----------------|
| Server cache | TanStack React Query | `useJournalList`, `useJournalEntry(id)`, `useJournalMutations` (create/update/remove), `useReflectionOutput(id)`, `useMemorySummary`. Query key `['journal', uid]` / `['journal', uid, id]`. |
| Global client | Zustand (`useAppStore`, `useSyncStore`) | draft text, unsaved edits, sync queue. |
| Local component | `useState` | composer text, modal/sheet visibility, filter selection. |

- Screens stay 100% presentational: destructure one hook (e.g., `useJournalHub()`) → props.
- Mutations invalidate `['journal', ...]`; optimistic update on save (prepend + "Saved ✓").
- `safe()` isolation on Home Intelligence Layer already demonstrates the pattern.

---

## 6. APIs / Edge

- **Capture:** client → `ReflectionService.create({body, mood_id?, title?})` →
  `JournalService.create` → `JournalRepository.create` → Supabase insert (server stamps
  `user_id`, `created_at`).
- **AI Analysis (on create/update):** the edge runtime runs `AIOrchestrator` against the
  saved entry and emits four derived results:
  1. **Reflection output** — AI Summary, Emotional Patterns, Key Takeaways, Suggested
     Actions (returned to the client for the Entry Detail / Reflection screens).
  2. **Mood Extraction** — emotional signal linked to / derived for `moods`.
  3. **Memory Extraction** — embeds the entry (NVIDIA) and upserts into Pinecone
     `mem-<uid>` under the Important Moments / Preferences / Long-term Recall buckets,
     with a back-reference to `journal_entries.id`.
  4. **Recommendation signals** — emitted to the recommendation / personalization engine.
- **Read in Chat/Companion:** `MemoryTool` retrieves relevant memories to ground the
  Companion; `RecommendationEngine` consumes the emitted signals.
- **Flag:** respects `ENABLE_RAG`/memory gates; degrades to in-memory when Pinecone or
  NVIDIA embeddings are absent (per Phase 4 review). Capture never blocks on AI Analysis.

---

## 7. Sync & Offline — [PLANNED extension]

- **Local-first capture (P7):** composer writes to `ReflectionRepository` local store
  immediately; UI shows "Saved ✓" without waiting on network.
- **Queue:** extend `useSyncStore` (currently only `save_mood` + `update_profile`) with a
  `save_journal_entry` item type, mirroring the existing `enqueueItem`/`processQueue`
  pattern. (Journey-specific queue types were removed in Phase 1; this is a clean add.)
- **AI Analysis is async & best-effort:** capture succeeds even if Analysis is deferred;
  the Entry Detail shows a "Reflection pending…" state and fills in when Analysis completes.
- **Conflict:** last-write-wins on `updated_at`; `user_id` scoped, no cross-user merge.
- **Guest/anonymous:** local capture works; sync on auth via existing anonymous→user flow.

---

## 8. AI Integration (technical)

The Journal is the **richest source** for the AI platform we already designed
(`api/ai/runtime/` pipeline: IntentClassifier → ToolRouter → PromptAssembler →
ModelGateway → ResponseRouter; `PineconeMemoryStore`; `MemoryTool`; recommendation /
personalization engines).

- **Produce only:** the Journal creates memory vectors and emits recommendation signals;
  it never reads/writes chat.
- **AI Analysis pipeline:** on save, the edge runs Analysis and returns the Reflection
  output while performing Mood + Memory Extraction. The user's voice (the entry) is the
  input; Reflection/Memory are the output. **AI augments, never replaces (P9).**
- **Memory buckets (Pinecone `mem-<uid>`):**
  - *Important Moments* — salient events/feelings worth long-term recall.
  - *Preferences* — learned user preferences (tone, topics, boundaries).
  - *Long-term Recall* — durable context that makes the Companion feel continuous.
- **Consent & control:** ingestion is user-consented; the Memory screen can forget an
  item (best-effort Pinecone delete by id).
- **Recommendations:** emitted signals feed the recommendation / personalization engine so
  the rest of Jouspace (Home, exercises, missions) personalizes from the user's own voice.
- **Privacy:** only the user's own text is embedded; no PII enrichment beyond entry content.
- **Boundaries:** no diagnosis/crisis in the Journal (NG1/NG3); crisis stays in the AI
  runtime's protocol.
- **Graceful degradation:** missing `PINECONE_API_KEY`/`NVIDIA_API_KEY` → in-memory
  fallback; capture and browsing unaffected; Reflection/Memory screens show empty/deferred
  states instead of errors.

---

## 9. Security & Privacy

- **Ownership:** every row has `user_id`; RLS policy `using (user_id = auth.uid()) with
  check (...)`. Cross-user reads impossible.
- **No service-role in client:** `SUPABASE_PROD_SERVICE_ROLE_KEY` lives only in gitignored
  `.env`; never bundled (verified by `backend/env/verify-env.mjs`).
- **Delete cascade:** `remove(id)` deletes the row; Memory forget purges the vectors;
  cascade best-effort.
- **Export:** user-initiated, personal use (NG6); returns plain entries, no derived scoring.
- **Minimal surface:** the Journal exposes no sharing/feed (NG6); no analytics on entry
  *content* for engagement (NG8). Recommendation signals are used to personalize the
  product, never to manipulate engagement.

---

## 10. Performance & Resilience

- **Pagination:** `list()` returns all for a user (typical volumes small); add range
  queries if histories grow. History uses footer `SkeletonLoader`.
- **Caching:** React Query `staleTime` ~30s (mirrors Home `['homeState']`); local cache
  first.
- **Resilience:** `safe()` per section; list failure isolates to list, composer always
  usable; AI Analysis failure isolates to the Reflection/Memory panels (never blocks
  capture or browsing). Mutations show toast on error and keep unsaved local text.
- **Type-check/build:** `tsc --noEmit` + `npm run build` must stay green; unit tests in
  `__tests__/` colocated.

---

## Lock Statement

The Journal's technical backbone reuses the frozen Supabase `journal_entries` layer via
`JournalService`/`JournalRepository`, adds a local-first `ReflectionRepository` and a
`ReflectionService` orchestrator, uses React Query + Zustand, extends `useSyncStore` for
offline capture, and — on every save — triggers an **AI Analysis** pipeline that produces
the Reflection output (AI Summary, Emotional Patterns, Key Takeaways, Suggested Actions),
performs Mood and Memory Extraction into Pinecone `mem-<uid>`, and emits Recommendation
signals. All AI outputs are derived, consent-based, and degrade gracefully. Schema changes
(e.g., `favorite`) require a migration + freeze review. Changes to this architecture
require re-locking the document.
