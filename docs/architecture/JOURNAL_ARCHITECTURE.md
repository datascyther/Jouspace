# Journal — Information Architecture

> Phase 2 · Journal Product Architecture · Step 2 (revised)
> Status: Locked (revised) · Depends on: JOURNAL_FOUNDATION.md

This document defines **what the Journal contains** — its three-pillar conceptual model,
feature hierarchy, navigation, screen map, feature relationships, and data hierarchy. It is
the structural blueprint that later implementation phases build against. Items marked
**[PLANNED]** are defined here but not yet built; items marked **[EXISTS]** are already
present in the codebase.

The surface is **Journal** (user-led). **Reflection** and **Memory** are AI-derived
layers built *from* the user's writing — never a replacement for it (P9).

This document is the structural blueprint that satisfies the Phase 1 **UX Freeze**
(Sprint 1.10): its Navigation (§3) *is* the frozen **navigation** dimension, its
Screen Map (§4) the frozen **section hierarchy**, and its primitives the frozen
**component hierarchy** (full component list in `JOURNAL_UI_ARCHITECTURE.md`; interaction
flow in `JOURNAL_USER_FLOW.md`). The three locked wireframes — Home, Editor, Detail
(from `JOURNAL_FOUNDATION.md` Sprint 1.10) — are the visual source of truth.

---

## 1. Conceptual Model — three pillars

```
                        ┌──────────────────────────────────────────────┐
                        │                   JOURNAL                      │
                        │         (user-led surface · purple)           │
                        │         free writing the user owns            │
                        └───────────────────────┬──────────────────────┘
                                                 │ Save Entry
                                                 ▼
                                        ┌─────────────────┐
                                        │   AI ANALYSIS   │  (edge runtime)
                                        └────────┬─────────┘
                 ┌───────────────────────┬────────┴────────┬──────────────────────┐
                 ▼                       ▼                 ▼                      ▼
         ┌──────────────┐      ┌───────────────┐  ┌──────────────┐    ┌──────────────────┐
         │  REFLECTION  │      │MOOD EXTRACTION│  │ MEMORY EXTRACT│    │  RECOMMENDATIONS │
         │ (AI output ·  │      │(emotional     │  │(→ Memory engine│    │ (→ recommendation │
         │   cyan)       │      │ signal→moods) │  │  Important    │    │  /personalization│
         │ AI Summary    │      └───────────────┘  │  Moments,     │    │  pipeline)        │
         │ Emotional     │                          │  Preferences, │    └──────────────────┘
         │  Patterns     │                          │  Long-term    │
         │ Key Takeaways │                          │  Recall)      │
         │ Suggested     │                          └──────────────┘
         │  Actions      │
         └──────────────┘
```

- **Journal** = the user's voice (source of truth).
- **Reflection** = AI synthesis *of* the journal (summary, patterns, takeaways, actions).
- **Memory Extraction** = the journal feeds the persistent **Memory** engine (Important
  Moments, Preferences, Long-term Recall in Pinecone `mem-<uid>`), which in turn powers
  the Companion, recommendations, and personalization.
- **Mood Extraction** links the writing to the `moods` signal.
- **Recommendations** flow into the recommendation / personalization engine already designed
  in the AI platform.

**Product pillars (Phase 1, Sprint 1.4) map onto this model:**

| Product pillar | Glyph | Architecture layer | Meaning |
|----------------|--------|-------------------|---------|
| **Write** | ✍️ | Journal (capture) | The user-led act of capturing their own voice. |
| **Understand** | 🧠 | Reflection (AI output) | AI helps the user make sense of what they wrote. |
| **Remember** | 📖 | Memory (engine) | Durable, consented recall powering the Companion. |
| **Grow** | 🌱 | Recommendations / personalization | Forward value that compounds across the app. |

Every feature must strengthen one pillar (Phase 1 gate). **Write** is the foundation;
without it, Understand / Remember / Grow cannot exist.

---

## 2. Feature Hierarchy

Journal is a top-level feature (a primary bottom-nav tab). It is organized into three
pillars. Capture is the front door; Reflection, Memory, and Recommendations are derived
value the user gets *after* writing.

```
Journal (tab)
├── 1. Journal (capture)            # user-led surface
│   ├── New Entry                  # [PLANNED] free writing composer (no forced fields)
│   ├── Drafts                    # [PLANNED] autosaved local drafts
│   ├── History                   # [PLANNED] chronological browse (was Timeline)
│   └── Search                    # [PLANNED] keyword find
├── 2. Reflection (AI output)     # derived, shown after save
│   ├── AI Summary                # [PLANNED] per-entry + aggregate synthesis
│   ├── Emotional Patterns         # [PLANNED] from mood extraction
│   ├── Key Takeaways             # [PLANNED] distilled insights
│   └── Suggested Actions         # [PLANNED] gentle, non-clinical
├── 3. Memory (engine surface)    # transparency over the memory engine
│   ├── Important Moments         # [PLANNED] notable extracted memories
│   ├── Preferences               # [PLANNED] learned user preferences
│   └── Long-term Recall          # [PLANNED] durable recall (mem-<uid>)
└── 4. Data Control               # privacy is the default state
    ├── Export                    # [PLANNED] personal use only
    └── Delete                    # [EXISTS, backend] per-entry remove (cascades to memory)
```

Design rules from the foundation that this hierarchy honors:
- **Capture is always one tap** (P1). The tab opens to a composer, never a menu.
- **Structure is optional** (P2, NG5). A blank page is valid; AI extras are aids, not requirements.
- **No gamification** (P4, NG4). History/Memory exist to help the user look back, not to build streaks.
- **Privacy-first** (P6, NG6). Export/delete are first-class; no social surface.
- **AI augments, never replaces** (P9). Reflection/Memory degrade gracefully when the AI is off.

---

## 3. Navigation

### Primary entry
- **Bottom navigation tab** — labeled **Journal**, icon `RiQuillPenAiFill` (quill + AI pen).
  Route: `/(tabs)/journal` *(rename from the current `/(tabs)/reflection`; see code follow-ups)*.
  This is the dedicated home of the feature.
- The tab is a first-class peer of `Home`, `Chat`, `Profile` (defined in
  `app/(tabs)/_layout.tsx` → `BottomNavigation` → `IconWrapper`).

### In-feature navigation (deep links)
| Destination | Route | Status |
|-------------|-------|--------|
| Journal hub (composer + recent) | `/(tabs)/journal` | [EXISTS, placeholder] |
| New Entry | `/(tabs)/journal/new` | [PLANNED] |
| Entry Detail (+ Reflection output) | `/(tabs)/journal/[entryId]` | [PLANNED] |
| Drafts | `/(tabs)/journal/drafts` | [PLANNED] |
| History | `/(tabs)/journal/history` | [PLANNED] |
| Search | `/(tabs)/journal/search` | [PLANNED] |
| Reflection (aggregate) | `/(tabs)/journal/reflection` | [PLANNED] |
| Memory | `/(tabs)/journal/memory` | [PLANNED] |

### Cross-surface entry points
- **Home composer** — the "What's on your mind?" block (`ReflectionInput` in
  `HomeScreen.tsx`) is the primary *quick-capture* surface. It saves directly to
  `journalService.create(...)` without leaving Home. This is the fastest path and the
  most-used entry; the Journal tab is the deeper, revisiting + AI-output surface.
- **Mood check-in** — after a mood is selected, the composer can attach it (`mood_id`)
  to the saved entry, linking feeling to meaning.

### Navigation principles
- Journal is reachable in **one tap from anywhere** via the bottom tab.
- No Journal screen is gated beyond the app's authenticated requirement; guest/anonymous
  users use local-first capture.
- Editor, detail, history, search, reflection, and memory are **stack pushes** off the
  tab, preserving the tab bar as the constant home.

> **UX Freeze (Phase 1, Sprint 1.10):** this Navigation section *is* the frozen
> **navigation** dimension. It is locked; the three wireframes (Home → `/(tabs)/journal`,
> Editor → `/(tabs)/journal/new`, Detail → `/(tabs)/journal/[entryId]`) from
> `JOURNAL_FOUNDATION.md` are the visual source of truth and must not diverge from
> these routes/labels.

---

## 4. Screen Map

| # | Screen | Pillar | Route | Status | Purpose | Key elements |
|---|--------|--------|-------|--------|---------|--------------|
| J1 | **Journal Hub** | Journal | `/(tabs)/journal` | [EXISTS, placeholder] | Entry point. Free-write composer + recent entries + entry points to Reflection/Memory. | Composer, recent list, "History/Search/Reflection/Memory" affordances |
| J2 | **New Entry** | Journal | `/(tabs)/journal/new` | [PLANNED] | Full free-writing experience; optional context. | Title (optional), body, mood picker, tags (optional), save/draft |
| J3 | **Entry Detail** | Journal + Reflection | `/(tabs)/journal/[entryId]` | [PLANNED] | Read one entry; see its Reflection output; edit/delete. | Body, date, linked mood, AI Summary/Patterns/Takeaways/Actions, edit/delete |
| J4 | **Drafts** | Journal | `/(tabs)/journal/drafts` | [PLANNED] | Resume autosaved local drafts. | Draft rows, continue/delete |
| J5 | **History** | Journal | `/(tabs)/journal/history` | [PLANNED] | Browse all entries by recency/date; search/filter. | Chronological list, date headers, filter by mood/tag |
| J6 | **Search** | Journal | `/(tabs)/journal/search` | [PLANNED] | Locate past entries by keyword. | SearchField, results, no-results state |
| R1 | **Reflection** | Reflection | `/(tabs)/journal/reflection` | [PLANNED] | Aggregate AI synthesis: AI Summary, Emotional Patterns, Key Takeaways, Suggested Actions. | Theme cards, dismissible actions, linked entries |
| M1 | **Memory** | Memory | `/(tabs)/journal/memory` | [PLANNED] | Transparency over the memory engine: Important Moments, Preferences, Long-term Recall. | Memory cards (cyan), per-item forget |
| — | **Quick Capture (Home)** | Journal | Home composer | [EXISTS] | Fastest save path; not a separate route. | `ReflectionInput`, save button, optional mood link |

> Note: J1 currently renders a placeholder (`app/(tabs)/reflection.tsx`). Implementation
> phases will replace it and rename the route to `/(tabs)/journal`.

---

## 5. Relationships Between Features

The Journal's value compounds through connections to the rest of Jouspace. All connections
are **read-mostly** and **privacy-respecting**.

```
                 ┌─────────────┐
                 │   Profile   │  (Data Control: export / delete / privacy)
                 └──────┬──────┘
                        │ owns
                        ▼
   ┌──────────┐   ┌──────────────┐   ┌──────────┐
   │  Mood    │──►│    Journal     │◄──│   Home    │
   │ (feeling)│   │ (user's voice)│   │ (capture) │
   └──────────┘   └──────┬───────┘   └──────────┘
                        │ Save Entry
                        ▼
                 ┌──────────────┐
                 │  AI Analysis  │  (edge runtime)
                 └──────┬───────┘
        ┌────────────┬───┴────┬──────────────┐
        ▼            ▼         ▼              ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │Reflection│ │   Mood   │ │  Memory  │ │Recommendations│
  │ (output) │ │Extraction│ │ (engine)│ │   / Personal. │
  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
       │             │             │                │
       └─────────────┴─────► feeds Companion, recs, personalization
```

- **Mood ↔ Journal** — A entry may be linked to the day's mood via `mood_id` (optional,
  never required). Mood Extraction additionally derives emotional signal from the writing.
- **Home ↔ Journal** — Home's composer is the quick-capture front door; the Journal tab
  is the full archive, editor, AI-output, and memory surface. Both write to the same
  `journal_entries` store, so a note saved on Home appears in the tab.
- **AI Analysis ↔ Reflection / Memory / Recommendations** — On save, an edge job runs
  AI Analysis: it produces the **Reflection** output (summary, patterns, takeaways,
  actions), performs **Mood Extraction** (links/derives `moods`), performs **Memory
  Extraction** into Pinecone `mem-<uid>` (Important Moments, Preferences, Long-term
  Recall), and emits **Recommendation** signals into the recommendation / personalization
  engine. All are **derived and read-only** from the Journal's perspective, and **degrade
  gracefully** when the AI platform is unavailable.
- **Profile ↔ Journal** — Privacy controls (export, delete, visibility) live near account
  settings. Deleting an entry must also purge it from derived Memory where feasible.
- **Reflection / Memory ↔ User** — Shown back to the user in plain language; never stored
  as a Journal sub-table and never fed to engagement optimization (NG8).

---

## 6. Data Hierarchy

### Source of truth
`journal_entries` (Supabase Postgres) — per-user, RLS-enforced. Mirrors the frozen
backend contract in `backend/repositories/JournalRepository.ts` and
`backend/services/JournalService.ts`.

```
profiles (1) ──< (many) journal_entries
journal_entries (many) ──< (0|1) moods   [via mood_id, optional]
```

### `journal_entries` shape (current schema)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | primary key |
| `user_id` | uuid | owner; RLS-enforced |
| `title` | text \| null | optional; blank page is valid (NG5) |
| `body` | text \| null | the journal text |
| `mood_id` | uuid \| null | optional link to `moods` |
| `attachments` | json | optional media/links (future) |
| `created_at` | timestamptz | timestamp for archive/insights |
| `updated_at` | timestamptz | last edit |

### Access layers (must not be bypassed)
```
UI / ViewModel
   → JournalService        (backend/services/JournalService.ts)
   → JournalRepository     (backend/repositories/JournalRepository.ts)
   → Supabase (journal_entries)
```
UI/features never import `@supabase/supabase-js` or the repository directly (per
AGENTS.md architecture boundaries).

### Derived / non-stored data (produced by AI Analysis)
- **Reflection output** (AI Summary, Emotional Patterns, Key Takeaways, Suggested
  Actions) — computed from the entry (+ history) at save time and on request; shown to
  the user only; not a stored Journal sub-table.
- **Mood Extraction** — emotional signal linked to / derived for `moods`.
- **Memory vectors** — in Pinecone `mem-<uid>` (Important Moments, Preferences,
  Long-term Recall); regenerated from entries; canonical record remains `journal_entries`.
- **Recommendation signals** — emitted to the recommendation / personalization engine.

### Data ownership & lifecycle
- Every entry is owned by `user_id`; cross-user reads are impossible under RLS.
- Create: quick capture (Home) or full editor (tab).
- Read: list (hub/history), detail (+ reflection output).
- Update: edit from detail/editor; AI Analysis re-runs on update.
- Delete: per-entry remove (backend exists); cascades to derived Memory where feasible.
- Export: user-initiated, personal use only (NG6).

---

## Summary (lock statement)

The Journal contains three pillars — **Journal (capture)**, **Reflection (AI output)**,
and **Memory (engine surface)** — reached from a primary bottom-nav tab (quill icon) and
a Home quick-capture composer. The user writes freely; on save, **AI Analysis** produces
the Reflection output, performs Mood and Memory Extraction, and emits Recommendation
signals — all derived from `journal_entries`, all degrading gracefully, none replacing the
user's voice. Structure is optional, sharing is absent, and data is user-owned.

This architecture is binding for implementation phases. Changes to the hierarchy,
navigation, screen map, relationships, or data model require an explicit re-lock of
this document and, where the schema changes, a new Supabase migration + freeze review.

### Code follow-ups (rename surface → Journal)
- `src/shared/components/navigation/NavigationContext.tsx` — `TabName`: `'reflection'`
  → `'journal'`.
- `src/shared/components/navigation/BottomNavigation.tsx` — `TAB_CONFIGS` entry
  `reflection` → `journal` (label "Journal").
- `src/core/config/routes.ts` — rename `REFLECTION` block → `JOURNAL`
  (`HOME: '/(tabs)/journal'`, plus `NEW`, `DETAIL`, `DRAFTS`, `HISTORY`, `SEARCH`,
  `REFLECTION`, `MEMORY`).
- Placeholder file `app/(tabs)/reflection.tsx` → `app/(tabs)/journal.tsx`.
- `IconWrapper.tsx` — `case 'reflection':` → `case 'journal':` (keep `RiQuillPenAiFill`).
