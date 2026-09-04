# Implementation Plan

## [Overview]

Transform Jouspace's repository into a polished, professional open-source project by rewriting the README in a distinctive editorial voice and adding the full suite of community-facing files (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, issue/PR templates, CHANGELOG) while fixing broken or outdated references across existing documentation.

### Context

The current `README.md` (414 lines) is dense with emojis, ASCII-art boxes, colored table cells, and a wall of badges. While technically complete, it reads as generic "vibe-coded" output rather than a crafted open-source project. The user explicitly wants to avoid "AI slop" and instead project the confidence of a real, maintainer-run project — think Vercel, Linear, or tRPC README energy: clean, professional, but with a distinctive point of view.

The user approved a **full audit pass**: README rewrite + all community files + CHANGELOG + link fixes. The visual direction is **"a blend — clean and professional but with a distinctive point of view"** (not emoji-soup, not sterile).

### Key Facts Established During Investigation

- **Project**: Jouspace — a local-first, account-free AI journaling app.
- **Version**: `1.1.0-beta.2` (from `package.json`).
- **Repo**: `https://github.com/datascyther/Jouspace` (origin remote).
- **License**: MIT, `Copyright (c) 2026 Jouspace`.
- **Frontend** (repo root): React 19.2 + TypeScript 5.9 + Vite 7 + Tailwind 4, builds to single-file `dist/index.html` via `vite-plugin-singlefile`.
- **Android shell** (`android/`): committed to repo, signed release keystore committed, `applicationId` = `com.jouspace.app`.
- **Runtime** (`server/`): Express 4 + tsx, stateless SSE proxy to NVIDIA NIM. Own `package.json`.
- **Edge runtime** (`worker/`): Cloudflare Workers port, deployed at `https://jouspace-runtime.jouspace.workers.dev`.
- **CI** (`.github/workflows/ci.yml`): runs `tsc --noEmit`, `build`, `test` for both frontend and server.
- **APK build** (`.github/workflows/build-apk.yml`): manual dispatch or `v*` tag → signed release APK artifact.
- **Existing docs**: `README.md`, `AGENTS.md`, `DEPLOYMENT.md`, `server/README.md`, `docs/BETA_RELEASE_REPORT.md`.
- **Existing community files**: NONE beyond `LICENSE` and `.gitignore`. No CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG, issue/PR templates, or FUNDING.
- **Design tokens**: `--bg-base` `#F5F3EF` (light) / `#121215` (dark), `--accent-purple` `#6C4DCA` / `#8E72EC`, fonts Playfair Display (serif) + Inter (sans).
- **Badges available** (from current README): CI passing, version, MIT license, Android release, PWA installable, TypeScript 5.9, React 19.

---

## [Types]

No TypeScript types, interfaces, enums, or data structures are introduced, modified, or removed by this task. This is a documentation-only change set.

The only "types" of relevance are the **file formats** being authored (Markdown, YAML, JSON) and the **conventions** they must follow:

- **Markdown** (`.md`): GitHub Flavored Markdown. Line length ≤ 100 chars for prose. Use `##` for top-level sections in README (since `#` is the H1 title). Code fences must specify a language where applicable (```` ```bash ````, ```` ```ts ````, ```` ```yaml ````, ```` ```json ````).
- **YAML** (`.yml`): Front matter for issue templates (`name:`, `about:`, `title:`, `labels:`, `assignees:`, `body:` with `type: markdown` / `type: textarea` / `type: input` / `type: dropdown` / `type: checkboxes`). Must be valid YAML — no tabs, consistent indentation (2 spaces).
- **JSON** (`.json`): `FUNDING.yml` is YAML, not JSON. No JSON files are authored in this task.
- **Badge URLs**: `https://img.shields.io/badge/<label>-<message>-<color>?style=flat-square&logo=<logo>&logoColor=white&labelColor=16161A`. URL-encode spaces as `%20` and `#` as `%23`. Use `flat-square` style for a modern look.

---

## [Files]

This task creates 9 new files and modifies 1 existing file. No files are deleted or moved.

### New Files

| # | Path | Purpose |
|---|------|---------|
| 1 | `README.md` | **REWRITE** (existing file, full replacement) — the centerpiece. Editorial, confident, no emoji-soup. |
| 2 | `CONTRIBUTING.md` | Contributor onboarding: dev setup, scripts, code style, PR workflow, project structure overview. |
| 3 | `SECURITY.md` | Security policy: how to report vulnerabilities privately, supported versions, disclosure timeline. |
| 4 | `CODE_OF_CONDUCT.md` | Contributor Covenant v2.1, contact: `maintainers@jouspace.app` (placeholder — verify with user). |
| 5 | `CHANGELOG.md` | Keep a Changelog format, `[Unreleased]` + `1.1.0-beta.2` entries. |
| 6 | `.github/ISSUE_TEMPLATE/bug_report.yml` | Structured bug report form (YAML front matter). |
| 7 | `.github/ISSUE_TEMPLATE/feature_request.yml` | Structured feature request form (YAML front matter). |
| 8 | `.github/ISSUE_TEMPLATE/config.yml` | Links to CONTRIBUTING + SECURITY, blank-issue toggle. |
| 9 | `.github/PULL_REQUEST_TEMPLATE.md` | PR template: summary, test plan, checklist. |
| 10 | `.github/FUNDING.yml` | GitHub Sponsors link (placeholder `datascyther`). |

### Modified Files

| Path | Change |
|------|--------|
| `README.md` | Full rewrite (see below). |

### README.md Rewrite — Detailed Section Map

The new README should follow this structure (adapt as the writing flows, but keep the editorial voice and no-emoji rule):

1. **Header** — Centered: `public/app-icon.svg` logo (small, ~64px), H1 `Jouspace`, one-line tagline (e.g. *"A private sanctuary for your thoughts — augmented by mindful intelligence."* or a sharper variant). No emoji in the tagline.
2. **Badges** — A single row of `flat-square` badges: CI, version, license, Android release, PWA, TypeScript, React. Use `labelColor=16161A` to match the dark theme. Keep to one line.
3. **The Problem / Why** — 2–3 short paragraphs establishing the thesis: digital tools monetize vulnerability; Jouspace is a sovereign, quiet sanctuary. Write with conviction. No emoji headers.
4. **Features** — A clean 2-column grid (HTML `<table>` or `<div>` with `display: grid` — prefer a simple `<table>` for GitHub compatibility) of 4–6 features. Each cell: bold title + 1–2 sentence description. No emoji in titles.
5. **Architecture & Privacy Boundary** — Keep a simplified version of the ASCII diagram (it's genuinely good) but clean it up: remove box-drawing noise, use a monospace block. Add a short paragraph on the zero-knowledge boundary. Reference `server/` and `worker/` as the two runtime targets.
6. **Quick Start** — Prerequisites (Node 20+, npm 10+), clone, install, `.env` (NVIDIA key optional), `npm run dev:all`. Keep the note about the hosted Cloudflare runtime.
7. **AI Capabilities** — A clean table of the 4 endpoints + health check. Move the sample request/SSE payload behind a `<details>` block.
8. **Testing** — `npm test`, `npm run test:watch`, `npx tsc --noEmit`.
9. **Android Build** — Brief note that `android/` is committed, link to `DEPLOYMENT.md` for full signing/release docs.
10. **Project Structure** — Keep the tree but trim it; remove `node_modules`-adjacent noise.
11. **Contributing** — Link to `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
12. **License** — MIT, link to `LICENSE`.

**Voice & Style Rules (critical):**
- **No emojis** in headings, badges, or body copy. (Exception: none. Remove them all.)
- **No ASCII-art boxes** around text (the `┌───┐` blocks). A single clean monospace architecture diagram is acceptable.
- **No ALL-CAPS** section headers with decorative characters like `## ✨ Key Highlights` → use `## Key Highlights`.
- **Confident, declarative sentences.** Short paragraphs. Whitespace is a feature.
- **No "vibe-coded" clichés**: avoid "In today's fast-paced world", "seamless", "robust", "leverage", "delve", "unleash", "supercharge", "elevate", "harness the power".
- **Consistent tone**: calm, precise, a little literary (it's a journaling app) but never purple.
- **Links**: use relative paths for in-repo files (`CONTRIBUTING.md`, `DEPLOYMENT.md`, `LICENSE`), absolute URLs for external resources.
- **Badge URLs** must use `flat-square` style and `labelColor=16161A`.

---

## [Functions]

No functions are introduced, modified, or removed. This is a documentation-only change set.

The only "callable" artifacts are the **npm scripts** referenced in the README and CONTRIBUTING, which must match `package.json` exactly:

| Script | Command | Notes |
|--------|---------|-------|
| `npm run dev` | `vite` | Frontend dev server on :5173 |
| `npm run server` | `cd server && npm run dev` | Runtime on :3001 |
| `npm run dev:all` | `concurrently ...` | Both together |
| `npm test` | `vitest run` | One-pass test run |
| `npm run test:watch` | `vitest` | Watch mode |
| `npm run build` | `vite build` | Production build → `dist/` |
| `npx tsc --noEmit` | — | Type-check (no script wrapper) |

---

## [Classes]

No classes are introduced, modified, or removed. This is a documentation-only change set.

---

## [Dependencies]

No runtime or dev dependencies are added, removed, or version-bumped. The `package.json`, `package-lock.json`, `server/package.json`, and `worker/package.json` files are **not** modified.

The only "dependency" is on the **GitHub ecosystem** for the community files (issue templates, PR template, FUNDING) and the **shields.io** service for badges.

---

## [Testing]

No automated tests are introduced or modified. However, the following **manual verification steps** MUST be performed after all files are written:

1. **Markdown lint** (if available): `npx markdownlint-cli2 "*.md" ".github/**/*.md" 2>/dev/null || echo "markdownlint not installed — skipping"` — if not installed, do a visual review instead.
2. **Link check**: `grep -rEo '\]\([^)]*\)' README.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CHANGELOG.md | sort -u` — verify all relative links resolve to real files and all absolute URLs are well-formed.
3. **YAML validity**: `node -e "const fs=require('fs');['.github/ISSUE_TEMPLATE/bug_report.yml','.github/ISSUE_TEMPLATE/feature_request.yml','.github/ISSUE_TEMPLATE/config.yml','.github/FUNDING.yml'].forEach(f=>{try{require('yaml').parse(fs.readFileSync(f,'utf8'));console.log('OK',f)}catch(e){console.error('FAIL',f,e.message);process.exitCode=1}})"` — or use `npx yaml-lint` if available.
4. **Badge URLs**: `curl -sI "https://img.shields.io/badge/CI-passing-2ea44f?style=flat-square" | head -1` — spot-check at least one badge URL returns 200.
5. **README renders**: open the raw markdown in a GitHub preview (or `gh pr view` / `gh repo view` if pushed) and confirm no broken tables, code fences, or image links.
6. **Cross-reference**: `grep -rn "CONTRIBUTING.md\|SECURITY.md\|CODE_OF_CONDUCT.md\|CHANGELOG.md" README.md` — confirm all new files are linked from the README.
7. **No emoji regression**: `grep -nP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]' README.md | head -20` — confirm the README has no emoji (or only intentional ones in the architecture diagram).

---

## [Implementation Order]

The implementation should proceed in the following order to minimize conflicts and ensure each file can be reviewed independently:

1. **Write `CHANGELOG.md`** — establishes the versioning narrative (`[Unreleased]` + `1.1.0-beta.2`).
2. **Write `CONTRIBUTING.md`** — the second-most-important community file; documents the dev workflow.
3. **Write `SECURITY.md`** — short, standard.
4. **Write `CODE_OF_CONDUCT.md`** — Contributor Covenant v2.1, standard.
5. **Write `.github/ISSUE_TEMPLATE/bug_report.yml`** — structured form.
6. **Write `.github/ISSUE_TEMPLATE/feature_request.yml`** — structured form.
7. **Write `.github/ISSUE_TEMPLATE/config.yml`** — links to CONTRIBUTING + SECURITY.
8. **Write `.github/PULL_REQUEST_TEMPLATE.md`** — PR checklist.
9. **Write `.github/FUNDING.yml`** — GitHub Sponsors placeholder.
10. **Rewrite `README.md`** — the centerpiece; do this last so all links to the new files resolve.
11. **Run verification** — link check, YAML validity, badge URL spot-check, emoji regression check.
12. **Report** — summarize all changes and flag any placeholders (CoC contact email, FUNDING username) for the user to confirm.