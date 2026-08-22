<div align="center">

<br />

<img src="public/app-icon.svg" alt="Jouspace Logo" width="100" height="100" />

# Jouspace

### *A private sanctuary for your thoughts — augmented by mindful intelligence.*

<p align="center">
  <strong>100% Local-First</strong> &nbsp;•&nbsp;
  <strong>Zero Cloud Database</strong> &nbsp;•&nbsp;
  <strong>NVIDIA NIM Intelligence</strong> &nbsp;•&nbsp;
  <strong>Stateless Edge SSE</strong> &nbsp;•&nbsp;
  <strong>Android & PWA</strong>
</p>

<br />

[![CI Status](https://img.shields.io/badge/CI-passing-2ea44f?style=for-the-badge&logo=githubactions&logoColor=white&labelColor=16161A)](https://github.com/datascyther/Jouspace/actions)
[![Release Version](https://img.shields.io/badge/version-1.1.0--beta.2-6C4DCA?style=for-the-badge&labelColor=16161A)](https://github.com/datascyther/Jouspace/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-3DDC84?style=for-the-badge&labelColor=16161A)](LICENSE)
[![Android Release](https://img.shields.io/badge/Android-Release%20APK-3DDC84?style=for-the-badge&logo=android&logoColor=white&labelColor=16161A)](https://github.com/datascyther/Jouspace/releases)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-6C4DCA?style=for-the-badge&logo=pwa&logoColor=white&labelColor=16161A)](https://jouspace.pages.dev)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=16161A)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black&labelColor=16161A)](https://react.dev/)

<br />

<table align="center">
  <tr>
    <td>
      <a href="https://github.com/datascyther/Jouspace/releases"><strong>📱 Download Android APK</strong></a>
    </td>
    <td>
      <a href="#-quick-start"><strong>⚡ Quick Start</strong></a>
    </td>
    <td>
      <a href="#-architecture--privacy-boundary"><strong>🏗️ Architecture</strong></a>
    </td>
    <td>
      <a href="#-ai-capabilities--api-reference"><strong>🧠 AI Capabilities</strong></a>
    </td>
    <td>
      <a href="#-design-system--typography"><strong>🎨 Design System</strong></a>
    </td>
  </tr>
</table>

<br />

<blockquote>
  <p align="center">
    <em>“Writing in a journal gives me a place to report, interpret, argue, reflect, save, question, predict, unload, praise, compare, cry, laugh, draw, paint, and remember.”</em>
    <br />
    <strong>— Luci Swindoll</strong>
  </p>
</blockquote>

<br />

</div>

---

## 🌿 The Jouspace Philosophy

In an era where digital tools monetize personal vulnerability and cloud databases present continuous privacy risks, **Jouspace** was created as a sovereign, quiet sanctuary. 

It is a local-first, account-free journal engineered with obsessive attention to editorial typography, paper-grade aesthetics, and absolute user sovereignty. Everything you write stays strictly inside your personal device sandbox. 

When you desire insight, clarity, or perspective, Jouspace summons an on-demand, conversational intelligence powered by **NVIDIA NIM** and **Cloudflare Workers**. The runtime streams nuanced, multi-entry reflections and cognitive connections over real-time SSE without retaining, logging, or storing a single word on the cloud.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│   🔒 100% Local-First       🧠 Zero-Retention AI       ✍️ Editorial Warmth     📲 True PWA  │
│   Your device is the vault.  Stateless inference only.  Playfair + Inter typography. & APK. │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Highlights

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🛡️ Sovereign Privacy by Default</h3>
      <p>Your journal never leaves your physical hardware. No account is required to write, reflect, or explore. Entries reside in local storage, isolated within your browser or native device container. No tracking, no behavioral profiling, no cloud databases.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🧠 Stateless AI Intelligence</h3>
      <p>Powered by high-throughput <strong>NVIDIA NIM</strong> models. Conversational Q&amp;A, Socratic reflection prompts, thematic summarization, and memory thread synthesis — streamed in real-time with zero server-side data retention.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>✍️ Contemplative Composer</h3>
      <p>A distraction-free canvas tuned for deep focus. Features subtle ambient background tinting driven by emotional sentiment, responsive pause prompts, ambient whispers, and instant draft auto-recovery.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🧵 Organic Memory Threads</h3>
      <p>Entries naturally connect into contextual themes. Search, filter, and rediscover forgotten insights across weeks, months, or years with rapid on-device indexing and thematic clustering.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🌓 Luminance-Engineered Aesthetics</h3>
      <p>Meticulously tuned paper-textured light mode and anti-glare dark mode. Zero arbitrary hex colors — mathematically calibrated luminance curves prevent center-blooming and eliminate nighttime eye fatigue.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📲 Offline PWA & Native Android</h3>
      <p>Installs instantly from any browser as an offline-first Single-Page App or runs as a native Android app via Capacitor with hardware-level notification scheduling, signed release keys, and offline voice dictation.</p>
    </td>
  </tr>
</table>

---

## 🏗️ Architecture & Privacy Boundary

Jouspace enforces a strict **zero-knowledge privacy boundary**. The intelligence runtime is completely stateless: it holds no persistent storage, no database, and no user records.

```
                       📱 USER DEVICE (Client Sovereign)
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                                                                         │
 │   React 19 + TypeScript  ──►  useJournalStore  ──►  Local Storage       │
 │   (Offline PWA / Native APK)                         (Encrypted Vault)  │
 │              │                                                          │
 │              ▼                                                          │
 │   useJouspaceIntelligence (SSE Client)                                 │
 └──────────────┬──────────────────────────────────────────────────────────┘
                │  🔒 HTTPS POST (Stateless Payload: Prompt + Local Entries)
                ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │        ⚡ STATELESS INTELLIGENCE RUNTIME (Cloudflare Edge / Express)    │
 │                                                                         │
 │   Zod Schema Validation                                                 │
 │          │                                                              │
 │          ▼                                                              │
 │   ContextAssembler (In-memory aggregation of client-sent entries)       │
 │          │                                                              │
 │          ▼                                                              │
 │   PromptAssembler (Jouspace psychological & reflective directives)      │
 │          │                                                              │
 │          ▼                                                              │
 │   NvidiaGateway (OpenAI-compatible NVIDIA NIM Orchestrator)             │
 │          │                                                              │
 │          ▼                                                              │
 │   StreamController ──► [Server-Sent Events (SSE)] ──► Realtime Client  │
 └─────────────────────────────────────────────────────────────────────────┘
                │  🌐 Ephemeral API Request (Zero Storage / Zero Logging)
                ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   ☁️ NVIDIA NIM INFERENCE ENGINE                        │
 └─────────────────────────────────────────────────────────────────────────┘
```

### Core Packages & Modules

| Workspace / Package | Technology | Role & Invariants |
|---|---|---|
| **Frontend** (`/`) | React 19 · TypeScript 5.9 · Vite 7 · Tailwind 4 | Builds to a self-contained bundle (`dist/index.html`). Manages on-device storage, encryption, themes, focus traps, and speech recognition. |
| **Edge Runtime** (`worker/`) | Cloudflare Workers · Web Streams · Zod | Globally distributed edge server providing zero-cold-start SSE streaming for production web and mobile deployments. |
| **Node Runtime** (`server/`) | Express 4 · tsx · NVIDIA SDK | Lightweight Node.js runtime twin for local development, dockerization, and self-hosted server deployments. |
| **Android Shell** (`android/`) | Capacitor 6 · Java/Gradle · Keystore | Committed native platform layer with permanent RSA 2048 release signing and hardware-level notification scheduling. |

---

## 🧠 AI Capabilities & API Reference

All AI endpoints communicate via **Server-Sent Events (SSE)**. The client supplies the conversation history and entry context in the request payload; the server returns streamed Markdown tokens.

```
POST /api/ai/:capability
Accept: text/event-stream
Content-Type: application/json
```

| Capability Endpoint | Method | Description | Primary Use Case |
|---|---|---|---|
| `/api/ai/chat` | `POST` | Conversational companion with context over selected entries | Deep exploratory dialogue across personal timeline |
| `/api/ai/reflect` | `POST` | Targeted reflective inquiries grounded in journal themes | Socratic guidance to unpack emotional roadblocks |
| `/api/ai/insight` | `POST` | Autonomous pattern discovery and thematic cards | Discover recurring topics, gratitude, and personal growth |
| `/api/ai/summarize` | `POST` | Concise distillation of long entries or memory threads | Structured executive summary and actionable takeaways |
| `/api/health` | `GET` | Diagnostic status check & runtime connectivity verification | Health check (`{"status":"ok","runtime":"jouspace-intelligence"}`) |

<details>
<summary><strong>🔍 Click to view Sample Request &amp; SSE Stream Payload</strong></summary>

<br />

#### Request Payload
```json
{
  "messages": [
    { "role": "user", "content": "What patterns have emerged in my reflections this week?" }
  ],
  "entries": [
    {
      "id": "entry-101",
      "title": "Quiet Morning",
      "content": "Woke up early to watch the sunrise. Feeling calmer about work transitions...",
      "timestamp": 1740225600000,
      "space": "Personal"
    }
  ]
}
```

#### SSE Stream Format
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"token": "Looking"}
data: {"token": " across"}
data: {"token": " your"}
data: {"token": " recent"}
data: {"token": " entries,"}
data: {"token": " a clear sense of peace emerges..."}
data: [DONE]
```

</details>

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** `v20.0.0` or higher
- **npm** `v10.0.0` or higher
- *(Optional)* **NVIDIA NIM API Key** for local AI execution (Get one free at [build.nvidia.com](https://build.nvidia.com))

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/datascyther/Jouspace.git
cd Jouspace

# Install frontend dependencies
npm install

# Install server runtime dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# Optional: Real local AI streaming via NVIDIA NIM
NVIDIA_API_KEY=nvapi-your-key-here

# Optional: Firebase Auth for optional Google Sign-in identity
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-project-id
```

> **Note:** Jouspace connects automatically to the deployed Cloudflare Worker runtime out of the box (`https://jouspace-runtime.jouspace.workers.dev`), allowing immediate AI features without configuring local API keys!

### 3. Launch Development Server

```bash
# Run both Vite Frontend and Intelligence Runtime concurrently
npm run dev:all

# Or run frontend only (http://localhost:5173)
npm run dev

# Or run runtime only (http://localhost:3001)
npm run server
```

---

## 🧪 Testing & Verification

Jouspace maintains rigorous unit and integration test coverage across components, hooks, storage drivers, and permission bridges.

```bash
# Run complete test suite once
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Execute strict TypeScript type verification
npx tsc --noEmit
```

---

## 📱 Android Native Build & Release

The `android/` directory is **committed to the repository** with permanent release signing certificates, adaptive icons, and native configurations.

```bash
# 1. Build the production web bundle
npm run build

# 2. Synchronize web assets into Android Capacitor shell
npx cap sync android

# 3. Compile signed release APK
cd android && ./gradlew assembleRelease

# The generated APK is ready at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎨 Design System & Typography

Jouspace is built on a calm, book-like aesthetic inspired by classic stationery and Japanese paper craftsmanship.

<div align="center">

| Token Name | Light Value | Dark Value | Semantic Purpose |
|---|---|---|---|
| `--bg-base` | `#F5F3EF` | `#121215` | App foundational canvas |
| `--bg-surface` | `#FFFFFF` | `#1A1A1F` | Elevated cards, sheets, & inputs |
| `--text-primary` | `#1A1A1E` | `#EDEDF0` | High-contrast editorial headers |
| `--text-secondary` | `#6B6B6B` | `#A0A0A8` | Body copy and contemplative text |
| `--accent-purple` | `#6C4DCA` | `#8E72EC` | Action buttons, badges, & AI aura |
| `--border-subtle` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | Minimalist hairline dividers |

</div>

### Typography Hierarchy
- **Serif Display**: `Playfair Display` (Self-hosted WOFF2, offline-ready) — used for reflection titles, dates, and poetic headers.
- **Sans Body**: `Inter` (Self-hosted WOFF2, optimized) — calibrated for ultra-clean legibility across long-form journaling.

---

## 📂 Project Structure

```
jouspace/
├── .github/
│   └── workflows/          # CI testing & automated signed APK build pipelines
├── android/                # Committed Capacitor Android native project & release keystore
├── public/                 # Offline fonts (Playfair/Inter), manifest.json, branding icons
├── server/                 # Express 4 AI runtime (stateless SSE proxy & prompt assembler)
│   ├── context/            # ContextAssembler (multi-entry synthesis)
│   ├── gateway/            # NvidiaGateway (OpenAI SDK orchestration)
│   ├── prompt/             # PromptAssembler (custom system personalities)
│   └── routes/             # REST/SSE capability routers
├── src/                    # React 19 Frontend
│   ├── components/         # Accessible UI components (*ScreenContent, *Sheet, *Modal)
│   ├── hooks/              # Custom hooks (useJournalStore, useTheme, useAI)
│   ├── lib/                # Firebase identity & audio transcription bridges
│   ├── permissions/        # Unified Web & Android native permission manager
│   ├── store/              # JournalStore interface & LocalStorage driver
│   ├── utils/              # Pure offline utilities (sentiment, draft, nav, validation)
│   ├── tokens.ts           # Design token source of truth
│   ├── theme.css           # CSS custom properties specification
│   └── App.tsx             # Application state hub & navigation coordinator
├── worker/                 # Cloudflare Worker port of the Intelligence Runtime
└── vite.config.ts          # Vite 7 + single-file bundle configuration
```

---

## 🤝 Contributing to Jouspace

We enthusiastically welcome contributions from designers, writers, accessibility advocates, and developers!

1. **Fork the Repository**
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/mindful-enhancement
   ```
3. **Commit Your Changes**: Follow clear, atomic commit messages.
4. **Verify Standards**:
   ```bash
   npm test
   npx tsc --noEmit
   ```
5. **Open a Pull Request**: Explain the rationale, user impact, and design considerations.

*Please review [`AGENTS.md`](AGENTS.md) and [`DEPLOYMENT.md`](DEPLOYMENT.md) for architectural conventions.*

---

## 📄 License & Community

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

<br />

<div align="center">

**Built with calm focus and deep craftsmanship.**  
*Because your personal thoughts deserve a space of their own.*

<br />

<sub>Crafted with ❤️ by the Jouspace Open Source Contributors</sub>

</div>

