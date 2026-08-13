import { describe, it, expect } from 'vitest';
import { detectSentiment } from './sentiment';

describe('detectSentiment', () => {
  it('returns null for empty or neutral text', () => {
    expect(detectSentiment('')).toBeNull();
    expect(
      detectSentiment('I went to the store and bought some bread.')
    ).toBeNull();
  });

  it('detects heavy sentiment with a gentle nudge', () => {
    const result = detectSentiment('I feel anxious about the deadline.');
    expect(result?.key).toBe('heavy');
    expect(result?.message).toContain('heavy');
  });

  it('detects positive sentiment', () => {
    expect(detectSentiment('I am so happy and excited today')?.key).toBe(
      'positive'
    );
  });

  it('detects calm sentiment', () => {
    expect(detectSentiment('I feel calm and grounded')?.key).toBe('calm');
  });

  it('resolves ties toward the more urgent sentiment', () => {
    // "anxious" (heavy) + "grateful" (positive) → heavy wins the tie.
    expect(detectSentiment('I feel anxious but also grateful')?.key).toBe(
      'heavy'
    );
  });

  it('matches whole words, not substrings', () => {
    // "anxiousness" is not the keyword "anxious" (word-boundary matching).
    expect(detectSentiment('I feel anxiousness about it')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectSentiment('I feel ANXIOUS')?.key).toBe('heavy');
  });
});
