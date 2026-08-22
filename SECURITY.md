# Security Policy

## Reporting a Vulnerability

Your privacy is the entire point of Jouspace. If you believe you have found a security vulnerability, we ask that you report it responsibly and give us a reasonable window to respond before disclosing it publicly.

**Please do not open a public issue for security vulnerabilities.**

Instead, email us directly at **contact.jouspace@proton.me**. You should receive an acknowledgment within 48 hours. If you don't hear back, please follow up — email can be unreliable.

### What to include

The more context you can provide, the faster we can triage:

- **Type of issue** (e.g., XSS, SSRF, data exposure, dependency vulnerability)
- **Affected component** (frontend, `server/`, `worker/`, `android/`)
- **Steps to reproduce** — include a minimal proof of concept if possible
- **Impact** — what an attacker could do and under what conditions
- **Suggested fix** (optional)

## Scope

Jouspace is a local-first application. The following are in scope:

- The web application and its build pipeline
- The intelligence runtime (`server/` and `worker/`)
- The Android native shell (`android/`)
- The build and release pipelines (`.github/workflows/`)

The following are **out of scope**:

- Social engineering of users or maintainers
- Attacks requiring physical access to an unlocked device
- Denial of service against your own device or account
- Issues in third-party dependencies that are already fixed upstream (please report those to the upstream maintainers)

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest release | Yes |
| Previous release | Security fixes only |
| Pre-release (`-beta.*`) | Best effort |

## Disclosure Policy

We follow a coordinated disclosure process:

1. **Private report** — you report the issue privately.
2. **Acknowledgment** — we confirm receipt within 48 hours.
3. **Triage** — we assess severity and impact, and keep you informed of progress.
4. **Fix** — we develop and test a fix.
5. **Release** — we ship the fix in a patch release.
6. **Public disclosure** — after the fix is released, we'll credit you in the release notes (unless you prefer to remain anonymous).

We aim to acknowledge, triage, and fix critical issues within 14 days of a complete report.

## Security Considerations for This Project

Jouspace is designed around a strict privacy boundary:

- **Journal data never leaves your device** — entries are stored in local storage and are never transmitted to any server.
- **The intelligence runtime is stateless** — it holds no database, no user records, and no logs of your entries. It only receives the entries you explicitly choose to share with it for a single request.
- **API keys are never serialized** to the client, and client-sent `system` role messages are rejected.

If you find a way to violate any of these invariants, we want to hear about it.
