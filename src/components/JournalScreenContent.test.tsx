import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayStackProvider } from '../hooks/useFocusTrap';
import { JournalScreenContent } from './JournalScreenContent';
import { readDraft } from '../utils/draft';
import { writeSpaceSelection } from '../utils/pickerStore';
import { saveCustomTheme } from '../utils/customThemes';

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

function typeBody(result: ReturnType<typeof renderComposer>, value: string) {
  const body = result.container.querySelector('#journal-body') as HTMLTextAreaElement;
  fireEvent.change(body, { target: { value } });
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

  it('opens the Space picker route with the current selection', () => {
    const onOpenSpacePicker = vi.fn();
    renderComposer({ onOpenSpacePicker });
    fireEvent.click(screen.getByLabelText('Choose a space'));
    expect(onOpenSpacePicker).toHaveBeenCalledWith('journal', null);
  });

  it('applying a preset space selection from the transient store updates placeholders, theme, and the draft', () => {
    writeSpaceSelection({ spaceId: 'gratitude', customThemeId: null });
    const result = renderComposer();
    typeBody(result, 'A note');

    expect(screen.getByPlaceholderText("Today I'm grateful for")).toBeTruthy();
    expect(screen.getByPlaceholderText('Even the smallest thing...')).toBeTruthy();

    const draft = readDraft();
    expect(draft?.theme).toBe('purpose');
    expect(draft?.spaceId).toBe('gratitude');

    // The one-shot selection is cleared after being consumed.
    expect(localStorage.getItem('jouspace:space:selection')).toBeNull();
  });

  it('applying a custom theme selection from the transient store sets its placeholders and persists it', () => {
    saveCustomTheme({
      id: 'my_morning',
      label: 'My Morning',
      placeholderTitle: 'Sunrise thoughts',
      placeholderBody: 'The day begins...',
    });
    writeSpaceSelection({ spaceId: 'custom', customThemeId: 'my_morning' });
    const result = renderComposer();
    typeBody(result, 'X');

    expect(screen.getByPlaceholderText('Sunrise thoughts')).toBeTruthy();
    const draft = readDraft();
    expect(draft?.theme).toBe('my_morning');
    expect(draft?.spaceId).toBe('custom');
    expect(draft?.customThemeId).toBe('my_morning');
  });
});
