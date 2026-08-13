import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { OverlayStackProvider } from '../hooks/useFocusTrap';
import { JournalScreenContent } from './JournalScreenContent';
import { readDraft } from '../utils/draft';

function renderComposer(props = {}) {
  return render(
    <OverlayStackProvider>
      <JournalScreenContent
        onBackToHome={() => {}}
        activeTab="journal"
        onTabChange={() => {}}
        {...props}
      />
    </OverlayStackProvider>
  );
}

describe('JournalScreenContent — Spaces selector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to the Journal space placeholders', () => {
    renderComposer();
    expect(
      screen.getByPlaceholderText("What I'm trying to understand")
    ).toBeTruthy();
    expect(screen.getByPlaceholderText('Write your thoughts quietly...')).toBeTruthy();
  });

  it('selecting a preset space updates placeholders, theme, and the draft', () => {
    renderComposer();
    const titleInput = screen.getByPlaceholderText(
      "What I'm trying to understand"
    );
    fireEvent.change(titleInput, { target: { value: 'A note' } });

    fireEvent.click(screen.getByLabelText('Choose a space'));
    const dialog = screen.getByRole('dialog', { name: 'Choose a space' });
    fireEvent.click(within(dialog).getByText('Gratitude'));

    expect(screen.getByPlaceholderText("Today I'm grateful for")).toBeTruthy();
    expect(screen.getByPlaceholderText('Even the smallest thing...')).toBeTruthy();

    const draft = readDraft();
    expect(draft?.theme).toBe('purpose');
    expect(draft?.spaceId).toBe('gratitude');
  });

  it('creating a custom theme sets its placeholders and persists it', () => {
    renderComposer();
    const titleInput = screen.getByPlaceholderText(
      "What I'm trying to understand"
    );
    fireEvent.change(titleInput, { target: { value: 'X' } });

    fireEvent.click(screen.getByLabelText('Choose a space'));
    fireEvent.click(screen.getByText('Create your own theme'));
    fireEvent.change(screen.getByLabelText('Theme name'), {
      target: { value: 'My Morning' },
    });
    fireEvent.change(screen.getByLabelText('Title placeholder'), {
      target: { value: 'Sunrise thoughts' },
    });
    fireEvent.click(screen.getByText('Create'));

    expect(screen.getByPlaceholderText('Sunrise thoughts')).toBeTruthy();
    const draft = readDraft();
    expect(draft?.theme).toBe('my_morning');
    expect(draft?.spaceId).toBe('custom');
    expect(draft?.customThemeId).toBe('my_morning');
  });
});
