# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Community health files: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates, and pull request template.
- `CHANGELOG.md` to track releases.

### Changed

- Rewrote `README.md` with a cleaner, more focused introduction and documentation structure.

## [1.1.1] - 2026-09-25

### Fixed

- Stopped the Welcome, Create Account, and Sign In screens from being dragged in any direction. The light-theme ambient orb sat outside its scroll container (`right: -90px`), which created ~90px of real horizontal scroll range, and the shell's `overflow-y-auto` promoted its `overflow-x` to `auto`, so a sideways swipe panned the whole screen. The orb is now clipped by its own layer, the shell is explicitly `overflow-x: hidden`, and `touch-pan-y` blocks horizontal gestures outright.
- Stopped the Welcome screen drifting vertically. Hero spacing now scales with viewport height so the block fits the frame instead of overflowing it, and centering uses auto margins so any remaining overflow pins to the top and stays reachable — `justify-center` used to spill content equally above and below, where the top half could never be scrolled back into view.
- Capped the desktop phone frame at `100dvh - 44px` instead of a flat `880px`. Windows shorter than ~924px — including every phone held in landscape — clipped the bottom of the frame, putting the Welcome CTA outside the viewport with no way to scroll to it.
- Locked the Android app to portrait orientation.
- Made the splash logo screen inert to touch (`touch-action: none`).
- Added `AuthScreen.test.tsx` to lock in the scroll contract.

## [1.1.0] - 2026-09-10

### Fixed

- Restored completed AI streams across chat, reflect, insight, summarize, and memory by switching the deployed NVIDIA runtime to the live `meta/llama-3.2-11b-vision-instruct` model.
- Cleared account-scoped local data on sign-out to prevent data from being retained across accounts.
- Disabled Android cloud backup and device transfer for local WebView storage.

### Changed

- Moved Android release signing material to private GitHub Actions secrets while preserving update compatibility.
- Retained the development-only guest bypass; it remains guarded by `import.meta.env.DEV` and has no production surface.
- Updated privacy disclosures to accurately describe optional AI transmission and authenticated Firestore sync.
- Applied non-breaking dependency updates; 2 critical, 2 high, and 1 moderate advisory remain and require forced or breaking upgrades.

## [1.1.0-beta.2] - 2026-08-22

### Added

- Initial public beta release.
- Journaling with on-device storage.
- Stateless AI intelligence runtime (chat, reflect, insight, summarize) powered by NVIDIA NIM.
- Offline PWA and native Android (Capacitor) support.
- Firebase Auth identity (Google + email/password) with on-device profile data.

## [1.1.0-beta.3] - 2026-09-10

### Fixed

- Switched the deployed NVIDIA runtime to the live `meta/llama-3.2-11b-vision-instruct` model and refreshed the Worker API secret, restoring completed AI streams across chat, reflect, insight, summarize, and memory.
- Applied non-breaking `npm audit fix` updates; 2 critical, 2 high, and 1 moderate advisory remain and require forced or breaking upgrades.

### Changed

- Retained the development-only guest bypass; it remains guarded by `import.meta.env.DEV` and has no production surface.

[Unreleased]: https://github.com/datascyther/Jouspace/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/datascyther/Jouspace/releases/tag/v1.1.0
[1.1.0-beta.3]: https://github.com/datascyther/Jouspace/releases/tag/v1.1.0-beta.3
[1.1.0-beta.2]: https://github.com/datascyther/Jouspace/releases/tag/v1.1.0-beta.2