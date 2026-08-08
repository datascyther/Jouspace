import { describe, it, expect } from 'vitest';
import { validateProfileName, isValidRuntimeUrl } from './validation';

describe('validateProfileName', () => {
  it('rejects empty / whitespace-only names', () => {
    expect(validateProfileName('').valid).toBe(false);
    expect(validateProfileName('   ').valid).toBe(false);
  });

  it('rejects names longer than 40 characters', () => {
    const long = 'x'.repeat(41);
    const result = validateProfileName(long);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects control characters', () => {
    expect(validateProfileName('Bad\u0007Name').valid).toBe(false);
  });

  it('accepts a trimmed valid name', () => {
    const result = validateProfileName('  Jane Doe  ');
    expect(result.valid).toBe(true);
  });

  it('trims before length check (40 visible chars ok)', () => {
    expect(validateProfileName('x'.repeat(40)).valid).toBe(true);
  });
});

describe('isValidRuntimeUrl', () => {
  it('treats empty as valid (cleared)', () => {
    expect(isValidRuntimeUrl('')).toBe(true);
    expect(isValidRuntimeUrl('   ')).toBe(true);
  });

  it('accepts http and https URLs', () => {
    expect(isValidRuntimeUrl('http://localhost:3001')).toBe(true);
    expect(isValidRuntimeUrl('https://runtime.example.com')).toBe(true);
  });

  it('rejects non-URL strings', () => {
    expect(isValidRuntimeUrl('not a url')).toBe(false);
    expect(isValidRuntimeUrl('ftp://example.com')).toBe(false);
  });
});
