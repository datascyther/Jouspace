# Journal — UI Architecture

> Phase2 · Journal Product Architecture · Step 4 (revised)
> Status: Locked (revised) · Depends on: JOURNAL_FOUNDATION.md, JOURNAL_ARCHITECTURE.md, JOURNAL_USER_FLOW.md

This document defines **every Journal screen before any visual design** — its purpose,
sections, components, states, and navigation. It is the contract that design and
implementation build against. Component names reference real, existing primitives in
`src/shared/components` (e.g., `GlassCard`, `ScreenContainer`, `SearchField`,
`GradientButton`, `BottomSheet`, `SkeletonLoader`, `Toast`, `Modal`, `IconButton`,
`SectionHeader`, `Badge`) and feature components (`ReflectionInput`, `MoodSelector`).
Items tagged **[EXISTS]** are already in code; **[PLANNED]** are specified here.

Accent tokens (from `tailwind.config.js` / `src/theme`):
- **jouspace.purple.500** — user content (Journal pillar).
- **jouspace.cyan.400** — AI-associated surfaces (Reflection + Memory pillars).

---

## Journal pillar (user-led)

### J1. Journal Hub
**Purpose:** The feature's front door — effortless free-write capture plus a window into
recent entries and entry points to Reflection/Memory. Opens to a composer, never a menu (P1).

**Sections**
- Header — "Journal" title + optional weekly-review prompt slot.
- Quick composer — `ReflectionInput` (pre-expanded on first visit).
- Recent entries — 3–5 most recent as `GlassCard` rows (purple `themeColor`).
- Entry points — "History", "Search", "Reflection", "Memory" affordances.

**Components:** `ScreenContainer`, `Header`/`SectionHeader`, `ReflectionInput`,
`GradientButton` (save, permanently mounted), `GlassCard` (entry rows), `MoodSelector`
(mood chip), `Badge`, `SkeletonLoader`, `Toast`.

**States:** Empty (first-time, welcoming + pre-expanded composer, no tutorial wall) ·
Loaded (recent list; "reflected today?" softens CTA, P4) · Loading (`SkeletonLoader`
rows; composer always usable) · Error (inline retry on list only) · Saved ("Saved ✓"
toast; input clears; list prepends).

**Navigation:** Tab root (`/(tabs)/journal`) → New Entry (J2) · Entry Detail (J3) ·
History (J5) · Search (J6) · Reflection (R1) · Memory (M1).

---

### J2. New Entry
**Purpose:** Full free-writing experience with optional context; autosaves drafts.

**Sections:** Header (back + optional "Drafts") · Title (optional) · Body (`ReflectionInput`)
· Optional mood picker · Optional tags · Save / Save-draft actions.

**Components:** `ScreenContainer`, `Header`, `ReflectionInput`, `MoodSelector`,
`GradientButton` (save), `IconButton` (drafts), `Toast`.

**States:** Writing · Draft-saved (local, debounced; "Draft saved" hint) · Saving
(disabled + spinner; optimistic) · Saved (→ J3/J1) · Error (inline; preserve text).

**Navigation:** From Hub (composer expand / "New") · → Entry Detail (J3) on save ·
→ Drafts (J4).

---

### J3. Entry Detail
**Purpose:** Read, edit, or delete a single entry; see its **Reflection output** (AI
Summary, Emotional Patterns, Key Takeaways, Suggested Actions) alongside the user's text.

**Sections**
- Header — back `IconButton` + actions (edit, delete).
- Meta — date, linked mood chip (if any).
- Body — the user's journal text (`GlassCard`, purple).
- Reflection output — `GlassCard` blocks (cyan) for AI Summary, Emotional Patterns,
  Key Takeaways, Suggested Actions; dismissible, plain-language.
- Actions — Edit (`BottomSheet`/`TextField`), Delete (`Modal` confirm).

**Components:** `ScreenContainer`, `Header`, `IconButton`, `MoodSelector` (chip),
`GlassCard` (body purple / reflection cyan), `BottomSheet` (edit), `TextField`,
`Modal` (delete confirm), `GradientButton`, `Toast`.

**States:** View · Editing (inline/`BottomSheet`; Save → `update`) · Saving (optimistic)
· Reflection pending (AI Analysis deferred; fills in later) · Deleting (`Modal` →
`remove` → toast → back) · Not found (graceful empty + back) · Error (preserve edits).

**Navigation:** Pushed from Hub / History / Search / Drafts / Reflection / Memory.

---

### J4. Drafts
**Purpose:** Resume unfinished entries (local-first autosave).

**Sections:** Header ("Drafts") · Draft rows (`GlassCard`: snippet + updated time) ·
Per-item continue / delete.

**Components:** `ScreenContainer`, `Header`, `GlassCard`, `IconButton`, `Toast`,
`EmptyState`, `SkeletonLoader`.

**States:** Empty ("No drafts yet") · Loaded (tap → J2 prefilled) · Deleted (optimistic).

**Navigation:** From Hub / New Entry · → New Entry (J2).

---

### J5. History (Timeline)
**Purpose:** Chronological browse of all entries; "time is the feature" (P3).

**Sections:** Header (title + `SearchField` affordance) · Date groups
("Today / Yesterday / This week / Month-Year" `SectionHeader`s) · Entry rows
(`GlassCard`: date, title-or-snippet, mood chip, small Reflection indicator) · Filters
[PLANNED] (mood, tag) · Infinite scroll.

**Components:** `ScreenContainer`, `Header`, `SearchField`, `SectionHeader`,
`GlassCard`, `MoodSelector` (chip), `SkeletonLoader`, `EmptyState`.

**States:** Empty ("No reflections yet" + write CTA) · Loaded (grouped) · Loading more
(footer spinner) · Filtered empty · Error (retry on list).

**Navigation:** From Hub · → Entry Detail (J3) · → Search (J6).

---

### J6. Search
**Purpose:** Locate past entries quickly by keyword (and optionally mood/date).

**Sections:** Header (`SearchField`, auto-focused) · Results (`GlassCard` rows:
title/snippet + date + mood chip) · Filters [PLANNED] · Empty / no-results states.

**Components:** `ScreenContainer`, `Header`, `SearchField`, `GlassCard`,
`SectionHeader`, `MoodSelector` (filter chip), `EmptyState`, `SkeletonLoader`.

**States:** Idle · Results (debounced over cache) · No results · Loading · Error (retry).

**Navigation:** From Hub / History header · → Entry Detail (J3).

---

## Reflection pillar (AI output · cyan)

### R1. Reflection
**Purpose:** Surface the user's own patterns in plain language they can act on or
dismiss — aggregated AI synthesis: AI Summary, Emotional Patterns, Key Takeaways,
Suggested Actions. Derived, never stored as a Journal sub-table, never for engagement (NG8).

**Sections:** Header ("Reflection") · AI Summary card (aggregate recap) · Emotional
Patterns cards · Key Takeaways cards · Suggested Actions (gentle, non-clinical, dismissible)
· Linked entries (tap → J3).

**Components:** `ScreenContainer`, `Header`, `SectionHeader`, `GlassCard` (cyan),
`IconButton` (dismiss), `Toast`, `SkeletonLoader`, `EmptyState`.

**States:** Computing (skeleton; non-blocking) · Empty ("Write a few reflections to see
themes", no pressure) · Loaded (cards; dismiss removes individually) · Error (inline;
absent does not affect capture/archive).

**Navigation:** From Hub (card) or Weekly Review · Theme/takeaway → source entry (J3).

---

## Memory pillar (engine surface · cyan)

### M1. Memory
**Purpose:** Transparency into the AI's long-term memory — show what the Companion
"remembers" from the journal and let the user remove items (P6, P8, P9). The user-facing
surface over Pinecone `mem-<uid>`, bucketed as Important Moments, Preferences, Long-term
Recall (Memory Extraction flow).

**Sections:** Header ("Memory") + privacy explainer · Three buckets — Important Moments,
Preferences, Long-term Recall — each a `GlassCard` group with memory cards (text snippet
+ source entry reference) · Per-item remove `IconButton`.

**Components:** `ScreenContainer`, `Header`, `GlassCard` (cyan), `IconButton` (remove),
`Toast`, `EmptyState`, `SkeletonLoader`.

**States:** Empty ("Nothing remembered yet" + explainer) · Loaded (cards; remove updates
optimistically) · Loading (skeleton) · Removed (toast "Forgotten" + card dismiss;
best-effort vector purge) · Error (inline retry; never blocks Hub).

**Navigation:** From Hub (secondary entry) or Profile → Data Control · Source reflection
deep-link [PLANNED] → Entry Detail (J3).

---

## Secondary

### Weekly Review [PLANNED]
**Purpose:** A gentle, opt-in look-back (P4, NG4). Header (week range) · This week's
entries · Moods context · Theme summary · CTA "Write a weekly reflection" → J2 (tagged
`weekly`) · Dismiss (remembered; re-offered next week).

### Favorites [PLANNED]
**Purpose:** Private shortlist (no social, NG6). Requires a `favorite` boolean on
`journal_entries` (schema addition → migration + freeze review). Header · Favorite rows ·
per-item unfavorite.

---

## Screen Inventory

| Screen | Pillar | Route | Status | Primary components |
|--------|--------|-------|--------|-------------------|
| Journal Hub | Journal | `/(tabs)/journal` | [EXISTS, placeholder] | ScreenContainer, ReflectionInput, GlassCard, GradientButton |
| New Entry | Journal | `/(tabs)/journal/new` | [PLANNED] | ReflectionInput, MoodSelector, GradientButton |
| Entry Detail (+ Reflection) | Journal+Reflection | `/(tabs)/journal/[entryId]` | [PLANNED] | GlassCard (purple+cyan), BottomSheet, Modal, Toast |
| Drafts | Journal | `/(tabs)/journal/drafts` | [PLANNED] | GlassCard, IconButton, EmptyState |
| History | Journal | `/(tabs)/journal/history` | [PLANNED] | SectionHeader, GlassCard, SearchField, SkeletonLoader |
| Search | Journal | `/(tabs)/journal/search` | [PLANNED] | SearchField, GlassCard, EmptyState |
| Reflection | Reflection | `/(tabs)/journal/reflection` | [PLANNED] | SectionHeader, GlassCard (cyan), IconButton |
| Memory | Memory | `/(tabs)/journal/memory` | [PLANNED] | GlassCard (cyan), IconButton, EmptyState |
| Weekly Review | — | `/(tabs)/journal/weekly` | [PLANNED] | SectionHeader, GlassCard, MoodSelector, GradientButton |
| Favorites | — | `/(tabs)/journal/favorites` | [PLANNED] | GlassCard, IconButton, EmptyState |

All screens share: `ScreenContainer` root, theme tokens via `useTheme`, bottom-nav
constant, privacy-by-default data handling, and safe() failure isolation so one broken
section never blanks the screen.

**Lock statement:** These screens define the Journal UI surface across its three pillars
(Journal / Reflection / Memory). New screens or route changes require re-locking this
document; any `journal_entries` schema change (favorites flag) requires a Supabase
migration + freeze review.
