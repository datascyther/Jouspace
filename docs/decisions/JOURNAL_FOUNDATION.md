# Journal — Product Foundation
*(Reflection and Memory are AI-derived layers of the Journal product)*

> Phase 1 · Journal Foundation (Product DNA) · Sprints 1.1–1.3
> Status: Locked — Philosophy (1.1), Core Identity (1.2), Core User Journey (1.3) passed · Owner: Product + Engineering

This document locks the product definition for the **Journal** surface of Jouspace,
the AI mental wellness companion. The Journal is the user-led writing space; **Reflection**
(the AI summary, patterns, takeaways, and suggested actions) and **Memory** (the persistent
memory engine) are derived layers built *from* the user's writing. This document is
intentionally non-technical and scope-binding: everything built in later phases must trace
back to the Purpose, Vision, Philosophy, Principles, Goals, and Non-goals defined here.

---

## Phase 1 — Journal Foundation (Product DNA)

Before any architecture, UI, or code, we lock *why the Journal exists*, the principles
that become permanent engineering rules, and the primary user flow. If we cannot state
the philosophy in one sentence, we do not build.

### Sprint 1.1 — Journal Philosophy

**Objective:** Lock the product philosophy. **Deliverables:** Journal Philosophy,
Emotional Problem, Retention Why, AI Role, Gate Review (one sentence).

Four questions we must answer before continuing:

- **Why does the Journal exist?**
  To give users a private, low-pressure place to notice and record what is true for them
  in their own words — so they can look back later and understand themselves better.
- **What emotional problem does it solve?**
  Wellness apps over-index on tracking and nudges and under-index on *continuity of
  self-understanding*. The Journal closes that gap: a thought is captured instead of
  lost, and becomes findable so patterns (not just data points) emerge over time.
- **Why will users come back tomorrow?**
  Because the value compounds with time. Each entry makes the next reflection, the AI's
  memory of them, and the personalization of the whole app a little richer — returning
  feels like continuity, not a chore.
- **What is the AI's role?**
  To augment, never replace. After the user writes, the AI synthesizes (Reflection),
  extracts mood and memory signals, and feeds recommendations — always derived from the
  user's own voice, always degradable when unavailable.

**Philosophy in one sentence (Gate):**
> The Journal is the user's private space to think in their own voice; the AI listens
> after they write, to help them remember and understand — never to speak for them.

> **Gate decision:** The philosophy is stateable in one sentence. **Phase 1.1 passes.**

### Sprint 1.2 — Core Product Identity

Start with principles, not features. These become **permanent engineering rules**:

- **Users own the story.** Every entry is the user's; the app never claims authorship or
  meaning. (Maps to P6 privacy, NG6 no-sharing.)
- **AI never replaces the user's voice.** Reflection and Memory are derived *from* the
  entry and must degrade gracefully; they never stand in for the user's writing. (P9.)
- **Writing comes first. Analysis comes second.** Capture is always one tap and never
  blocked by AI. Save succeeds even if Analysis is deferred. (P1, P7.)
- **Every journal entry can become a meaningful memory.** On save, Memory Extraction
  ingests the entry into the persistent memory engine that powers the Companion and
  recommendations.
- **The AI helps users discover patterns, not tell them how to feel.** Reflection
  surfaces patterns and gentle, non-clinical takeaways; it never diagnoses or advises
  clinically. (P8, NG1, NG3.)

> These five rules are binding for all downstream architecture, UI, and code.

### Sprint 1.3 — Core User Journey

**Objective:** Lock the primary flow as a permanent engineering rule.

The canonical path, end to end:

```
Open Journal → Write freely → Save → AI quietly understands
            → Memory updated → Reflection generated → Timeline grows → User returns tomorrow
```

Non-negotiable constraints on this journey (also permanent engineering rules):

- **No pressure.** The composer is always open; nothing is required to save.
- **No achievements.** No badges, levels, or "reflections completed" counters.
- **No streaks.** Absence is met with a calm welcome back, never a broken-streak penalty.
- **No gamification.** Engagement is never manufactured; the timeline grows because the
  user writes, not because the app nudges them to.
- **The writing experience stays sacred.** AI output (Reflection, Memory, Recommendations)
  is secondary, asynchronous, and never interrupts or rewrites the user's words.

> **Gate decision:** The journey is a single uninterrupted line with no pressure,
> achievement, streak, or gamification mechanic. **Phase 1.3 passes.**

### Sprint 1.4 — Product Pillars

**Objective:** Define the four pillars every feature must strengthen.

Everything in the Journal must belong to one of these four pillars. If a future
feature doesn't strengthen one of them, it doesn't belong.

| Pillar | Glyph | Meaning | Maps to (architecture) |
|--------|--------|---------|--------------------------|
| **Write** | ✍️ | The user-led act of capturing their own voice. | Journal (capture surface) |
| **Understand** | 🧠 | The AI helps the user make sense of what they wrote. | Reflection (AI Summary, Emotional Patterns, Key Takeaways, Suggested Actions) |
| **Remember** | 📖 | Durable, user-consented recall that powers the Companion. | Memory (Important Moments, Preferences, Long-term Recall) |
| **Grow** | 🌱 | Forward value that compounds over time across the app. | Recommendations / personalization engine |

- **Write** is the foundation — without it, nothing else exists. (P1, P7, P9.)
- **Understand** is the AI's first job after the user writes: synthesize, never replace. (P8, P9, NG1, NG3.)
- **Remember** turns entries into a persistent memory engine feeding the whole platform. (P6, graceful degradation.)
- **Grow** is the payoff: the user returns tomorrow because yesterday's writing made today's experience richer.

> Rule: every proposed feature must map to **Write**, **Understand**, **Remember**, or
> **Grow**. If it maps to none, it is out of scope (see Non-goals).

> **Gate decision:** Four pillars defined; the "strengthen one or it doesn't belong"
> test is locked. **Phase 1.4 passes.**

### Sprint 1.5 — Define the AI's Personality

**Objective:** Lock the AI's voice before building any AI output.

This is where most AI journals fail. The AI is **not**:

- **Therapist** — it does not diagnose, treat, or play clinician. (NG1, NG3.)
- **Coach** — it does not assign goals or push performance.
- **Motivational speaker** — it does not hype, cheerlead, or rally.
- **Life guru** — it does not dispense wisdom or tell the user how to live.

The AI **is**: *a thoughtful companion that notices patterns over time.*

Tone test — the difference is the whole product:

- ❌ `"You should…"` — prescriptive, other-directed, closes the loop for the user.
- ✅ `"I've noticed…"` — observational, user-directed, opens the loop for the user.

That is a completely different tone. Reflection output (AI Summary, Emotional Patterns,
Key Takeaways, Suggested Actions) must always land on the ✅ side: it surfaces what
the AI observed in the user's own writing, and leaves the meaning to the user. (P8, P9.)

> **Gate decision:** The AI's personality is locked as a noticing companion, not a
> prescriber; the "I've noticed…" voice is the standard. **Phase 1.5 passes.**

### Sprint 1.6 — Success Metrics

**Objective:** Define how we know the feature succeeds.

**Not** how we measure success:

- Number of AI chats.
- Number of screens.
- Number of features.

**Instead**, success is:

- **Users complete a journal entry in under 3 minutes.** (Capture is frictionless — P1.)
- **Users voluntarily return to write again.** (The journey compounds — Sprint 1.3.)
- **AI reflections feel helpful, not intrusive.** (Tone from Sprint 1.5; degrades gracefully — P9.)
- **Users trust the app with personal thoughts.** (Privacy is the product — P6, NG6.)

> **Gate decision:** Success is defined by user behavior and trust, not feature
> counts. **Phase 1.6 passes.**

### Sprint 1.7 — Emotional Safety

**Objective:** Define the safety boundaries before building.

- **Every journal entry is private by default.** No human reads it. No company uses
  it for training. (P6 privacy, NG6 no-sharing — binding.)
- **If a user writes something concerning, we respond with calm support and
  resources — never panic, never judgment.** The product stays steady when the
  user is not.
- **The AI stays within scope:** it is a companion, not a crisis line. Detection
  and crisis protocol live in the AI runtime, not in the Journal (NG3).

> **Gate decision:** Safety boundaries are locked: private-by-default, calm
> support (never panic/judge), AI stays a companion not a crisis line.
> **Phase 1.7 passes.**

### Sprint 1.8 — Non-goals

**Objective:** Define what the Journal explicitly is NOT.

Not:

- **A therapy app.** (NG1 — no therapy or coaching session.)
- **A diagnosis tool.** (NG2 — never scores, labels, or infers a condition.)
- **A mood tracker** — that is a separate surface; the Journal is writing, not a
  rating log. (NG9 — new, explicit boundary.)
- **A social network.** (NG6 — private by default, no sharing/feed.)
- **A productivity tool.** (NG10 — new, explicit boundary; no tasks / streaks /
  output metrics.)
- **A replacement for human connection.** (NG7 — it is writing, not a person;
  it complements, never substitutes, relationships.)

> These six map directly onto Non-goals NG1–NG2, NG6–NG7, and the new
> NG9–NG10 in Section 6. They are deliberate boundaries, not deferred features.

> **Gate decision:** The six explicit non-goals are locked and mapped to NG
> entries. **Phase 1.8 passes.**

### Sprint 1.9 — Scope Boundaries

**Objective:** Define exactly what the Journal does and does not touch.

**In Scope:**
- Journal writing + saving — the user's own words, owned by them.
- AI reflections on *your own* entries — summary, patterns, takeaways, gentle actions.
- Memory of *your own* writing — Important Moments, Preferences, Long-term Recall.
- Mood context (optional) — a mood may be linked to an entry.
- Private, personal, yours — by default and by design.

**Out of Scope:**
- Reading other people's journals — the Journal is strictly single-user, single-owner.
- AI writing *for* you — the AI synthesizes and notices; it never authors your entry.
- Sharing to social — no in-product feed, no peer comparison (NG6).
- Exporting for public posting — export is for personal use only (NG6).
- Turning reflections into tasks — no productivity pipeline; the Journal is not a to-do engine (NG10).

> Rule: if a request crosses from "your own, private, reflective" into "other
> people, AI-authored, public, or taskified," it is out of scope.

> **Gate decision:** Boundaries explicit; in-scope vs out-of-scope are locked.
> **Phase 1.9 passes.**

### What the Journal Will NEVER Become

This is the line we do not cross. Every future decision is measured against it.

The Journal will never become:

- **A therapy app** — it is a companion, not a clinician (NG1).
- **A diagnosis tool** — it never scores, labels, or infers a condition (NG2).
- **A mood tracker** — mood is optional context, not a daily rating log (NG9).
- **A social network** — no feed, no sharing, no peer comparison (NG6).
- **A productivity tool** — no tasks, streaks, or output metrics (NG10).
- **A replacement for human connection** — it complements, never substitutes (NG7).
- **AI writing for you** — the AI notices and synthesizes; it never authors
  your entry (Scope 1.9).
- **A sharing surface** — reflections stay private; export is personal use only (NG6).
- **A public-posting engine** — no broadcast, no public export path (Scope 1.9).
- **A task engine** — reflections are not turned into to-dos (NG10, Scope 1.9).

> If a proposed feature makes the Journal any of these, it is rejected at the gate.

### Deliverables of Phase 1 (Product DNA — all locked)

- [x] **Journal Philosophy** — why it exists, the emotional problem, retention why, AI role (Sprint 1.1).
- [x] **Product Vision** — a quiet, trusted space to know your own mind (Section 2).
- [x] **Product Principles** — P1–P9, including "AI augments, never replaces" (Section 4).
- [x] **Core Product Identity** — five permanent engineering rules (Sprint 1.2).
- [x] **User Journey** — open → write → save → AI understands → memory → reflection → timeline → return (Sprint 1.3).
- [x] **Product Pillars** — Write / Understand / Remember / Grow (Sprint 1.4).
- [x] **AI Role & Personality** — augments, never replaces; a noticing companion, not a prescriber (Sprint 1.1 Q4 + 1.5).
- [x] **Success Metrics** — behavior & trust, not feature counts (Sprint 1.6).
- [x] **Emotional Safety** — private by default, no human reading, calm crisis support, companion not crisis line (Sprint 1.7).
- [x] **Non-goals** — NG1–NG2, NG6–NG7, NG9–NG10: not therapy/diagnosis/mood-tracker/social/productivity/human-connection replacement (Section 6).
- [x] **Scope Boundaries** — in-scope (your own writing / reflection / memory) vs out-of-scope (others' journals, AI-authored, social, public export, tasks) (Sprint 1.9).
- [x] **Wireframe & UX Freeze** — 3 wireframes (Home/Editor/Detail) locked + 5-item UX Freeze (wireframe / navigation / section / component / interaction) passed (Sprint 1.10).

> **Phase 1 — Journal Foundation (Product DNA) is LOCKED.** All gates (1.1–1.10)
> passed. Downstream architecture, UI, and code must trace back to this document.

### Sprint 1.10 — Wireframe & UX Freeze (UX freeze gate)

**Objective:** Lock the primary screen layouts before UI architecture and code. This is the
UX freeze — layout, hierarchy, and labels are fixed here; visual styling comes later.

> Note: 3 wireframes planned (Home, Editor, Detail). All three are now
> locked below; the UX Freeze gate follows.

#### Wireframe 1 — Reflection / Journal Home (MOST IMPORTANT)

```
────────────────────────────
Reflection / Journal Home
────────────────────────────
Reflection               🔍

Good evening, NK
"Your thoughts matter."

[ + New Journal ]

📝 Continue Draft
Yesterday • 234 words

✨ AI Reflection
"I've noticed you've been feeling
more optimistic this week."

📖 Recent Journal
• Today
• Yesterday
• Monday

🧠 Memories
3 meaningful moments

📅 Timeline Preview
Today
Yesterday
Last Week
────────────────────────────
This is the screen users visit most.
```

**Why this is the most important screen:** It is the single surface users land on
most often. It must (a) make writing one tap away, (b) show the AI's gentle
presence (AI Reflection) without stealing focus, (c) surface continuity (Recent,
Memories, Timeline) so returning feels rewarding, and (d) never feel like a task.

#### Wireframe 2 — Journal Editor

*This is where writing happens. No distractions. Think Apple Notes meets Day One.*

Notes:
- Single focused composer; the AI is absent from this surface until save.
- Honors Sprint 1.3 ("Writing comes first. Analysis comes second.") and the
  sacred-writing rule — no AI chrome, no suggestions mid-type.
- Maps to the **Write** pillar (1.4).

#### Wireframe 3 — Journal Detail

*Read an old journal. Below it:*

- AI Reflection
- Memories extracted
- Mood
- Timeline
- Related entries

Notes:
- The user's own text is primary; AI output (Reflection, Memories) is secondary
  and stacked *below* the entry, never inline over the writing.
- "Related entries" + "Timeline" realize the **Grow** / continuity pillar (1.4).
- Maps to **Understand** (Reflection) + **Remember** (Memories) + **Grow** (Timeline).

#### UX Freeze — locked before Phase 2

Before any high-fidelity UI, these five dimensions are frozen:

- [x] **Wireframe** — Home (1), Editor (2), Detail (3) layouts locked.
- [x] **Navigation** — tab = Journal; in-feature stack (New → Detail →
  History/Search/Memories) per `JOURNAL_ARCHITECTURE.md` Step 3.
- [x] **Section hierarchy** — per screen, sections fixed (e.g., Detail =
  body → AI Reflection → Memories → Mood → Timeline → Related).
- [x] **Component hierarchy** — primitives fixed (`GlassCard`, `ScreenContainer`,
  `ReflectionInput`, `SearchField`, `GradientButton`, `BottomSheet`, `Modal`,
  `Toast`, `IconButton`, `SectionHeader`, `Badge`) per `JOURNAL_UI_ARCHITECTURE.md`.
- [x] **Interaction flow** — capture → save → async AI Analysis → Reflection /
  Memory / Timeline, with graceful degradation, per `JOURNAL_USER_FLOW.md`.

> Only after these five are frozen do we move into high-fidelity UI.

> **Gate decision:** All 3 wireframes locked and the 5-item UX Freeze passed.
> **Phase 1.10 passes.** (Numbered 1.10 to avoid colliding with 1.5
> Define the AI's Personality.)

### Sprint 1.0 — Product Architecture Gate (locked, carried forward)

This is the lock-in checkpoint for *why Reflection exists*. It is answered before any
downstream architecture, UI, or code. If the three Gate Review questions below are not
clear, the phase does not advance.

Reflection exists to help the user answer four questions in their own voice:

- **What happened today?**
- **How do I feel about it?**
- **What did I learn?**
- **What should I carry into tomorrow?**

It is **not** notes, a diary document, or chat history. It is a *structured emotional
checkpoint* — a private place to notice and record what is true right now, unscripted
by the app.

### Terminology — three pillars (do not conflate)

The product is built on three deliberately separate concepts:

- **Journal** — the *user-led* surface. Free writing the user owns and controls.
  Accent: **jouspace.purple** (user content).
- **Reflection** — the *AI-generated* output layer. Synthesis the AI produces **after**
  the user writes and saves: AI Summary, Emotional Patterns, Key Takeaways, Suggested
  Actions. It augments the user's voice; it never replaces it. Accent: **jouspace.cyan**
  (AI-associated surfaces).
- **Memory** — the *persistent memory engine* the Journal feeds and that powers the whole
  AI platform (Companion, recommendations, personalization). Surfaces as Important Moments,
  Preferences, and Long-term Recall (Pinecone `mem-<uid>`).

The user's writing is always the source of truth. Reflection and Memory are derived from
it and must degrade gracefully when the AI platform is unavailable.

### Reflection Purpose
Give the user a durable, private, low-pressure space to capture their own thoughts in
their own words, and to look back later so patterns in their thinking become visible to
them (not just to the AI). Reflection is the calm counterweight to Jouspace's structured
mood and exercise surfaces.

### User Goal
Get a passing thought, feeling, or moment out of their head and into a trusted place —
fast, with no setup and no required structure — and be able to find it again later.

### Success Criteria
| # | Criterion | Measurable bar |
|---|-----------|----------------|
| SC1 | Frictionless capture | From tab tap to saved reflection ≤ 2 minutes for a one-line entry; no setup, no mandatory fields. |
| SC2 | Durable archive | 100% of saved reflections persist and are retrievable by date or recency. |
| SC3 | Findable continuity | A returning user reaches any past reflection within 3 taps (recent list or search). |
| SC4 | No forced structure | Reflections save with title *or* body empty (matches `JournalService` validation). |
| SC5 | Graceful offline | Capture works without a connection; sync is background and invisible to the user. |
| SC6 | Non-gamified | Zero streaks/points/penalty mechanics present (audit-clean against NG4). |

### Gate Review (must be clear to proceed)

**Q1 — Why will users open Reflection?**
Because a thought, feeling, or moment is present and they want to get it out of their
head into a trusted, private place — without being prompted, scored, or guided. The
trigger is internal ("I need to put this somewhere"), not a notification. It is the
app's one space that asks nothing of them but their own words.

**Q2 — What problem does it solve?**
Jouspace can track mood (signal) and assign exercises (action), but gives users nowhere
to make sense of their own experience in their own voice. Reflection closes the
*continuity of self-understanding* gap: thoughts are captured instead of lost, and
become findable later so patterns (not just data points) emerge. It also feeds the AI
companion durable, user-authored context so future conversations don't restart from zero.

**Q3 — What action completes in under 2 minutes?**
Open Reflection (one tap from the tab) and save a single reflection — even a sentence —
via the composer. No required fields, no setup. Full action: *write what's true right
now, then tap save.* Under 2 minutes, every time, by design.

> **Gate decision:** All three answers are clear and consistent with the Goals (G1–G6)
> and Non-goals (NG1–NG8) below. **Phase 1 passes — proceed to downstream phases.**

---

## 1. Journal Purpose

**The Journal is the user's private, low-pressure space to notice and record what is
true for them right now — in their own words, unscripted by the app.** The user writes
freely; the AI later adds value through Reflection (synthesis) and Memory (recall) without
ever replacing the user's voice.

Jouspace already helps users *track* (mood) and *do* (CBT exercises, missions). Those
surfaces are structured and app-led. Reflection is the inverse: a user-led space where
the app steps back and simply holds the user's thoughts. Its job is not to guide,
diagnose, or instruct, but to give the user a reliable place to think out loud and
look back later.

Concretely, Reflection exists to:

- Give users a durable place to write freely (the "What's on your mind?" composer
  already lives on Home; Reflection is its dedicated home).
- Make those writings **findable over time** so patterns become visible to the user,
  not just to the AI.
- Close the loop between *feeling* (mood) and *meaning* (reflection): a mood tells you
  *what*; a reflection helps you understand *why*.
- Feed the AI companion's long-term memory with user-authored context, improving the
  relevance of future conversations without the user having to re-explain themselves.

Reflection is the connective tissue of the app: it sits between Mood (signal) and the
AI Companion (sense-making).

---

## 2. Vision

> **A quiet, trusted space where Jouspace users can think for themselves — and, over
> time, come to know their own minds better.**

We believe mental wellness software over-indexes on *prompts, scores, and nudges* and
under-indexes on *continuity of self-understanding*. Reflection is Jouspace's answer:
not another streak to protect or another task to complete, but a place that accumulates
the user's own voice so that progress is measured in clarity, not compliance.

In the long view, Reflection becomes the personal archive that makes Jouspace feel like
a companion that *remembers you* — not a chatbot that resets every session.

---

## 3. Core Philosophy

1. **The user owns the meaning.** Reflection is not a quiz. There are no right answers,
   no scored responses, and no "good job" for reflecting a certain way. The app holds
   the space; the user fills it.
2. **Low friction beats high structure.** The single most important property of
   Reflection is that it is *always one tap away* and *never requires setup*. If it
   feels like homework, it has failed.
3. **Privacy is the product.** Reflective writing is among the most intimate data a
   person produces. Reflection must be private by default, legible only to the user,
   and never weaponized for engagement metrics.
4. **Memory is a gift, not a surveillance tool.** Surfacing a past reflection should
   feel like a friend remembering something you said — not like being tracked.
5. **Reflection complements, never replaces, the human.** This is a self-awareness tool,
   explicitly not therapy, diagnosis, or crisis care.

---

## 4. Product Principles

These principles are the test we apply to every Reflection feature decision. If a
proposed capability violates one, it is out of scope (see Non-goals).

| # | Principle | What it means in practice |
|---|-----------|--------------------------|
| P1 | **Effortless capture** | Opening Reflection and writing the first word must take under a second. No templates forced, no mandatory fields. |
| P2 | **User-led structure** | Any structure (prompts, tags, moods) is *optional scaffolding* the user can ignore. The blank page is always valid. |
| P3 | **Time is the feature** | The primary value unlocks over weeks/months: seeing "what I was thinking" then vs. now. Design for the long arc, not the single session. |
| P4 | **Calm, not gamified** | No streaks, points, or guilt for not reflecting. Gentle re-entry ("Welcome back") instead of penalty. |
| P5 | **Legible to the user, not just the model** | Insights derived from reflections are shown *to the user* in plain language they can act on or dismiss. |
| P6 | **Private by default, portable by right** | Reflections are the user's data: exportable, deletable, and never used to manipulate engagement. |
| P7 | **Graceful offline** | Reflection capture works without a connection; sync is a background concern the user never has to think about. |
| P8 | **AI serves the writer** | When the AI touches a reflection, it does so to help the user reflect better (summarize, recall, gently prompt) — never to judge or advise clinically. |
| P9 | **AI augments, never replaces** | The user's writing is the source of truth. Reflection and Memory are derived *from* it and must degrade gracefully when the AI platform is unavailable; they never stand in for the user's own voice. |

---

## 5. Goals

### Primary goals (what success looks like)
- **G1 — Frictionless capture:** Users can open Reflection and save a thought in one
  motion, from Home or the dedicated Reflection tab.
- **G2 — A real archive:** Every reflection is durably stored, timestamped, and
  retrievable, replacing today's ephemeral composer-only flow with a persistent journal.
- **G3 — Visible continuity:** Users can look back — by date, recency, or theme — and
  see how their thinking has shifted.
- **G4 — Mood-to-meaning link:** A reflection can be attached to (or contextualized by)
  the day's mood, so feeling and narrative live together.
- **G5 — Companion memory:** With consent, reflection content enriches long-term memory
  so future AI conversations feel continuous and personal.
- **G6 — Trustworthy privacy:** Clear, simple controls for viewing, exporting, and
  deleting reflections, with privacy as the default state.

### Secondary goals (enablers)
- **G7 — Reusable foundation:** Reflection's data model, repository, and services are
  built so other surfaces (Home, AI Companion, Insights) can read reflections cleanly.
- **G8 — Performance & reliability:** Reflection list/detail loads fast and never blocks
  the rest of the Home screen if the journal backend is slow or unavailable.

---

## 6. Non-goals

Explicitly **out of scope** for Reflection. These are deliberate boundaries, not
deferred features.

- **NG1 — Not a therapy or coaching session.** Reflection does not deliver CBT, guided
  therapy, or clinical interventions. Those belong to the exercise/mission surfaces.
- **NG2 — Not a diagnostic tool.** Reflection never scores, labels, or infers a user's
  mental-health condition.
- **NG3 — No crisis handling in-product.** Reflection is not a place to detect or respond
  to crisis. Crisis protocol lives in the AI runtime, not here.
- **NG4 — No engagement gamification.** No streaks, leaderboards, reminders-as-nudges,
  or penalty mechanics tied to reflection activity.
- **NG5 — No forced structure.** We will not require prompts, tags, moods, or ratings to
  save a reflection. Optional aids only.
- **NG6 — No social or sharing surface.** Reflection is private by default; there is no
  in-product sharing, feed, or peer comparison. (Export for personal use is allowed.)
- **NG7 — Not a replacement for human connection or the AI Companion chat.**
  Reflection is writing; it complements, never substitutes, relationships or dialogue.
- **NG8 — No analytics on reflection *content* for product metrics.** We may measure
  *usage* (counts, latency) but never mine the semantic content of reflections for
  engagement optimization.
- **NG9 — Not a mood tracker.** Mood logging is a separate surface; the Journal is
  free writing, not a rating log or daily check-in grid.
- **NG10 — Not a productivity tool.** No tasks, streaks, output metrics, or "entries
  completed" gamification; the Journal measures clarity, not throughput.

---

## Summary (lock statement)

Journal is Jouspace's **private, user-led journaling space** — the calm counterweight
to the app's structured mood and exercise surfaces. It exists to let users capture
their own voice effortlessly and build a personal archive over time. After the user
writes, the AI adds value through **Reflection** (AI Summary, Emotional Patterns, Key
Takeaways, Suggested Actions) and feeds the **Memory** engine (Important Moments,
Preferences, Long-term Recall) that powers recommendations and a Companion that remembers
you — all while remaining strictly private, non-clinical, and free of engagement mechanics.

Any future Reflection work must be justified against this foundation. Changes to
Purpose, Vision, Philosophy, Principles, Goals, or Non-goals require an explicit
re-lock of this document.
