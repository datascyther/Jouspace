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

[Unreleased]: https://github.com/datascyther/Jouspace/compare/v1.1.0-beta.3...HEAD
[1.1.0-beta.3]: https://github.com/datascyther/Jouspace/releases/tag/v1.1.0-beta.3
[1.1.0-beta.2]: https://github.com/datascyther/Jouspace/releases/tag/v1.1.0-beta.2