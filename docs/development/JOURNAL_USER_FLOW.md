# Journal — UX Architecture (User Flows)

> Phase2 · Journal Product Architecture · Step 3 (revised)
> Status: Locked (revised) · Depends on: JOURNAL_FOUNDATION.md, JOURNAL_ARCHITECTURE.md

This document designs **how users experience the Journal** through its core flows. Each
flow states the user's intent, the steps, the screens touched, and the system behavior.
Items tagged **[EXISTS]** already work in code; **[PLANNED]** are defined here for later
build. Flows honor the foundation: effortless capture (P1), optional structure (P2), calm
over gamified (P4), privacy by default (P6), AI serves the writer (P8), AI augments never
replaces (P9), and no therapy/diagnosis/crisis/gamification (NG1–NG8).

The spine of every flow is: **the user writes → saves → AI adds value (Reflection, Mood
Extraction, Memory Extraction, Recommendations).** The AI never writes for the user.

---

## 1. First-Time Flow

**Intent:** A new user opens the Journal for the first time and writes something without
friction or a tutorial wall.

**Trigger:** User taps the Journal tab (quill icon) on first ever visit.

Steps:
1. App detects no `journal_entries` for the user (or guest local store empty).
2. Journal Hub (J1) renders a **welcoming, empty state** — not a how-to doc:
   a short line ("A space for your thoughts") + a focused composer pre-expanded.
3. User types freely; no title, tags, or mood required (blank page is valid, NG5).
4. Save → entry created (see Create flow). On success, the empty state transitions to
   the recent list in place (no jarring navigation).
5. A one-time, dismissible hint explains the Home composer also saves here ("You can
   also jot thoughts from Home"). Shown once, never again.

Screens: J1 (Hub, empty variant).
System: `journalService.list()` returns empty → empty state; `create()` on save.
Guardrails: No forced onboarding, no "complete your profile" gate, no streak guilt (P4).

---

## 2. Returning User Flow

**Intent:** A user who has written before returns to capture or revisit.

**Trigger:** User taps Journal tab on a later visit.

Steps:
1. Hub (J1) loads recent entries (most recent 3–5) above a quick composer.
2. "Reflected today?" state is derived: if an entry exists for today's date, the
   composer shows a soft "Add another thought" affordance instead of "Start today's
   reflection" — re-entry is welcoming, never penalizing (P4).
3. User may:
   - Quick-capture a new thought (composer at top), or
   - Tap an entry → Entry Detail (J3, with its Reflection output), or
   - Tap "History" (J5), "Search" (J6), "Reflection" (R1), or "Memory" (M1).
4. Pull-to-refresh re-fetches; failures isolate to the list and never blank the
   composer (safe() resilience pattern).

Screens: J1 → (J3 | J5 | J6 | R1 | M1).
System: `journalService.list()` ordered by `created_at desc`; date-derived "today" flag.
Cross-surface: Same entries are reachable from the Home composer, so a thought saved on
Home appears here on return.

---

## 3. New Entry + AI Analysis Flow (core)

**Intent:** Write freely, save, and let the AI add value *after* — without replacing the
user's voice.

### 3a. Quick capture (Home) — [EXISTS]
1. On Home, user focuses "What's on your mind?" (`ReflectionInput`).
2. As soon as text is non-empty, a permanently-mounted **Save reflection** button
   fades in (never unmounts — avoids the Fabric responder break).
3. Optional: user picks a mood in the check-in; that `mood_id` attaches to the entry.
4. Tap Save → `handleSaveReflection` → `journalService.create({ body, mood_id? })`.
5. On success: button shows "Saved ✓", input clears, query cache invalidated.

### 3b. Full editor (tab) — [PLANNED]
1. From Hub, tap composer's expand or "New Entry" → J2 (`/(tabs)/journal/new`).
2. Editor: optional `title`, `body`, optional mood picker, optional tags.
3. Auto-save draft locally (local-first) so closing mid-write never loses text (see Drafts).
4. Save → `journalService.create(...)`. Edit later → `journalService.update(id, patch)`.

### 3c. AI Analysis (runs on save) — [PLANNED]
After the entry is persisted, the edge runtime runs **AI Analysis** and:
1. Returns the **Reflection output** for the entry — AI Summary, Emotional Patterns,
   Key Takeaways, Suggested Actions — shown on Entry Detail (J3) and aggregated on the
   Reflection screen (R1).
2. Performs **Mood Extraction** — links/derives emotional signal to `moods`.
3. Performs **Memory Extraction** — embeds the entry into Pinecone `mem-<uid>`
   (Important Moments, Preferences, Long-term Recall), referenced back to `journal_entries.id`.
4. Emits **Recommendation signals** into the recommendation / personalization engine.

Shared system behavior:
- Validation: `JournalService.create` requires `title` **or** `body` (not both).
- Ownership: `user_id` stamped server-side; RLS enforces.
- Offline: capture works without connection; AI Analysis is async/best-effort (P7, P9).
- Graceful degradation: if Pinecone/NVIDIA absent, Reflection/Memory panels show
  deferred/empty states; capture and browsing are unaffected.

Screens: Home composer (3a) | J2 (3b) → save → J1/J3 + AI Analysis (3c).

---

## 4. Drafts Flow

**Intent:** Never lose writing. Resume an unfinished entry.

Steps:
1. While writing in J2, text autosaves locally (debounced) as a draft.
2. If the user leaves without saving, the draft persists in the local store.
3. From Hub, "Drafts" (J4) lists saved drafts; tapping one re-opens J2 prefilled.
4. Saving an entry removes its draft; deleting a draft is a one-tap action.

Screens: J2 → J4 → J2.
System: local-first draft store (MMKV/AsyncStorage); not yet in `journal_entries`.

---

## 5. History (Timeline) Flow

**Intent:** Look back over time and see how thinking has shifted (P3 — time is the feature).

Steps:
1. From Hub, tap "History" → J5.
2. Entries grouped by **date headers** (Today, Yesterday, This week, month/year).
3. Each row: date, title-or-snippet, linked mood chip (if any), small Reflection indicator.
4. Tap a row → Entry Detail (J3): full body, date, linked mood, and the entry's
   Reflection output (AI Summary, Patterns, Takeaways, Actions).
5. Optional filters: by mood, by tag (PLANNED). Search by keyword (PLANNED, J6).

Screens: J1 → J5 → J3.
System: `journalService.list()` (desc) → client grouping by `created_at`; `get(id)` for detail.
Guardrail: browsing is calm and chronological — no scoring, no "you're behind" cues (P4).

---

## 6. Search Flow

**Intent:** Locate a past entry quickly by keyword (and optionally mood/date).

Steps:
1. From Hub or History header, tap "Search" → J6 (`/(tabs)/journal/search`).
2. Debounced query over cached `journal_entries` (title + body).
3. Results as `GlassCard` rows (title/snippet + date + mood chip).
4. Tap a result → Entry Detail (J3). No-results state is calm ("No reflections match '…'").

Screens: J1/J5 → J6 → J3.
System: client filter over React Query cache; server query only if volumes grow.

---

## 7. Reflection Output Flow (AI)

**Intent:** The AI helps the user reflect better — summarize, surface patterns, distill
takeaways, suggest gentle actions — without judging or advising clinically (P8, P9, NG1).

Steps:
1. **Per-entry:** after save (flow 3c), Entry Detail (J3) shows the entry's Reflection
   output — AI Summary, Emotional Patterns, Key Takeaways, Suggested Actions — as
   dismissible, plain-language cards. The user's own text remains the primary content.
2. **Aggregate:** the Reflection screen (R1) gathers the user's own patterns across
   entries (e.g., "You've written about rest three times this month") plus recent
   Suggested Actions.
3. **In-editor assist [PLANNED]:** While writing, an optional "Help me reflect" action
   asks the Companion (edge runtime) to surface a related past memory or a gentle open
   question. It never writes the entry for the user.
4. **Boundaries:** No diagnosis, no crisis handling in-product (NG1/NG3); crisis stays
   in the AI runtime's crisis protocol. The AI serves the writer, not the metric.

Screens: J3 (per-entry) | R1 (aggregate) | J2 (assist).
System: edge `AIOrchestrator` → `MemoryTool` + `PromptAssembler`; reads memory, writes nothing to journal.

---

## 8. Memory Flow (engine surface)

**Intent:** Transparency into the AI's long-term memory — show the user what the Companion
"remembers" from their journal and let them remove items (P6, P8, P9).

Steps:
1. On entry creation/update, Memory Extraction ingests the entry into the per-user
   long-term memory namespace `mem-<uid>` (Pinecone), bucketed as Important Moments,
   Preferences, and Long-term Recall.
2. Embedding is produced via NVIDIA; stored with a back-reference to `journal_entries.id`
   (never stores PII beyond what the user wrote).
3. The Memory screen (M1) shows these buckets as memory cards (cyan accent) with a
   per-item **forget** action (best-effort Pinecone delete by id).
4. **Graceful degradation:** if Pinecone/NVIDIA absent, Memory shows empty/deferred;
   journal capture is unaffected.
5. **User control:** deleting an entry purges its memory vectors where feasible
   (cascade in Data Control). Ingestion is consented and never used for engagement (NG8).

System: `JournalService` (write) → Memory Extraction (edge) → Memory screen (read).
Boundary: the Journal only *produces* memory; it never becomes a chat surface (NG7).

---

## 9. Recommendations Flow (feeds the platform)

**Intent:** The journal becomes one of the richest sources for the recommendation and
personalization engines already designed in the AI platform — so the rest of Jouspace
(Home, exercises, missions, Companion) personalizes from the user's own voice.

Steps:
1. On save, AI Analysis emits **Recommendation signals** derived from the entry's
   Reflection output + Mood/Memory Extraction.
2. The recommendation / personalization engine consumes these signals to tailor other
   surfaces (e.g., surface a relevant exercise, a gentler tone, a timely prompt).
3. Recommendations are **derived and non-clinical**; they never manipulate engagement
   (NG4/NG8) and never appear inside the Journal as a "you should" wall.
4. The user can see *why* (via the Reflection/Memory screens) but is never obligated
   to act on a suggestion.

System: AI Analysis → RecommendationEngine / personalization pipeline (read by other
surfaces). No new Journal screen required; value surfaces elsewhere in the app.

---

## 10. Weekly Review Flow

**Intent:** A gentle, opt-in moment to notice the week — surfacing the user's own words
and moods, not a report card.

Steps:
1. **Trigger [PLANNED]:** Once per week, a calm prompt appears on Home/Hub
   ("Want to look back at this week?") — dismissible, never nagging (P4).
2. Review view [PLANNED] aggregates (client/edge computed, not stored):
   - Entries written this week (from `journal_entries`, `created_at` range).
   - Moods logged (from `moods`), shown as context, not judgment.
   - A short, plain-language theme drawn from the user's own entries (Reflection flow).
3. User may:
   - Write a **weekly reflection** (captured as a normal entry, optionally tagged `weekly`), or
   - Dismiss and return later (no streak penalty).
4. No counters, no "X of 7 days" guilt mechanics; the review is an invitation, not a metric.

Screens: J1 (prompt) → Review view [PLANNED] → J2 (write) or dismiss.
System: read `journalService.list()` + `moodService` for the week; insights derived, not persisted.

---

## Flow Summary

| Flow | Primary screen(s) | Key system call | Status |
|------|-------------------|----------------|--------|
| First-time | J1 (empty) | `list()` → empty; `create()` | Partial [EXISTS] |
| Returning | J1 → J3/J5/J6/R1/M1 | `list()` | Partial [EXISTS] |
| New Entry + AI Analysis | Home / J2 → J3 + Analysis | `create()` → AI Analysis (Reflection/Mood/Memory/Recs) | Partial [EXISTS] |
| Drafts | J2 ↔ J4 | local draft store | [PLANNED] |
| History | J5 → J3 | `list()` / `get(id)` | Partial [EXISTS] |
| Search | J6 → J3 | filter over cache | [PLANNED] |
| Reflection output | J3 / R1 / J2 | `AIOrchestrator` + `MemoryTool` | [PLANNED] |
| Memory | M1 / edge | Pinecone `mem-<uid>` extract + forget | Partial [EXISTS] |
| Recommendations | (other surfaces) | AI Analysis → rec/personalization engine | [PLANNED] |
| Weekly review | J1 → Review → J2 | `list()` + moods (derived) | [PLANNED] |

All flows keep capture one tap away, structure optional, the user's voice primary, and
data user-owned. AI outputs are derived and degrade gracefully. Changes to these flows
require re-locking this document.
