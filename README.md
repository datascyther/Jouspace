<div align="center">

<img src="public/app-icon.svg" alt="Jouspace" width="96" height="96" />

# Jouspace

### A private journal that remembers with you.

<br />

[![CI](https://github.com/user/jouspace/actions/workflows/ci.yml/badge.svg)](https://github.com/user/jouspace/actions)
[![Version](https://img.shields.io/badge/version-1.1.0--beta.2-6C4DCA?labelColor=1A1A1E)](https://github.com/user/jouspace/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-6B6B6B?labelColor=1A1A1E)](LICENSE)
[![Android](https://img.shields.io/badge/Android-APK-3DDC84?logo=android&labelColor=1A1A1E)](https://github.com/user/jouspace/releases)
[![PWA](https://img.shields.io/badge/PWA-Installable-6C4DCA?logo=pwa&labelColor=1A1A1E)]()

<br />

> *"Writing in a journal gives me a place to report, interpret, argue,
> reflect, save, question, predict, unload, praise, compare, cry,
> laugh, draw, paint, and remember."*
>
> *— Luci Swindoll*

<br />

</div>

---

**Jouspace** is a local-first, account-free AI journaling app. Your entries stay on your device. No cloud database. No subscriptions. No tracking. Just a quiet space to think — with an optional AI companion that listens.

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Private by Default
Your journal lives entirely on your device. No account required to start writing. No data leaves your phone unless you choose to use AI features — and even then, only the entries you send.

</td>
<td width="50%" valign="top">

### AI That Understands You
Built-in intelligence powered by NVIDIA NIM. Chat with your journal, get reflection prompts, surface hidden patterns, and generate summaries — all streamed in real-time with full context.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Offline-First PWA
Install directly from the browser. Works without an internet connection. Your entries sync locally and persist across sessions with automatic recovery.

</td>
<td width="50%" valign="top">

### Android Native
Packaged as a native APK via Capacitor with branded icons, notification scheduling, and a permanent release signing config — ready for the Play Store.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Beautifully Crafted UI
Warm, paper-textured design system with light and dark themes. Every component is accessible, focus-trapped, and keyboard-navigable. Built for the way you actually use it.

</td>
<td width="50%" valign="top">

### Memory Threads
Entries weave into contextual threads. Surface related moments across time. Your journal remembers what matters, even when you forget where you put it.

</td>
</tr>
</table>

---

## Quick Start

```bash
git clone https://github.com/user/jouspace.git
cd jouspace
npm install
```

### Development

```bash
npm run dev          # Vite dev server → http://localhost:5173
npm run server       # AI Runtime only → http://localhost:3001
npm run dev:all      # Both together
```

### Build

```bash
npm run build        # Single-file dist/index.html
npm test             # Run test suite
```

### AI Features

Create a `.env` in the project root:

```
NVIDIA_API_KEY=nvapi-your-key-here
```

The AI chat works out-of-the-box with the deployed Runtime at `https://jouspace-runtime.jouspace.workers.dev` — no local setup required.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                     │
│  App.tsx → ScreenContent → useJournalStore → localStorage    │
│                   ↕ useJouspaceIntelligence                   │
├─────────────────────────────────────────────────────────────┤
│               Intelligence Runtime (Express / Worker)         │
│  Zod → ContextAssembler → PromptAssembler → ModelGateway     │
│                     → StreamController (SSE)                  │
└─────────────────────────────────────────────────────────────┘
```

**Two packages, one product:**

| Package | Purpose |
|---|---|
| `/` (root) | React 19 + Vite 7 + Tailwind CSS 4. Builds to a single `dist/index.html` via `vite-plugin-singlefile`. Wrapped in a Capacitor Android shell. |
| `/server` | Express 4 + tsx. Provider-agnostic AI orchestration. Stateless — sends your own entries with each request. No database. |

The frontend never sees API keys, model names, or provider details. It only sees: `messages`, `send()`, `isThinking`, `isStreaming`.

---

## Tech Stack

| Layer | |
|---|---|
| **Framework** | React 19 · TypeScript 5.9 · Vite 7 |
| **Styling** | Tailwind CSS 4 · Design tokens in `theme.css` |
| **Mobile** | Capacitor 6 · Android (committed `android/` dir) |
| **AI Runtime** | Express 4 · NVIDIA NIM (via OpenAI SDK) · SSE streaming |
| **Deploy** | Cloudflare Workers (runtime) · GitHub Actions (APK) |
| **Auth** | Firebase (optional, identity only) |
| **Testing** | Vitest 3 · Testing Library · jsdom |

---

## Project Structure

```
jouspace/
├── src/
│   ├── components/      # UI components (*ScreenContent, *Sheet, etc.)
│   ├── hooks/           # React hooks (store, theme, AI, focus trap)
│   ├── store/           # JournalStore interface + localStorage impl
│   ├── utils/           # Pure utilities (sentiment, nav, validation)
│   ├── lib/             # Firebase, personalization
│   └── main.tsx         # Entry point → App
├── server/
│   ├── routes/          # One router per AI capability (chat, reflect, etc.)
│   ├── context/         # ContextAssembler — builds context from entries
│   ├── prompt/          # PromptAssembler — Jouspace-branded system prompts
│   ├── gateway/         # ModelGateway interface + NvidiaGateway
│   └── stream/          # StreamController — SSE output
├── worker/              # Cloudflare Worker port of the runtime
├── android/             # Capacitor Android shell (committed, branded)
└── public/              # PWA manifest, icons, self-hosted fonts
```

---

## AI Capabilities

| Endpoint | What It Does |
|---|---|
| `POST /api/ai/chat` | Conversational journal intelligence — ask anything about your entries |
| `POST /api/ai/reflect` | Focused reflection on a specific insight or theme |
| `POST /api/ai/insight` | Auto-generate AI insight cards from your entries |
| `POST /api/ai/summarize` | Summarize an entry or memory thread |

All capabilities stream responses as SSE. Each request carries your own journal entries — the runtime is stateless.

---

## Design Philosophy

Jouspace is built around a few quiet convictions:

- **Your journal is yours.** No cloud sync by default. No data mining. No ads. The app is a container for your thoughts, not a product built around them.
- **AI should be optional, not the product.** Intelligence features enhance the experience but never replace the act of writing. The app works beautifully with the AI turned off.
- **Craft over noise.** Every color, spacing unit, and animation is deliberate. The design system has a single source of truth in `theme.css`. No shortcuts, no arbitrary values.
- **Offline should be the default.** The PWA works without a network. Notifications, search, draft persistence — all local-first.

---

## Contributing

Jouspace is open-source. Contributions are welcome.

```bash
# Fork the repo
git clone https://github.com/your-username/jouspace.git
cd jouspace
npm install

# Run tests before submitting
npm test
npx tsc --noEmit

# Create a feature branch
git checkout -b feature/your-feature
```

See [AGENTS.md](AGENTS.md) for architecture conventions, design system rules, and coding guidelines.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with care for people who write.**

</div>
