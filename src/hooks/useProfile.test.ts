import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfile, deriveInitials, loadProfile } from './useProfile';

describe('deriveInitials', () => {
  it('derives two initials from multi-word names', () => {
    expect(deriveInitials('John Doe')).toBe('JD');
    expect(deriveInitials('Ada Lovelace Byron')).toBe('AB');
  });

  it('derives a single initial from one word', () => {
    expect(deriveInitials('You')).toBe('Y');
    expect(deriveInitials('Madonna')).toBe('M');
  });

  it('falls back to a default initial for blank input', () => {
    expect(deriveInitials('   ')).toBe('Y');
  });
});

describe('useProfile', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to a sensible name when storage is empty', () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.profile.displayName).toBe('You');
  });

  it('persists a saved display name and reads it back', () => {
    const { result } = renderHook(() => useProfile());
    act(() => result.current.setDisplayName('Jane Doe'));
    expect(result.current.profile.displayName).toBe('Jane Doe');

    const stored = JSON.parse(localStorage.getItem('jouspace:profile')!);
    expect(stored.displayName).toBe('Jane Doe');

    // A fresh hook reads the persisted value.
    const { result: result2 } = renderHook(() => useProfile());
    expect(result2.current.profile.displayName).toBe('Jane Doe');
  });

  it('loadProfile tolerates corrupt storage', () => {
    localStorage.setItem('jouspace:profile', '{not json');
    expect(() => loadProfile()).not.toThrow();
  });
});
