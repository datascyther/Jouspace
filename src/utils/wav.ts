/**
 * wav.ts — Minimal WAV encoding utilities for the voice recorder.
 *
 * The AI runtime's ASR gateway (NVIDIA Parakeet/Whisper) accepts WAV (mono,
 * 16-bit PCM), so the recorder captures raw Float32 samples and encodes them
 * here — no codec, no container library, pure math. 16kHz matches the sample
 * rate the ASR models are trained on, so the recording is also downsampled
 * from whatever the device mic reports.
 */

/** Downsample a Float32 buffer from one sample rate to a lower one (box filter). */
export function downsample(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (toRate >= fromRate) return samples;
  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    out[i] = sum / (end - start);
  }
  return out;
}

/** Encode a mono Float32 sample buffer as a 16-bit PCM WAV ArrayBuffer. */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numFrames = samples.length;
  const bytesPerSample = 2;
  const dataBytes = numFrames * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  // RIFF header
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');

  // fmt chunk (16 bytes, PCM)
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, 1, true); // channels = mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < numFrames; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    // Map [-1, 1] to signed 16-bit range (round), biasing negatives to -32768.
    const value = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(44 + i * 2, Math.round(value), true);
  }
  return buffer;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/** Convert a WAV ArrayBuffer to a base64 data URL for the runtime API. */
export function arrayBufferToWavDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}
