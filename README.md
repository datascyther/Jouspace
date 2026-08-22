<div align="center">
<img src="src/assets/gif.gif" alt="Jouspace in action — local-first journaling with streamed AI reflections" width="100%" />

# Jouspace

**A private place for your thoughts — with intelligence that stays out of the way.**


Local-first journaling for people who take their own mind seriously. Your words never leave your device. When you want perspective, Jouspace streams reflections through a stateless AI runtime that forgets everything the moment you stop reading.

<p>
  <a href="https://github.com/datascyther/Jouspace/actions"><img src="https://img.shields.io/github/actions/workflow/status/datascyther/Jouspace/ci.yml?branch=main&style=flat-square&label=CI&labelColor=16161A" alt="CI"></a>
  <a href="https://github.com/datascyther/Jouspace/releases"><img src="https://img.shields.io/badge/version-1.1.0--beta.2-6C4DCA?style=flat-square&labelColor=16161A" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-3DDC84?style=flat-square&labelColor=16161A" alt="License"></a>
  <a href="https://github.com/datascyther/Jouspace/releases"><img src="https://img.shields.io/badge/Android-APK-3DDC84?style=flat-square&logo=android&logoColor=white&labelColor=16161A" alt="Android"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=16161A" alt="TypeScript"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black&labelColor=16161A" alt="React"></a>
</p>

</div>

---

> *"Writing in a journal gives me a place to report, interpret, argue, reflect, save, question, predict, unload, praise, compare, cry, laugh, draw, paint, and remember."*
>
> **— Luci Swindoll**

---

## Why Jouspace

Most software is built to capture you. Your attention, your data, your behavior — packaged, profiled, and sold back to you as convenience.

A journal is the last place that should feel that way.

Jouspace is a journal that lives entirely on your device. No account. No cloud database. No analytics. Your entries are stored locally, encrypted at rest by your operating system, and never leave your hardware — unless you ask them to.

The one exception is deliberate: when you want insight, Jouspace can send *specific entries you choose* to a stateless AI runtime for a single, ephemeral reflection. The runtime holds no database, keeps no logs, and forgets everything the moment the stream ends.

Your thoughts are yours. Jouspace just helps you think them.

---

## Features

| | |
|---|---|
| **Truly local-first** | Your journal is stored on your device. Works offline. No account, ever. |
| **Stateless AI insight** | Stream reflections, prompts, and summaries from a zero-retention runtime. You choose what to share, one request at a time. |
| **A place to think** | A distraction-free composer with ambient sentiment tinting, draft auto-recovery, and typography tuned for long-form reflection. |
| **Memory threads** | Entries connect into themes over time. Search, filter, and rediscover what you thought you'd forgotten. |
| **Calm by design** | Paper-textured light mode and anti-glare dark mode, both mathematically calibrated to reduce eye strain. |
| **Everywhere you are** | Installable PWA and native Android app, built from a single codebase. |

---

## Quick Start

### Prerequisites

- **Node.js** `v20.0.0` or higher
- **npm** `v10.0.0` or higher
- *(Optional)* **NVIDIA NIM API Key** for local AI execution — get one free at [build.nvidia.com](https://build.nvidia.com)

### Install

```bash
# Clone the repository
git clone https://github.com/datascyther/Jouspace.git
cd Jouspace

# Install frontend dependencies
npm install

# Install server runtime dependencies
cd server && npm install && cd ..
```

### Configure

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

> **Note:** Jouspace connects automatically to the deployed Cloudflare Worker runtime out of the box, so AI features work without configuring local API keys.

### Run

```bash
# Run both Vite frontend and intelligence runtime concurrently
npm run dev:all

# Or run them separately:
npm run dev        # Frontend only (http://localhost:5173)
npm run server     # Runtime only (http://localhost:3001)
```

---

## AI Capabilities

All AI endpoints communicate via **Server-Sent Events (SSE)**. The client supplies the conversation history and entry context in the request payload; the server returns streamed Markdown tokens.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | `POST` | Conversational companion with context over selected entries |
| `/api/ai/reflect` | `POST` | Targeted reflective inquiries grounded in journal themes |
| `/api/ai/insight` | `POST` | Autonomous pattern discovery and thematic cards |
| `/api/ai/summarize` | `POST` | Concise distillation of long entries or memory threads |
| `/api/health` | `GET` | Diagnostic status check |

---

## Testing

```bash
# Run the complete test suite once
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Execute strict TypeScript type verification
npx tsc --noEmit
```

---

## Android Build

The `android/` directory is committed to the repository with permanent release signing, adaptive icons, and native configurations. See [DEPLOYMENT.md](DEPLOYMENT.md) for the full signing and release workflow.

```bash
# 1. Build the production web bundle
npm run build

# 2. Synchronize web assets into Android Capacitor shell
npx cap sync android

# 3. Compile signed release APK
cd android && ./gradlew assembleRelease
```

---

## Project Structure

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

## Contributing

Jouspace is an open-source project, and we welcome contributions of all kinds — code, design, documentation, and ideas.

- Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started
- Review our [Code of Conduct](CODE_OF_CONDUCT.md)
- Report security issues privately via [SECURITY.md](SECURITY.md)
- See the [changelog](CHANGELOG.md) for release history

---

## License

Distributed under the [MIT License](LICENSE).

---

<div align="center">

Crafted with patience and a deep respect for your attention.

</div>
