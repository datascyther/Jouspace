# Private On-Device Voice Engine (STT)

Implemented: 2026-08 (voice assistant follow-up after the permission system).

## Goal
Replace the Google-servers-dependent Web Speech API with an on-device, private,
interruption-free voice-to-text engine. Requirement: "I don't want any
interruption when the user tries to voice typing."

## Architecture (src/voice/*)
- `types.ts` — `SttEngine` interface (id, supported, load, start, stop,
  setCallbacks) + `SttEngineCallbacks`. Engine-agnostic contract.
- `mapWhisper.ts` — `handleWhisperEvent(ev, cb)` pure mapper translating whisper.wasm
  worker messages ('partial'→onInterim, 'result'→onResult, 'error'→onError,
  'end'/'done'→onEnd). Unit-testable without WASM.
- `LocalWhisperEngine.ts` — DEFAULT. On-device Whisper (WASM) via lazy
  `import(/* @vite-ignore */ '@ricky0123/whisper.wasm')`. Audio never leaves the
  device → works offline, no network failure → "no interruption". Load is deduped
  via a loading-promise guard so concurrent loads share one load + can retry.
- `WebSpeechEngine.ts` — extracted legacy Web Speech API. NOT private (ships audio
  to browser vendor). Kept only as an optional fallback.
- `NullEngine.ts` — unsupported no-op.
- `voiceConfig.ts` — `engine: 'local-whisper'`, self-hosted model/wasm URLs
  (PRIVATE), `allowWebSpeechFallback: false` (strict privacy), `preloadOnMount`.
- `createSttEngine.ts` — `defaultSttEngineFactory`, `getSttEngine()` singleton,
  `resetSttEngineForTests(factory?)`.

## Hook (src/hooks/useVoiceInput.ts)
Refactored onto the engine abstraction. Public API preserved:
`{ supported, recording, start, stop, toggle }` — so AIScreenContent /
JournalScreenContent / Composer mic wiring is unchanged. Additive fields:
`status` ('idle'|'loading'|'ready'|'unsupported'|'error'), `isReady`, `preload`.
Behavior kept: finalized segments committed exactly once (deduped by index),
interim preview streamed, benign silence-ends auto-resume, fatal errors
(network/permission/model-missing) stop cleanly without a retry loop.

## Tests (src/hooks/useVoiceInput.test.ts)
Rewritten to inject a `FakeEngine` implementing `SttEngine` (no real speech
runtime). Covers: unsupported, start/toggle recording, finalize dedupe by index,
fatal error stops cleanly, interim + clear on stop, benign auto-resume, preload.

## Packaging / production notes
- `@ricky0123/whisper.wasm` added to package.json (NOT installed in sandbox;
  network blocked). Lazy `@vite-ignore` dynamic import keeps the current web
  build working without it. For a real Capacitor/native build: `npm install`,
  host the model+wasm on YOUR OWN runtime (see voiceConfig modelUrl/wasmUrl), and
  switch LocalWhisperEngine's import to a static import (remove `@vite-ignore`)
  so Vite bundles it. Same pattern as the Capacitor bridge.
- Model must be self-hosted for privacy (do not point at a public CDN).

## Status
tsc clean; all 138 tests pass (23 files). Dev server (localhost:5173) compiles &
HMR healthy. Pre-existing unrelated noise: vite proxy `ECONNREFUSED` for
/api/ai/* (backend not running) and `%VITE_API_BASE_URL%` env placeholder warning.

## Follow-up wiring (2026-08-12)
- **Loading indicator**: mic buttons now show a spinner ("Preparing your private
  voice model…") while `voice.status === 'loading'`. Added `isPreparing` prop to
  `src/components/Composer.tsx` (AI screen) and `src/components/WritingToolbar.tsx`
  (journal). Both AIScreenContent and JournalScreenContent pass
  `isPreparing={voice.status === 'loading'}`. Also call `voice.preload?.()` right
  after a successful `mic.ensure()` so the model warms immediately on grant → first
  tap is instant (no interruption).
- **Self-hosting assets**: `scripts/download-whisper-model.mjs` fetches
  ggml model + `whisper.wasm` into `public/models/` (served at `/models/*`, matching
  `voiceConfig.modelUrl`). `public/models/README.md` documents privacy + how to run.
  For production, mirror these files onto infra you control and update voiceConfig.
