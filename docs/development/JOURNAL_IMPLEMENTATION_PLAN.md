# Journal — Implementation Plan (Sprint Planning)

> Phase 2 · Journal Product Architecture · Step 7
> Status: Draft for lock-in · Depends on: all prior JOURNAL_*.md docs

This plan converts the locked architecture into **8 implementation sprints**. Each sprint
is independently shippable and verifiable (`tsc --noEmit` + `npm run build` + unit tests
stay green). `[EXISTS]` items are reused, not rebuilt. Schema changes go through the
Supabase migration + freeze re-review gate (per `backend/FREEZE.md`).

---

## Pre-Sprint Prerequisites (do first)

1. **Replace the placeholder** `app/(tabs)/reflection.tsx` with the real Journal Hub
   route `app/(tabs)/journal.tsx` (tab wired via `/(tabs)/journal`).
2. **Add `JournalRepository`** (client, local-first) in `src/repositories/`, mirroring
   `MoodRepository`.
3. **Add `ReflectionService`** orchestrator (recent list, "reflected today", AI Reflection
   summary, Memory count) using `safe()` per section.
4. **Extend `useSyncStore`** with `save_journal_entry` queue type (offline capture).
5. **Decision gate:** confirm `favorite` column migration before Sprint 7/Favorites; if
   deferred, Favorites uses a client-side flag instead.

---

## Sprint 1 — Journal Hub

**Goal:** A real landing that makes capture one tap away and shows recent entries.

**Scope**
- `Journal Hub (J1)`: composer entry point + recent list (3–6) + AI Reflection + Memories.
- Reuse: `ScreenContainer`, `GlassCard`, `GradientButton`, `SectionHeader`, `SkeletonLoader`.
- Wire: `ReflectionService` + React Query `['journal', uid]`; replace placeholder screen.

**Key tasks**
- Build `useJournalHub()` hook (presentational screen consumes it).
- Recent `GlassCard` rows (purple `themeColor`) → navigate to Detail.
- Empty (first-time) state with pre-expanded composer.
- Save path already works on Home; ensure same `journalService.create` is reused here.

**Acceptance**
- Hub renders recent entries; empty state on first visit; save prepends + "Saved ✓".
- `tsc` + `build` pass; `HomeScreen` composer unaffected.

---

## Sprint 2 — Journal Editor & Detail

**Goal:** Write/edit/delete a full reflection inside the tab.

**Scope**
- `New Journal (J2)` at `/(tabs)/journal/new`.
- `Journal Detail (J3)` at `/(tabs)/journal/[id]`.
- Reuse: `BottomSheet` (edit), `Modal` (delete confirm), `Toast`, `MoodSelector`.

**Key tasks**
- Editor: optional title, body, optional mood link, local draft autosave.
- Detail: read view, edit (`update`), delete (`remove` + vector purge best-effort).
- Route params typed via `routes.ts` (extend `JOURNAL` block with `NEW`/`DETAIL`).

**Acceptance**
- Create from Hub and Home both land in `journal_entries`; edit/delete persist; not-found
  handled; optimistic UI + rollback on error.

---

## Sprint 3 — Timeline (Archive)

**Goal:** Browse all reflections chronologically.

**Scope**
- `Timeline (R4)`: date-grouped list, infinite scroll, empty state.
- Reuse: `SectionHeader` (date), `GlassCard` rows, `SkeletonLoader`, `EmptyState`.

**Key tasks**
- Client grouping by `created_at` (Today/Yesterday/This week/Month-Year).
- Pagination/range query when histories grow; row → Detail.
- Header `SearchField` affordance → Search screen.

**Acceptance**
- Chronological groups render; scroll loads more; empty/week states correct; taps open Detail.

---

## Sprint 4 — Memories [PLANNED, AI]

**Goal:** Transparent, user-controlled view of AI long-term memory.

**Scope**
- `Memories` screen (`/(tabs)/reflection/memories`): memory cards (cyan accent), forget action.
- Reuse: `GlassCard` (cyan `themeColor`), `IconButton`, `Toast`, `EmptyState`.

**Key tasks**
- Edge ingest hook on `JournalService.create/update` → Pinecone `mem-<uid>` (respect
  `ENABLE_RAG`/graceful degradation).
- Memories list (read from memory store) + per-item forget (Pinecone delete by id).
- Privacy explainer copy.

**Acceptance**
- Memories list reflects saved reflections; forget removes card + vector; missing keys
  degrade to empty (capture unaffected); no PII leakage.

---

## Sprint 5 — AI Reflections

**Goal:** The Companion helps the user reflect, without judging.

**Scope**
- In-editor "Help me reflect" assist [PLANNED] + post-save insight [PLANNED].
- Reuse: edge `AIOrchestrator` + `MemoryTool`; `GlassCard`, `IconButton` (dismiss).

**Key tasks**
- Editor assist calls edge runtime (retrieve memory / gentle prompt); never auto-writes.
- Post-save insight card (dismissible, not stored); Chat continuity already exists via Memory.
- Guardrails: no diagnosis/crisis in-product (NG1/NG3).

**Acceptance**
- Assist returns a non-clinical prompt; insight dismissible; failures isolate (safe());
  no chat surface added to Reflection.

---

## Sprint 6 — Weekly Review

**Goal:** A gentle, opt-in look-back.

**Scope**
- `Weekly Review` (`/(tabs)/reflection/weekly`): week range, reflections list, mood
  context, theme summary, write-CTA, dismiss.
- Reuse: `SectionHeader`, `GlassCard`, `MoodSelector` chips, `GradientButton`.

**Key tasks**
- Aggregate `journal_entries` + `moods` for the week (derived, not stored).
- Calm prompt on Hub; dismiss remembered; no streak penalty.
- CTA → New reflection (optionally tagged `weekly`).

**Acceptance**
- Review shows week's reflections + moods + theme; empty-week copy is kind; dismiss persists.

---

## Sprint 7 — Search & Favorites

**Goal:** Find and bookmark reflections.

**Scope**
- `Search` (`/(tabs)/reflection/search`): debounced keyword over title+body, filters.
- `Favorites` (`/(tabs)/reflection/favorites`): bookmarked list + unfavorite.
- Reuse: `SearchField`, `GlassCard`, `IconButton` (star), `EmptyState`.

**Key tasks**
- Search: client-side filter over cached list (server query if volumes grow).
- Favorites: **decision from Pre-Sprint** — `favorite` column (migration + freeze review)
  OR client-side flag. Star toggle on Detail/Hub rows.
- Add Hub entry points to Search/Favorites.

**Acceptance**
- Search returns matches with no-results state; favorites persist across sessions; toggle works.

---

## Sprint 8 — Polish & QA

**Goal:** Lock quality before release.

**Scope**
- Motion pass (save spring, card enter, aurora) per design system.
- Empty states, a11y (44px targets, labels), dark/light tokens.
- `tsc --noEmit`, `npm run build`, `npm run test`, render tests, manual native + web.

**Key tasks**
- Verify all 8 screens against `JOURNAL_UI_ARCHITECTURE.md` + `JOURNAL_DESIGN_SYSTEM.md`.
- Safe() resilience audit; offline capture via `useSyncStore` extension.
- Clear Metro cache (`npx expo start -c`) and confirm no stale-reference warnings.

**Acceptance**
- All green: type-check, build, 260+ unit tests; manual pass on iOS/Android/Web; no
  console errors; privacy controls (export/delete) verified.

---

## Dependency Map

```
Prereqs ─┬─► S1 Hub ──► S2 Editor/Detail ──► S3 Timeline ──► S7 Search/Favorites
          │                                        │
          └─► S4 Memories (AI ingest) ─► S5 AI Reflections
          └─► S6 Weekly Review (needs S2/S3 data)
S8 Polish ─ depends on all
```

## Risks / Watch-items
- **Schema freeze:** `favorite`/tags columns need migration + review — decide early (Sprint 7).
- **AI gates:** Memories/Insights depend on `ENABLE_RAG`/Pinecone; build with graceful
  degradation so capture never blocks.
- **Cache:** after deletions/edits, clear Metro cache and watch for stale-reference warnings.

## Lock Statement
These 8 sprints implement the locked Reflection architecture end-to-end. Scope changes
require re-locking the relevant architecture doc; schema changes require a Supabase
migration + freeze re-review.
