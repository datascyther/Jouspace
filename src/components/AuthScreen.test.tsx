import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthScreen } from './AuthScreen';

/**
 * Contract tests for the auth canvas scroll behaviour.
 *
 * The auth shell is a scroll container, so per CSS its `overflow-x` computes
 * to `auto` whenever `overflow-y` is `auto` and `overflow-x` is left `visible`.
 * That made the whole screen draggable sideways — including via the ambient
 * orbs, which sit outside the box. jsdom has no layout engine, so these assert
 * the class contract that prevents it rather than rendered geometry.
 */

function renderAuth() {
  return render(<AuthScreen onAuthed={() => {}} />);
}

function shellOf(container: HTMLElement): HTMLElement {
  const shell = container.firstElementChild;
  if (!shell) throw new Error('AuthScreen rendered no shell');
  return shell as HTMLElement;
}

describe('AuthScreen scroll contract', () => {
  it('never allows a horizontal pan, on any view', () => {
    const { container } = renderAuth();
    const shell = shellOf(container);

    expect(shell.className).toContain('overflow-x-hidden');
    expect(shell.className).toContain('overscroll-none');
    expect(shell.className).toContain('touch-pan-y');
    // Vertical scrolling stays available — the forms need it when the
    // keyboard opens, and a fitted welcome view has no range to travel.
    expect(shell.className).toContain('overflow-y-auto');

    // Create Account
    fireEvent.click(screen.getByRole('button', { name: /Continue writing/i }));
    expect(shellOf(container).className).toContain('overflow-x-hidden');
    expect(shellOf(container).className).toContain('touch-pan-y');

    // Back to welcome, then Sign In
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    expect(shellOf(container).className).toContain('overflow-x-hidden');
    expect(shellOf(container).className).toContain('touch-pan-y');
  });

  it('clips the ambient orbs inside their own non-interactive layer', () => {
    const { container } = renderAuth();
    const orb = container.querySelector('.auth-orb');
    expect(orb).not.toBeNull();

    const layer = orb?.parentElement;
    expect(layer).not.toBeNull();
    expect(layer?.className).toContain('overflow-hidden');
    expect(layer?.className).toContain('pointer-events-none');
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    // The layer is exactly the size of the shell, so it contributes no
    // scrollable overflow of its own.
    expect(layer?.className).toContain('inset-0');
  });

  it('keeps the back affordance inside the box on every form view', () => {
    renderAuth();

    // Welcome has no back affordance.
    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();

    // Forms do — and their top inset is held at >= 56px so the `-top-14`
    // positioned button can never escape above the scroll box.
    fireEvent.click(screen.getByRole('button', { name: /Continue writing/i }));
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    const formColumn = screen.getByRole('button', { name: 'Go back' }).parentElement;
    expect(formColumn).not.toBeNull();

    const paddedParent = formColumn?.parentElement;
    expect(paddedParent?.className).toContain('pt-auth-form');
  });
});
