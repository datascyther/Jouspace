# Contributing to Jouspace

Thank you for your interest in contributing to Jouspace. This project is a quiet journaling app that keeps your writing on your own device, and we want the contribution experience to feel the same way: calm, considered, and free of unnecessary friction.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We expect everyone who participates in this project to uphold it.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Project Overview](#project-overview)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Documentation](#documentation)
- [Questions?](#questions)

## Ways to Contribute

There are many ways to contribute beyond writing code:

- **Report bugs** — open an issue with a clear description of the problem, steps to reproduce, and expected vs. actual behavior.
- **Suggest features** — open an issue describing the problem you're trying to solve and how you envision the solution.
- **Improve documentation** — fix typos, clarify wording, or add examples.
- **Write tests** — help us improve coverage.
- **Review pull requests** — thoughtful, respectful code review is always appreciated.

## Project Overview

Jouspace is an account-free AI journaling app. Your journal lives on your device. When you want insight, Jouspace streams reflections through a stateless intelligence runtime — no journal data is ever stored in the cloud.

The repository is a monorepo with three main parts:

| Directory | Description |
|-----------|-------------|
| `/` (root) | React 19 + TypeScript + Vite frontend (the app) |
| `/server` | Express 4 + tsx intelligence runtime (stateless SSE proxy to NVIDIA NIM) |
| `/worker` | Cloudflare Workers port of the intelligence runtime |
| `/android` | Committed Capacitor Android native shell (do not regenerate) |

## Development Environment

### Prerequisites

- **Node.js** `v20.0.0` or higher
- **npm** `v10.0.0` or higher
- *(Optional)* **NVIDIA NIM API Key** for local AI execution — get one free at [build.nvidia.com](https://build.nvidia.com)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/datascyther/Jouspace.git
cd Jouspace

# 2. Install frontend dependencies
npm install

# 3. Install server runtime dependencies
cd server && npm install && cd ..
```

### Running the Development Server

```bash
# Run both Vite frontend and intelligence runtime concurrently
npm run dev:all

# Or run them separately:
npm run dev        # Frontend only (http://localhost:5173)
npm run server     # Runtime only (http://localhost:3001)
```

### Environment Variables

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

## Development Workflow

1. **Fork the repository** and create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes.** Keep them focused. If you're fixing a bug, write a test that reproduces it first.

3. **Run the test suite** to make sure nothing is broken:

   ```bash
   npm test
   ```

4. **Type-check your changes:**

   ```bash
   npx tsc --noEmit
   ```

5. **Commit your changes** with a clear, descriptive message (see [Commit Messages](#commit-messages)).

6. **Push and open a pull request** against `main`.

## Code Style

- **TypeScript** — strict mode is enabled. `noUnusedLocals` and `noUnusedParameters` are on, so unused variables will fail CI.
- **Imports** — use relative paths (e.g., `../components/...`). A `@` alias exists but is not used in source.
- **Components** — named function exports (`export function X` / `export const X`), PascalCase files in `src/components/`.
- **Hooks** — `useX.ts` in `src/hooks/`.
- **Utilities** — camelCase in `src/utils/`.
- **Class merging** — use `cn()` from `src/utils/cn.ts` (clsx + tailwind-merge).
- **Icons** — `lucide-react` (plus `react-icons` available).
- **localStorage keys** — namespaced `jouspace:*` (e.g., `jouspace:journal:v1`). Follow the pattern and validate/corrupt-safely parse any stored payload.
- **Accessibility** — semantic roles, `aria-label`s on icon buttons, focus traps, and Escape handling are taken seriously. Tests assert accessible labels — keep them.

> **Note:** There is no linter or formatter configured. CI only runs `tsc --noEmit`, `build`, and `test`. Please don't add lint tooling unprompted.

## Testing

Jouspace uses Vitest + Testing Library + jsdom. Tests are co-located with the source files (`Foo.test.tsx` next to `Foo.tsx`).

```bash
# Run the complete test suite once
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Run a single test file
npx vitest run src/utils/nav.test.ts

# Execute strict TypeScript type verification
npx tsc --noEmit
```

> **Note:** The server (`server/`) has no tests. Frontend only.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps with automatic versioning and changelog generation.

```
<type>(<scope>): <description>
```

**Types:**

- `feat` — a new feature
- `fix` — a bug fix
- `docs` — documentation only changes
- `style` — changes that do not affect the meaning of the code (formatting, whitespace, etc.)
- `refactor` — a code change that neither fixes a bug nor adds a feature
- `test` — adding or updating tests
- `chore` — changes to the build process or auxiliary tools

**Examples:**

```
feat(composer): add sentiment-based background tinting
fix(store): handle corrupt localStorage payloads gracefully
docs: clarify environment variable setup
```

## Pull Requests

1. **Keep PRs small and focused.** If a PR becomes too large, consider splitting it up.
2. **Reference related issues** in the PR description (e.g., "Closes #42").
3. **Describe your changes** — what you changed and why.
4. **Include a test plan** — how did you verify your changes?
5. **Ensure CI passes** — all checks must be green before merging.

## Documentation

- `README.md` — project overview, quick start, and links to detailed docs.
- `AGENTS.md` — architecture and conventions for AI agents (and curious humans).
- `DEPLOYMENT.md` — hosting the intelligence runtime and signing/releasing the APK.
- `server/README.md` — deeper architecture detail for the intelligence runtime.

If you change behavior, update the relevant documentation in the same PR.

## Questions?

If you have a question, please [open an issue](https://github.com/datascyther/Jouspace/issues) with the `question` label. We'll do our best to help.