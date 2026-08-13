# Voice Input (Web Speech API)

Shared voice-to-text logic lives in `src/hooks/useVoiceInput.ts`.

## Why
Both the AI composer (`AIScreenContent` + `Composer`) and the journal editor
(`JournalScreenContent` + `WritingToolbar`) previously had duplicated, buggy
SpeechRecognition code. The journal's `onresult` appended *all* results
(including volatile interim results) on every event → duplicated/garbled text.
The AI composer used `continuous = false` (stopped after one utterance) and had
no recording visual state.

## Fix (v2 — robust + honest)
`useVoiceInput`:
- `continuous = true`, `interimResults = true`.
- Commits each FINALIZED result separately, one per result index
  (`lastFinalIndexRef`), so every segment is delivered exactly once — no interim
  duplication.
- Streams a live preview via `onInterim(text | null)` (latest interim transcript).
- Surfaces failures via `onError(code)` instead of swallowing them.
  `FATAL_ERRORS = {network, not-allowed, service-not-allowed, audio-capture}`.
- Resumes automatically on a **benign** `onend` (silence/no-speech/aborted) so a
  single tap keeps capturing across natural pauses; stops cleanly (no retry loop)
  on manual stop or a fatal error.
- Callbacks stored in refs so a long-lived session never calls stale handlers.
- Exposes `supported`, `recording`, `start`/`stop`/`toggle`; cleans up on unmount.

Both screens wire `onFinal` (append w/ single-space separator), `onInterim`
(render muted italic live preview), and `onError` (render a clear `text-error`
message, auto-dismiss after ~5s). `Composer` & `WritingToolbar` show a red
pulsing mic when `isRecording`.

## Root cause of "mic opens 1s then closes, no typing"
The Web Speech API sends audio to the browser vendor's speech service (Google for
Chromium) — it needs network + mic permission. In restricted/offline setups it
fails with `onerror: network` then `onend`. The original code swallowed the error
so the button silently opened and closed. v2 surfaces the failure to the user.

## Testing
`src/hooks/useVoiceInput.test.ts` mocks SpeechRecognition and asserts:
unsupported detection, start/toggle, no interim duplication, separate final
segments, error code surfacing + clean stop on fatal error, interim streaming +
clear-on-stop, and auto-resume on benign `onend`. 6 tests, all passing.
