<!-- ══════════════════════════════════════════════════════════════════════════
     JOUSPACE — README
     Your thoughts, connected over time.
     ══════════════════════════════════════════════════════════════════════════ -->

<div align="center">

<a href="https://github.com/datascyther/Jouspace">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&color=0:0B1020,35:4F46E5,70:7C3AED,100:22D3EE&height=230&section=header&text=Jouspace&fontSize=84&fontColor=FFFFFF&fontAlignY=36&desc=Your%20thoughts,%20connected%20over%20time.&descSize=19&descAlignY=57&animation=fadeIn"
    alt="Jouspace — Your thoughts, connected over time."
  />
</a>

<br />

<img
  src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=600&size=21&pause=1100&color=8B5CF6&center=true&vCenter=true&width=760&lines=Write.+Remember.+Connect.+Reflect.;An+open-source%2C+AI-native+journal.;Journal+first.+AI+when+useful.;Your+history+stays+meaningful."
  alt="Write. Remember. Connect. Reflect."
/>

<br /><br />

**An open-source, AI-native journal for writing, remembering, connecting, and reflecting across your personal history.**

Jouspace brings journaling, contextual memory, mood, and AI-assisted reflection into one continuous space —
so what you write today can still be useful months from now.

<br />

<!-- ─────────────── PRIMARY BADGES ─────────────── -->

[![Stars](https://img.shields.io/github/stars/datascyther/Jouspace?style=for-the-badge&logo=github&logoColor=white&label=STARS&labelColor=0B1020&color=8B5CF6)](https://github.com/datascyther/Jouspace/stargazers)
[![Forks](https://img.shields.io/github/forks/datascyther/Jouspace?style=for-the-badge&logo=github&logoColor=white&label=FORKS&labelColor=0B1020&color=4F46E5)](https://github.com/datascyther/Jouspace/network/members)
[![Issues](https://img.shields.io/github/issues/datascyther/Jouspace?style=for-the-badge&logo=github&logoColor=white&label=ISSUES&labelColor=0B1020&color=22D3EE)](https://github.com/datascyther/Jouspace/issues)
[![License](https://img.shields.io/github/license/datascyther/Jouspace?style=for-the-badge&logo=opensourceinitiative&logoColor=white&label=LICENSE&labelColor=0B1020&color=10B981)](LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0B1020)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=61DAFB&labelColor=0B1020)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK-000020?style=for-the-badge&logo=expo&logoColor=white&labelColor=0B1020)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Data-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=0B1020)](https://supabase.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vectors-000000?style=for-the-badge&logo=pinecone&logoColor=white&labelColor=0B1020)](https://www.pinecone.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-F59E0B?style=for-the-badge&logo=git&logoColor=white&labelColor=0B1020)](https://github.com/datascyther/Jouspace/pulls)

<br />

<!-- ─────────────── NAV ─────────────── -->

### [ 🧭 Thesis ](#-the-product-thesis) · [ 🔁 Core Loop ](#-the-core-loop) · [ ✨ Experiences ](#-core-experiences) · [ 🏛 Architecture ](#-system-architecture) · [ 🧠 Memory ](#-memory-architecture) · [ 🚀 Quickstart ](#-getting-started) · [ 🗺 Roadmap ](#-roadmap) · [ ⭐ Star Graphs ](#-star-growth)

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png" alt="divider" width="100%" />

</div>

<br />

## 📖 Table of Contents

<table>
<tr>
<td valign="top" width="33%">

**Product**
- [Why Jouspace exists](#-why-jouspace-exists)
- [The product thesis](#-the-product-thesis)
- [The core loop](#-the-core-loop)
- [Core experiences](#-core-experiences)
- [What makes it different](#-what-makes-jouspace-different)
- [Design language](#-design-language)

</td>
<td valign="top" width="33%">

**Engineering**
- [Intelligence model](#-jouspace-intelligence-model)
- [Anatomy of a reflection](#-anatomy-of-a-reflection)
- [System architecture](#-system-architecture)
- [Memory architecture](#-memory-architecture)
- [Technology](#-technology)
- [Repository structure](#-repository-structure)

</td>
<td valign="top" width="33%">

**Community**
- [Getting started](#-getting-started)
- [Scripts](#-available-scripts)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Responsible AI](#-responsible-ai)
- [Star growth](#-star-growth)

</td>
</tr>
</table>

<br />

---

## 🌱 Why Jouspace Exists

<table>
<tr>
<td width="50%" valign="top">

### The archive problem

Most journals are excellent at **storing** thoughts.

The problem is that stored thoughts eventually become an *archive*.

Something you wrote three months ago may perfectly explain what you're thinking today — but conventional journaling software rarely understands that relationship.

</td>
<td width="50%" valign="top">

### The amnesia problem

AI chat has almost the opposite problem.

It can be genuinely useful in the moment, yet without meaningful continuity every conversation risks becoming another **isolated interaction**.

Yesterday's insight evaporates. The context resets. You start over.

</td>
</tr>
</table>

```text
   ┌───────────────────────────────┐          ┌───────────────────────────────┐
   │        TRADITIONAL JOURNAL    │          │        TRADITIONAL AI CHAT    │
   │                               │          │                               │
   │   Jan ▓                       │          │   session ▢ ▢ ▢ ▢ ▢ ▢ ▢       │
   │   Feb ▓                       │          │            ↑                  │
   │   Mar ▓   ← never revisited   │          │            └ no continuity    │
   │   Apr ▓                       │          │                               │
   │   May ▓                       │          │   "Remind me what we…"        │
   │        ↓                      │          │   → context not found         │
   │     the archive               │          │                               │
   └───────────────────────────────┘          └───────────────────────────────┘

                        ╭──────────────────────────────╮
                        │           JOUSPACE           │
                        │                              │
                        │  Jan ▓──┐                    │
                        │  Feb ▓──┼──▶ ⟨ context ⟩ ──┐ │
                        │  Mar ▓──┤                  │ │
                        │  Apr ▓──┘                  ▼ │
                        │  May ▓ ◀────── reflection ──┘ │
                        │                              │
                        │   history that stays useful  │
                        ╰──────────────────────────────╯
```

> **Jouspace explores what happens when those two ideas are combined.**
>
> It treats your writing, conversations, mood context, and reflections as parts of a *growing personal history*.
> Instead of making AI the center of the experience, Jouspace makes **your context** the center —
> and the AI exists as a reflective layer over it.

<br />

---

## 🧭 The Product Thesis

<div align="center">

<img src="https://img.shields.io/badge/THESIS-A%20personal%20space%20where%20writing%2C%20memory%2C%20mood%20%26%20AI%20context%20accumulate%20over%20time-8B5CF6?style=for-the-badge&labelColor=0B1020" alt="thesis" />

</div>

<br />

Jouspace is built around a single conviction:

> ### Personal software becomes more useful when it understands **continuity**.

<table>
<tr>
<td align="center" width="33%">

**📄**
### A journal entry
should not become irrelevant
the moment it leaves the top
of a timeline.

</td>
<td align="center" width="33%">

**💬**
### A conversation
should not automatically be
disconnected from everything
that came before it.

</td>
<td align="center" width="33%">

**🌤**
### A mood entry
should provide *context* —
not merely become another
point on a chart.

</td>
</tr>
</table>

<div align="center">

**Jouspace is designed to make accumulated history useful again.**

</div>

<br />

---

## 🔁 The Core Loop

```mermaid
flowchart LR
    A(["✍️ &nbsp;WRITE<br/><sub>capture freely</sub>"]) --> B(["🧠 &nbsp;REMEMBER<br/><sub>persist context</sub>"])
    B --> C(["🔗 &nbsp;CONNECT<br/><sub>surface relations</sub>"])
    C --> D(["🪞 &nbsp;REFLECT<br/><sub>see yourself</sub>"])
    D -. "new perspective" .-> A

    classDef node fill:#0B1020,stroke:#8B5CF6,stroke-width:2px,color:#E9E9FF,rx:14,ry:14;
    class A,B,C,D node;
```

<table>
<tr>
<th width="25%">✍️ Write</th>
<th width="25%">🧠 Remember</th>
<th width="25%">🔗 Connect</th>
<th width="25%">🪞 Reflect</th>
</tr>
<tr>
<td valign="top">

Capture thoughts freely.

Jouspace is designed around **freeform writing first**. AI prompts should support the writing process — never turn journaling into a questionnaire.

</td>
<td valign="top">

Preserve useful context across time.

Entries, conversations, and signals contribute to a **persistent personal context** instead of existing as disconnected records.

</td>
<td valign="top">

Find relationships across your history.

Past ideas, recurring themes, and emotional context become **discoverable again** exactly when they matter.

</td>
<td valign="top">

Use AI to examine your own context.

The goal is not to outsource thinking — it's to help you **look back with more context** than memory alone allows.

</td>
</tr>
</table>

<br />

---

## ✨ Core Experiences

<div align="center">

| | Surface | What it is | Role in the system |
|:--:|:--|:--|:--|
| 📓 | **Journal** | A persistent writing space built around freeform thought | The primary source of truth |
| 🤝 | **AI Companion** | Conversation connected to your broader context | User-initiated, context-aware |
| 🧠 | **Memory** | Persistent personal memory beyond chat history | Retrieval, not accumulation |
| 🔗 | **Connections** | Emergent relationships across your history | Discovery layer |
| 🌤 | **Mood Context** | A contextual signal, not the product itself | Enrichment |
| 🪞 | **Reflection** | Revisiting history with interpretation | Sits above raw storage |

</div>

<br />

<details>
<summary><b>📓 &nbsp;Journal — see the surface</b></summary>

<br />

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Jouspace ▸ Journal                                     ⌘K   ◐   ⚙︎      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Tuesday, 14 March                                    🌤 steady · 6/10  │
│   ────────────────────────────────────────────────────────────────────   │
│                                                                          │
│   I keep circling the same decision about the project scope. It          │
│   feels less like indecision and more like I haven't named what          │
│   I'm actually afraid of yet.▊                                           │
│                                                                          │
│                                                                          │
│   ╭─ 🔗 Related from your history ─────────────────────────────────╮     │
│   │  • 18 Nov — "scope creep and the fear of finishing"      82%  │     │
│   │  • 03 Jan — "I mistake preparation for progress"         74%  │     │
│   ╰────────────────────────────────────────────────────────────────╯     │
│                                                                          │
│   [ Save ]   [ 🪞 Reflect on this ]   [ 🤝 Ask companion ]               │
└──────────────────────────────────────────────────────────────────────────┘
```

Journal entries are **not disposable documents**. They become part of the historical context that makes future reflection more useful.

</details>

<details>
<summary><b>🤝 &nbsp;AI Companion — see the surface</b></summary>

<br />

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Jouspace ▸ Companion                              context: 4 sources ⓘ  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   you ▸  why do I keep stalling on this?                                 │
│                                                                          │
│   ◈ jouspace                                                             │
│     You've written about this shape of hesitation three times            │
│     since November. Each time it appeared right before a                 │
│     commitment became public rather than private.                        │
│                                                                          │
│     ╭ drawn from ─────────────────────────────────────────────╮          │
│     │ 📓 18 Nov entry   📓 03 Jan entry   🌤 Mar mood window   │          │
│     ╰──────────────────────────────────────────────────────────╯         │
│                                                                          │
│     Would it help to look at what changed the one time you               │
│     didn't stall?                                                        │
│                                                                          │
│   ▸ type a message…                                          [ send ]    │
└──────────────────────────────────────────────────────────────────────────┘
```

The companion is **primarily user-initiated** and cites the context it used.

</details>

<details>
<summary><b>🧠 &nbsp;Memory & Connections — see the surface</b></summary>

<br />

```text
   RELEVANCE MAP ─ query: "fear of finishing"

   18 Nov · scope creep            ████████████████████░░░░  0.82   📓
   03 Jan · preparation ≠ progress ██████████████████░░░░░░  0.74   📓
   27 Feb · companion thread       ████████████░░░░░░░░░░░░  0.51   💬
   09 Mar · mood dip window        ████████░░░░░░░░░░░░░░░░  0.34   🌤
   ─────────────────────────────────────────────────────────────────
   retrieved: 3 · discarded: 1 (below threshold)
```

**Retrieve what matters, when it matters.** Not every stored event deserves permanent attention.

</details>

<br />

---

## 🔍 What Makes Jouspace Different?

Jouspace is **not simply a journal with an AI chat box attached to it**. Its architecture is being developed around *longitudinal context*.

<div align="center">

| | 🗄 Conventional approach | ◈ Jouspace approach |
|:--:|:--|:--|
| **Entries** | Become an archive | Contribute to persistent context |
| **AI** | Reacts to the current prompt | Reasons over relevant historical context |
| **Mood** | Is treated as the product | Acts as supporting context |
| **Chat** | Is the primary experience | Exists across the broader product |
| **Memory** | Means chat history | Means useful personal context |
| **Engagement** | AI constantly tries to engage | User agency remains central |
| **Structure** | Journaling built around prompts | Freeform writing comes first |

</div>

<div align="center">

> ### The objective is not *more AI*. The objective is **better continuity**.

</div>

<br />

---

## 🪞 Jouspace Intelligence Model

<div align="center">

## Mirror first · Companion second · Scribe third

</div>

```mermaid
flowchart TB
    subgraph L1[" "]
        M["🪞 &nbsp;<b>MIRROR</b> — first<br/><sub>surface patterns, connections,<br/>contradictions, forgotten context</sub>"]
    end
    subgraph L2[" "]
        C["🤝 &nbsp;<b>COMPANION</b> — second<br/><sub>conversation that emerges from context,<br/>not from artificial personality</sub>"]
    end
    subgraph L3[" "]
        S["✒️ &nbsp;<b>SCRIBE</b> — third<br/><sub>organization, recall, summarization —<br/>without replacing the user's voice</sub>"]
    end

    M --> C --> S

    classDef a fill:#1E1B4B,stroke:#8B5CF6,stroke-width:2px,color:#EDE9FE,rx:12,ry:12;
    classDef b fill:#0B1020,stroke:#4F46E5,stroke-width:2px,color:#C7D2FE,rx:12,ry:12;
    classDef c fill:#0B1020,stroke:#22D3EE,stroke-width:2px,color:#A5F3FC,rx:12,ry:12;
    class M a
    class C b
    class S c
    style L1 fill:none,stroke:none
    style L2 fill:none,stroke:none
    style L3 fill:none,stroke:none
```

<br />

---

## 🔬 Anatomy of a Reflection

What actually happens between *"help me understand this"* and a grounded answer:

```mermaid
sequenceDiagram
    autonumber
    participant U as 🧑 User
    participant UI as 🖥 Experience Layer
    participant CA as 🧩 Context Assembly
    participant RT as 🔎 Retrieval
    participant VDB as 🧠 Vector Memory
    participant DB as 🗃 Application Data
    participant AI as ◈ AI Runtime

    U->>UI: Writes an entry / asks a question
    UI->>CA: Submit intent + current surface state
    CA->>DB: Fetch structured context (recent, mood, threads)
    CA->>RT: Request semantically relevant history
    RT->>VDB: Similarity search (scoped to user)
    VDB-->>RT: Candidate memories + scores
    RT-->>CA: Filtered, thresholded, ranked set
    CA->>AI: Minimal, relevant, attributable context window
    AI-->>UI: Response + source attribution
    UI-->>U: Reflection with visible provenance
    Note over CA,RT: Selective retrieval — not the entire history
```

<br />

---

## 🏛 System Architecture

Jouspace deliberately separates the **product experience** from the **intelligence** and **persistence** layers.

```mermaid
flowchart TB

    subgraph Experience["🖥 &nbsp;EXPERIENCE LAYER"]
        direction LR
        JOURNAL["📓 Journal"]
        CHAT["🤝 AI Companion"]
        MOOD["🌤 Mood Context"]
        REFLECTION["🪞 Reflection"]
    end

    subgraph Intelligence["◈ &nbsp;INTELLIGENCE LAYER"]
        direction LR
        RUNTIME["AI Runtime"]
        CONTEXT["Context Assembly"]
        RETRIEVAL["Context Retrieval"]
        MEMORY["Personal Memory"]
    end

    subgraph Data["🗃 &nbsp;DATA LAYER"]
        direction LR
        SUPABASE["Supabase<br/><sub>app data · auth</sub>"]
        PINECONE["Pinecone<br/><sub>vectors · semantics</sub>"]
        STORAGE["Persistent<br/>Application Data"]
    end

    JOURNAL --> CONTEXT
    CHAT --> RUNTIME
    MOOD --> CONTEXT
    REFLECTION --> CONTEXT

    RUNTIME --> CONTEXT
    CONTEXT --> RETRIEVAL
    RETRIEVAL --> MEMORY

    MEMORY --> PINECONE
    CONTEXT --> SUPABASE
    JOURNAL --> STORAGE

    RETRIEVAL --> RUNTIME
    RUNTIME --> CHAT
    RUNTIME --> REFLECTION

    classDef exp fill:#0B1020,stroke:#22D3EE,stroke-width:2px,color:#A5F3FC,rx:10,ry:10;
    classDef intel fill:#0B1020,stroke:#8B5CF6,stroke-width:2px,color:#DDD6FE,rx:10,ry:10;
    classDef data fill:#0B1020,stroke:#10B981,stroke-width:2px,color:#A7F3D0,rx:10,ry:10;

    class JOURNAL,CHAT,MOOD,REFLECTION exp
    class RUNTIME,CONTEXT,RETRIEVAL,MEMORY intel
    class SUPABASE,PINECONE,STORAGE data

    style Experience fill:#0B102055,stroke:#22D3EE44,stroke-width:1px
    style Intelligence fill:#0B102055,stroke:#8B5CF644,stroke-width:1px
    style Data fill:#0B102055,stroke:#10B98144,stroke-width:1px
```

> **The important distinction:** memory, retrieval, and generation are **separate concerns**.
> This makes it possible to retrieve relevant context *selectively*, instead of treating every previous
> interaction as permanent prompt baggage.

<br />

---

## 🧠 Memory Architecture

A useful personal AI system needs more than a long chat transcript. Conceptually, Jouspace treats memory as a **pipeline**.

```mermaid
flowchart LR
    A["🧑 User Activity<br/><sub>entries · chats · mood</sub>"] --> B["⚙️ Context Processing<br/><sub>normalize · chunk · embed</sub>"]
    B --> C["🗃 Persistent Data<br/><sub>structured, queryable</sub>"]
    B --> D["🧠 Retrievable Memory<br/><sub>semantic vectors</sub>"]
    C --> E["🧩 Context Assembly"]
    D --> F["🔎 Semantic Retrieval"]
    E --> G["◈ AI Runtime"]
    F --> G
    G --> H["🪞 Contextual Response<br/>/ Reflection"]

    classDef n fill:#0B1020,stroke:#8B5CF6,stroke-width:1.6px,color:#E9E9FF,rx:10,ry:10;
    class A,B,C,D,E,F,G,H n;
```

### How context budget is allocated

```mermaid
pie showData
    title Illustrative context window composition
    "Semantically retrieved history" : 38
    "Recent journal entries" : 24
    "Active conversation" : 18
    "Mood / temporal signals" : 12
    "System framing" : 8
```

<div align="center">

> ### Retrieve what matters, **when** it matters.
> Not every stored event deserves permanent attention.

</div>

<br />

---

## 🎨 Design Language

The Jouspace surface is intentionally quiet: **ink-dark canvas, low-noise typography, one accent of intelligence.**

<div align="center">

![Ink](https://img.shields.io/badge/Ink-%230B1020-0B1020?style=for-the-badge&labelColor=0B1020)
![Indigo](https://img.shields.io/badge/Indigo-%234F46E5-4F46E5?style=for-the-badge&labelColor=4F46E5)
![Violet](https://img.shields.io/badge/Violet-%238B5CF6-8B5CF6?style=for-the-badge&labelColor=8B5CF6)
![Cyan](https://img.shields.io/badge/Signal-%2322D3EE-22D3EE?style=for-the-badge&labelColor=22D3EE)
![Mint](https://img.shields.io/badge/Calm-%2310B981-10B981?style=for-the-badge&labelColor=10B981)
![Paper](https://img.shields.io/badge/Paper-%23E9E9FF-E9E9FF?style=for-the-badge&labelColor=E9E9FF)

</div>

| Principle | In practice |
|:--|:--|
| **Quiet canvas** | Nothing competes with the sentence you're writing |
| **Provenance visible** | Whenever AI uses your history, the source is shown |
| **Motion with meaning** | Transitions signal continuity, never decoration |
| **Type as texture** | A single serif/mono pairing carries the whole surface |
| **Accessible by default** | Contrast, focus rings, and reduced-motion are requirements |

<br />

---

## 🛠 Technology

Jouspace is being built as a **full-stack AI product**, not a thin interface around a model API.

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,tailwind,vite,nodejs,supabase,expo,vitest,git,github&theme=dark&perline=10" alt="tech stack" />

</div>

<table>
<tr>
<th width="34%">🖥 Application</th>
<th width="33%">🧠 Data & Intelligence</th>
<th width="33%">🧪 Engineering</th>
</tr>
<tr>
<td valign="top">

- **React 19** — primary web UI
- **React Native** — cross-platform architecture
- **Expo** — native tooling
- **TypeScript** — type-safe development
- **Vite** — dev server & production builds
- **NativeWind / Tailwind** — UI styling
- **Zustand** — client state
- **TanStack Query** — server-state

</td>
<td valign="top">

- **Supabase** — application data & auth
- **Pinecone** — vector retrieval & semantic memory
- **LLM runtime** — contextual generation & reflection
- **RAG** — selective retrieval of relevant context

</td>
<td valign="top">

- **Vitest** — unit & integration testing
- **Zod** — runtime validation
- **GitHub** — source control & collaboration
- Incremental, verify-before-commit workflow

</td>
</tr>
</table>

<br />

---

## 🗂 Repository Structure

The project is evolving, but the repository broadly separates product surfaces, shared logic, backend infrastructure, AI services, and supporting scripts.

```text
Jouspace/
│
├── 📁 src/                 # Web application and shared product code
├── 📁 app/                 # Application routes / experiences
├── 📁 components/          # Reusable interface components
├── 📁 backend/             # Backend and AI infrastructure
├── 📁 scripts/             # Development and infrastructure utilities
├── 📁 docs/                # Technical and product documentation
├── 📁 public/              # Public assets
│
├── 📄 package.json
└── 📄 README.md
```

> ℹ️ The exact structure may evolve as the Jouspace migration and architecture continue to mature.

<br />

---

## 🚀 Getting Started

<div align="center">

![Step 1](https://img.shields.io/badge/1-Prerequisites-0B1020?style=for-the-badge&labelColor=4F46E5)
![Step 2](https://img.shields.io/badge/2-Clone-0B1020?style=for-the-badge&labelColor=6D28D9)
![Step 3](https://img.shields.io/badge/3-Install-0B1020?style=for-the-badge&labelColor=7C3AED)
![Step 4](https://img.shields.io/badge/4-Configure-0B1020?style=for-the-badge&labelColor=8B5CF6)
![Step 5](https://img.shields.io/badge/5-Run-0B1020?style=for-the-badge&labelColor=22D3EE)

</div>

### Prerequisites

![Node](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=0B1020)
![npm](https://img.shields.io/badge/npm-latest-CB3837?style=flat-square&logo=npm&logoColor=white&labelColor=0B1020)
![Git](https://img.shields.io/badge/Git-any-F05032?style=flat-square&logo=git&logoColor=white&labelColor=0B1020)

```bash
node --version   # v20+
npm --version
git --version
```

### 1 · Clone the repository

```bash
git clone https://github.com/datascyther/Jouspace.git
cd Jouspace
```

### 2 · Install dependencies

```bash
npm install
```

### 3 · Configure the environment

Jouspace relies on external services for parts of its data and intelligence infrastructure.
Create your local environment configuration from the templates and documentation in the repository.

> ⚠️ **Never commit secrets or API keys to source control.**

### 4 · Run the web application

```bash
npm run dev        # start the Vite development server
npm run build      # create a production build
npm run preview    # preview the production build
```

<details>
<summary><b>📱 &nbsp;Running the native app (Expo)</b></summary>

<br />

```bash
npm run dev:expo   # start the Expo development environment
npm run android    # run on Android
npm run ios        # run on iOS
npm run web:expo   # Expo web target
```

</details>

<details>
<summary><b>🧠 &nbsp;Initializing memory & retrieval infrastructure</b></summary>

<br />

```bash
npm run rag:ingest          # run the RAG ingestion workflow
npm run pinecone:describe   # inspect Pinecone configuration
npm run pinecone:stats      # inspect index statistics
```

</details>

<br />

---

## ⚡ Available Scripts

| Command | Purpose |
|:--|:--|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production web build |
| `npm run preview` | Preview the production build |
| `npm run test` | Run the test suite |
| `npm run test:integration` | Run backend integration tests |
| `npm run dev:expo` | Start the Expo development environment |
| `npm run android` | Run the Android application |
| `npm run ios` | Run the iOS application |
| `npm run web:expo` | Start the Expo web target |
| `npm run rag:ingest` | Run the RAG ingestion workflow |
| `npm run pinecone:describe` | Inspect Pinecone configuration |
| `npm run pinecone:stats` | Inspect Pinecone index statistics |

<br />

---

## 🧱 Product Principles

Seven constraints that shape both product and engineering decisions.

<table>
<tr>
<td width="50%" valign="top">

**01 · Journal first**
Writing should remain useful without requiring an AI interaction.

**02 · Context over conversation volume**
A system that remembers meaningfully doesn't need to talk constantly.

**03 · User agency**
The AI should not manufacture engagement merely because it can.

**04 · Memory should be selective**
More stored information does not automatically produce better intelligence. *Relevant* retrieval matters more than *maximum* retrieval.

</td>
<td width="50%" valign="top">

**05 · AI should support reflection**
Jouspace should help you think *with* your own history — not attempt to think *for* you.

**06 · Mood is context**
Mood can enrich understanding without turning Jouspace into a mood-tracking product.

**07 · Privacy is architectural**
Personal context is unusually sensitive data. Privacy, ownership, retrieval boundaries, and secure handling are **engineering concerns**, not marketing copy.

</td>
</tr>
</table>

<br />

---

## 🚫 What Jouspace Is Not

<div align="center">

![Not a therapist](https://img.shields.io/badge/✕-not%20a%20therapist-EF4444?style=for-the-badge&labelColor=0B1020)
![Not medical](https://img.shields.io/badge/✕-not%20a%20medical%20device-EF4444?style=for-the-badge&labelColor=0B1020)
![Not diagnostic](https://img.shields.io/badge/✕-not%20diagnostic-EF4444?style=for-the-badge&labelColor=0B1020)
![Not crisis care](https://img.shields.io/badge/✕-not%20crisis%20intervention-EF4444?style=for-the-badge&labelColor=0B1020)
![Not healthcare](https://img.shields.io/badge/✕-not%20a%20healthcare%20replacement-EF4444?style=for-the-badge&labelColor=0B1020)
![Not autonomous](https://img.shields.io/badge/✕-not%20an%20autonomous%20decision--maker-EF4444?style=for-the-badge&labelColor=0B1020)
![Not dependency](https://img.shields.io/badge/✕-not%20built%20for%20emotional%20dependency-EF4444?style=for-the-badge&labelColor=0B1020)

</div>

Jouspace is an **experimental open-source AI product** focused on journaling, personal context, memory, and reflection.
If you are in crisis, please contact local emergency services or a qualified professional.

<br />

---

## 📊 Project Status

> **Jouspace is under active development.** The project is evolving from an earlier product direction into the Jouspace architecture and identity.

```text
CONVERSATIONAL AI          ████████████████████░░░░   built · refining
CONTEXTUAL RETRIEVAL       ██████████████████░░░░░░   built · refining
PERSONAL MEMORY            ██████████████░░░░░░░░░░   in progress
JOURNALING SURFACE         ████████████████░░░░░░░░   in progress
MOOD HISTORY               ██████████████████░░░░░░   foundation done
AUTHENTICATION             ██████████████████████░░   stable
APP INFRASTRUCTURE         ████████████████████░░░░   stable
CROSS-PLATFORM UI          ████████████░░░░░░░░░░░░   maturing
AI ORCHESTRATION           ████████████████░░░░░░░░   in progress
IDENTITY MIGRATION         ██████████░░░░░░░░░░░░░░   underway
```

Current work focuses on **integrating existing systems around the new product thesis** — not rebuilding the application for the sake of a rebrand.

> ⚠️ APIs, interfaces, architecture, and product behavior may change while the project matures.

<br />

---

## 🗺 Roadmap

```mermaid
gantt
    title Jouspace — outcome-oriented roadmap
    dateFormat  YYYY-MM-DD
    axisFormat  %b

    section Foundation
    Product thesis & journal-first direction   :done,    f1, 2024-11-01, 60d
    Conversational AI foundation               :done,    f2, 2024-12-01, 75d
    Contextual retrieval infrastructure        :done,    f3, 2025-01-01, 70d
    Persistent data infrastructure             :done,    f4, 2025-01-15, 60d
    Mood history foundation                    :done,    f5, 2025-02-01, 45d

    section Jouspace Identity
    Identity migration                         :active,  i1, 2025-03-01, 70d
    Journal experience refinement              :active,  i2, 2025-03-15, 80d

    section Continuity
    Journal history → contextual memory        :         c1, 2025-05-01, 70d
    Longitudinal retrieval quality             :         c2, 2025-06-01, 70d
    Connection discovery                       :         c3, 2025-07-01, 80d
    Expanded reflection experiences            :         c4, 2025-08-01, 70d

    section Trust & Scale
    Privacy and data controls                  :         t1, 2025-06-15, 90d
    Automated evaluation & testing             :         t2, 2025-07-15, 90d
    Mature cross-platform experience           :         t3, 2025-09-01, 90d
```

<details>
<summary><b>✅ &nbsp;Roadmap as a checklist</b></summary>

<br />

- [x] Establish Jouspace product thesis
- [x] Define journal-first product direction
- [x] Build conversational AI foundation
- [x] Build contextual retrieval infrastructure
- [x] Establish persistent data infrastructure
- [x] Implement mood history foundation
- [ ] Complete Jouspace identity migration
- [ ] Refine journal experience
- [ ] Connect journal history to contextual memory
- [ ] Improve longitudinal retrieval
- [ ] Develop connection discovery
- [ ] Expand reflection experiences
- [ ] Strengthen privacy and data controls
- [ ] Expand automated evaluation and testing
- [ ] Mature cross-platform experience

</details>

> The roadmap is intentionally **outcome-oriented**. Features may change as the underlying product model is tested.

<br />

---

## 🧭 Engineering Philosophy

```mermaid
flowchart LR
    O["🎯 Objective"] --> I["⌨️ Implement"] --> V["🔍 Verify"] --> T["🧪 Test"] --> C["📦 Commit"] --> N["➡️ Continue"]
    N -.-> O

    classDef s fill:#0B1020,stroke:#22D3EE,stroke-width:2px,color:#A5F3FC,rx:12,ry:12;
    class O,I,V,T,C,N s;
```

Large architectural rewrites are avoided when existing engineering can be evolved safely.

The repository is intended to document not only the final product, but also **the engineering decisions required to build a context-aware AI application responsibly.**

<br />

---

## 🤝 Contributing

Contributions, technical discussion, bug reports, and thoughtful product feedback are genuinely welcome.

<details open>
<summary><b>Development workflow</b></summary>

<br />

```bash
# 1 · Fork, then branch
git checkout -b feature/your-feature

# 2 · Make your changes, then verify
npm run test
npm run build

# 3 · Commit with a clear, conventional message
git commit -m "feat: describe your change"

# 4 · Push and open a Pull Request
git push origin feature/your-feature
```

Your PR description should explain:

| | |
|:--|:--|
| **What** | changed |
| **Why** | it changed |
| **How** | it was tested |
| **Impact** | any architectural implications |

</details>

### Contribution principles

<div align="center">

![correctness](https://img.shields.io/badge/correctness-8B5CF6?style=flat-square&labelColor=0B1020)
![privacy](https://img.shields.io/badge/privacy-8B5CF6?style=flat-square&labelColor=0B1020)
![maintainability](https://img.shields.io/badge/maintainability-8B5CF6?style=flat-square&labelColor=0B1020)
![accessibility](https://img.shields.io/badge/accessibility-8B5CF6?style=flat-square&labelColor=0B1020)
![type%20safety](https://img.shields.io/badge/type%20safety-8B5CF6?style=flat-square&labelColor=0B1020)
![testability](https://img.shields.io/badge/testability-8B5CF6?style=flat-square&labelColor=0B1020)
![clear%20behavior](https://img.shields.io/badge/clear%20product%20behavior-8B5CF6?style=flat-square&labelColor=0B1020)
![minimal%20complexity](https://img.shields.io/badge/minimal%20complexity-8B5CF6?style=flat-square&labelColor=0B1020)

</div>

> For substantial architectural changes, please open an issue for discussion **before** implementation.

<br />

---

## 🔐 Security

> **Do not report security vulnerabilities through public GitHub issues.**

- Sensitive credentials, API keys, private user information, environment files, and production secrets must **never** be committed.
- When working with Jouspace's memory and context systems, assume that stored personal information **is** sensitive and design accordingly.
- Retrieval must always be scoped to the owning user. Cross-user leakage is treated as a critical defect.

<br />

---

## ⚖️ Responsible AI

Jouspace deals with personal writing and contextual information, which creates responsibilities beyond ordinary application development.

<table>
<tr>
<td width="50%" valign="top">

- AI-generated output should **not** be presented as objective truth
- Historical context can be incomplete or misinterpreted
- Retrieved memories should remain **attributable** to user context where practical
- AI should avoid pretending to possess human memory or emotions

</td>
<td width="50%" valign="top">

- User control takes priority over artificial engagement
- Sensitive personal context should be retrieved **only when relevant**
- The product should remain transparent about what AI can and cannot infer
- Reflection is offered, never imposed

</td>
</tr>
</table>

<div align="center">

> ### The objective is not to create an artificial person.
> ### It is to build better software for working with personal context.

</div>

<br />

---

## ⭐ Star Growth

If Jouspace is useful to you, starring the repository helps other developers discover the project — and gives us a pleasantly primitive but highly effective signal that someone on the internet cared.

<div align="center">

<a href="https://star-history.com/#datascyther/Jouspace&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=datascyther/Jouspace&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=datascyther/Jouspace&type=Date" />
    <img alt="Jouspace star history over time" src="https://api.star-history.com/svg?repos=datascyther/Jouspace&type=Date" width="82%" />
  </picture>
</a>

<br /><br />

<details>
<summary><b>📈 &nbsp;More star & growth visualizations</b></summary>

<br />

**Cumulative stargazers (Starchart)**

<a href="https://starchart.cc/datascyther/Jouspace">
  <img src="https://starchart.cc/datascyther/Jouspace.svg?variant=adaptive" width="82%" alt="Jouspace cumulative star chart" />
</a>

<br /><br />

**Repository pulse — commits, issues, PRs & contributors**

<a href="https://github.com/datascyther/Jouspace/pulse">
  <img
    src="https://repobeats.axiom.co/api/embed/cb8141bad522d4520e16d0352226c793b6372251.svg"
    width="92%"
    alt="Repobeats analytics for Jouspace — commits, issues, pull requests and contributors"
  />
</a>

<br /><br />

**Contribution activity graph**

<img src="https://github-readme-activity-graph.vercel.app/graph?username=datascyther&repo=Jouspace&theme=react-dark&bg_color=0B1020&color=8B5CF6&line=22D3EE&point=FFFFFF&hide_border=true&area=true" width="92%" alt="Jouspace commit activity graph" />

</details>

<br />

<a href="https://github.com/datascyther/Jouspace/stargazers">
  <img src="https://img.shields.io/badge/⭐%20Star%20Jouspace-Support%20the%20project-8B5CF6?style=for-the-badge&labelColor=0B1020" alt="Star Jouspace" />
</a>

</div>

<br />

---

## 📡 Repository Activity

<div align="center">

[![Stars](https://img.shields.io/github/stars/datascyther/Jouspace?style=for-the-badge&logo=github&label=STARS&labelColor=0B1020&color=8B5CF6)](https://github.com/datascyther/Jouspace/stargazers)
[![Forks](https://img.shields.io/github/forks/datascyther/Jouspace?style=for-the-badge&logo=github&label=FORKS&labelColor=0B1020&color=4F46E5)](https://github.com/datascyther/Jouspace/network/members)
[![Issues](https://img.shields.io/github/issues/datascyther/Jouspace?style=for-the-badge&logo=github&label=ISSUES&labelColor=0B1020&color=22D3EE)](https://github.com/datascyther/Jouspace/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/datascyther/Jouspace?style=for-the-badge&logo=github&label=PULL%20REQUESTS&labelColor=0B1020&color=10B981)](https://github.com/datascyther/Jouspace/pulls)

[![Last commit](https://img.shields.io/github/last-commit/datascyther/Jouspace?style=flat-square&logo=git&logoColor=white&label=last%20commit&labelColor=0B1020&color=8B5CF6)](https://github.com/datascyther/Jouspace/commits)
[![Commit activity](https://img.shields.io/github/commit-activity/m/datascyther/Jouspace?style=flat-square&label=commits%2Fmonth&labelColor=0B1020&color=4F46E5)](https://github.com/datascyther/Jouspace/pulse)
[![Code size](https://img.shields.io/github/languages/code-size/datascyther/Jouspace?style=flat-square&label=code%20size&labelColor=0B1020&color=22D3EE)](https://github.com/datascyther/Jouspace)
[![Top language](https://img.shields.io/github/languages/top/datascyther/Jouspace?style=flat-square&label=top%20language&labelColor=0B1020&color=10B981)](https://github.com/datascyther/Jouspace)
[![Contributors](https://img.shields.io/github/contributors/datascyther/Jouspace?style=flat-square&label=contributors&labelColor=0B1020&color=F59E0B)](https://github.com/datascyther/Jouspace/graphs/contributors)

<br />

### 👥 Contributors

<a href="https://github.com/datascyther/Jouspace/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=datascyther/Jouspace" alt="Jouspace contributors" />
</a>

</div>

<br />

---

## ❓ FAQ

<details>
<summary><b>Is my journal data sent to an AI model on every request?</b></summary>
<br />
No. Context is <i>assembled selectively</i>. Retrieval is thresholded and ranked, and only relevant, scoped context reaches the model. Maximum retrieval is explicitly an anti-goal.
</details>

<details>
<summary><b>Can I use Jouspace purely as a journal, with no AI?</b></summary>
<br />
Yes — that is principle #1. Writing must remain useful without any AI interaction. AI is a layer <i>over</i> your context, never a gate in front of it.
</details>

<details>
<summary><b>How is this different from an AI chatbot with long-term memory?</b></summary>
<br />
Chat is one surface, not the product. Jouspace's center of gravity is your writing and the accumulated context around it — journal, mood, reflections, and connections — with chat as one of several ways to interrogate that history.
</details>

<details>
<summary><b>Is mood tracking required?</b></summary>
<br />
No. Mood is a contextual signal that enriches retrieval and reflection. Jouspace is deliberately not a mood-tracking product.
</details>

<details>
<summary><b>Is Jouspace production-ready?</b></summary>
<br />
Not yet. It is under active development and migrating from an earlier product direction. Expect interfaces and behavior to change.
</details>

<br />

---

## 📜 License

This project is licensed under the terms provided in the repository's [**LICENSE**](LICENSE) file.

Please review the license before redistributing, modifying, or incorporating Jouspace into another project.

<br />

---

<div align="center">

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png" alt="divider" width="100%" />

<br />

# Jouspace

### ✍️ Write → 🧠 Remember → 🔗 Connect → 🪞 Reflect

**Your thoughts should become more useful with time — not disappear into an archive.**

<br />

[![Repository](https://img.shields.io/badge/Repository-0B1020?style=for-the-badge&logo=github&logoColor=white)](https://github.com/datascyther/Jouspace)
[![Issues](https://img.shields.io/badge/Issues-0B1020?style=for-the-badge&logo=github&logoColor=white)](https://github.com/datascyther/Jouspace/issues)
[![Pull Requests](https://img.shields.io/badge/Pull%20Requests-0B1020?style=for-the-badge&logo=github&logoColor=white)](https://github.com/datascyther/Jouspace/pulls)
[![Discussions](https://img.shields.io/badge/Discussions-0B1020?style=for-the-badge&logo=github&logoColor=white)](https://github.com/datascyther/Jouspace/discussions)

<br />

Built in public as an open-source exploration of **AI, memory, personal context, and reflective software.**

<br />

<img
  src="https://capsule-render.vercel.app/api?type=waving&color=0:22D3EE,30:7C3AED,65:4F46E5,100:0B1020&height=140&section=footer"
  alt="footer"
/>

</div>
