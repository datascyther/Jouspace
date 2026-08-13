# Private voice model assets

This folder is served at `/models/*` by the dev server (Vite `public/`) and should
be served from your own static host in production.

These files power the **on-device Whisper** engine (`src/voice/LocalWhisperEngine.ts`)
so voice typing works **fully offline and privately** — audio never leaves the device.

## Get the files

Run once from the repo root (Node 18+):

```bash
node scripts/download-whisper-model.mjs        # downloads base.en + whisper.wasm
```

This fetches the model + wasm from the public `@ricky0123/whisper.wasm` GitHub
release. For **strict privacy**, mirror these files onto infrastructure you control
(a private bucket / your own runtime) and update `src/voice/voiceConfig.ts`:

```ts
whisper: {
  model: 'base.en',
  modelUrl: '/models/whisper-base-en.wasm', // or your self-hosted URL
  wasmUrl: '/models/',                       // or your self-hosted path
  multilingual: false,
}
```

## Files

- `ggml-base.en.bin` — quantized model weights (the actual STT brain)
- `whisper.wasm` — the WASM runtime that decodes audio on-device
- `manifest.json` — written by the download script (model + version + timestamp)

> Note: `base.en` is a good balance of size (~40 MB) and accuracy. Swap to `tiny.en`
> (~8 MB, faster) or `small.en` (more accurate) via the script's first argument.
