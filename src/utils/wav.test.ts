import { describe, it, expect } from 'vitest';
import {
  downsample,
  encodeWav,
  arrayBufferToWavDataUrl,
} from './wav';

function ascii(view: DataView, offset: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(view.getUint8(offset + i));
  }
  return out;
}

describe('encodeWav', () => {
  it('writes a valid mono 16-bit PCM RIFF header', () => {
    const samples = new Float32Array([0.5, -0.5, 1, -1, 0]);
    const buffer = encodeWav(samples, 16000);
    expect(buffer.byteLength).toBe(44 + samples.length * 2);

    const view = new DataView(buffer);
    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + samples.length * 2);
    expect(ascii(view, 8, 4)).toBe('WAVE');
    expect(ascii(view, 12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint32(28, true)).toBe(16000 * 2); // byte rate
    expect(view.getUint16(32, true)).toBe(2); // block align
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(ascii(view, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(samples.length * 2);
  });

  it('maps [-1, 1] floats to signed 16-bit samples', () => {
    const samples = new Float32Array([1, -1, 0.5, -0.5, 0]);
    const view = new DataView(encodeWav(samples, 16000));
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
    expect(view.getInt16(48, true)).toBe(0x4000);
    expect(view.getInt16(50, true)).toBe(-0x4000);
    expect(view.getInt16(52, true)).toBe(0);
  });

  it('clamps out-of-range floats', () => {
    const view = new DataView(encodeWav(new Float32Array([5, -5]), 16000));
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });
});

describe('downsample', () => {
  it('returns the input unchanged when already at the target rate', () => {
    const samples = new Float32Array([0.1, 0.2, 0.3]);
    expect(downsample(samples, 16000, 16000)).toBe(samples);
  });

  it('averages consecutive samples when halving the rate', () => {
    const samples = new Float32Array([0, 2, 4, 6]);
    const out = downsample(samples, 16000, 8000);
    expect(out.length).toBe(2);
    expect(out[0]).toBeCloseTo(1);
    expect(out[1]).toBeCloseTo(5);
  });
});

describe('arrayBufferToWavDataUrl', () => {
  it('produces a data URL whose base64 decodes back to the bytes', () => {
    const buffer = new ArrayBuffer(6);
    new Uint8Array(buffer).set([1, 2, 3, 4, 5, 6]);
    const url = arrayBufferToWavDataUrl(buffer);
    expect(url.startsWith('data:audio/wav;base64,')).toBe(true);
    const decoded = atob(url.slice('data:audio/wav;base64,'.length));
    expect(Array.from(decoded).map((c) => c.charCodeAt(0))).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });
});
