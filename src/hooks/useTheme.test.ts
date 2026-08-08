import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, readTheme, applyTheme, resolveTheme } from './useTheme';

function mockMediaQuery(matches: boolean) {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (document.documentElement.dataset as any).theme;
    vi.restoreAllMocks();
  });

  it('defaults to system and resolves based on media query', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((_query) =>
      mockMediaQuery(false)
    );
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('resolves system to dark when prefers-color-scheme is dark', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((_query) =>
      mockMediaQuery(true)
    );
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('applies and persists a dark theme', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((_query) =>
      mockMediaQuery(false)
    );
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('jouspace:theme')).toBe('dark');
  });

  it('applies and persists a light theme', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((_query) =>
      mockMediaQuery(false)
    );
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('light'));
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('jouspace:theme')).toBe('light');
  });

  it('persists system preference', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((_query) =>
      mockMediaQuery(false)
    );
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('system'));
    expect(result.current.theme).toBe('system');
    expect(localStorage.getItem('jouspace:theme')).toBe('system');
  });

  it('readTheme returns the persisted value', () => {
    localStorage.setItem('jouspace:theme', 'dark');
    expect(readTheme()).toBe('dark');
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('readTheme returns system when nothing persisted', () => {
    expect(readTheme()).toBe('system');
  });

  it('resolveTheme handles all preference values', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((_query) =>
      mockMediaQuery(true)
    );
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('system')).toBe('dark');
  });
});
