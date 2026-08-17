import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayStackProvider } from '../hooks/useFocusTrap';
import {
  SpacePickerScreen,
  SPACES,
  spaceForTheme,
} from './SpacePickerSheet';

function renderScreen(node: React.ReactElement) {
  return render(<OverlayStackProvider>{node}</OverlayStackProvider>);
}

const CUSTOM = {
  id: 'my_morning',
  label: 'My Morning',
  placeholderTitle: 'First light',
  placeholderBody: 'Today begins...',
};

describe('SpacePickerScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the four preset spaces plus the create option', () => {
    renderScreen(<SpacePickerScreen initialSelectedId="journal" onBack={() => {}} />);
    for (const space of SPACES) {
      expect(screen.getByText(space.label)).toBeTruthy();
    }
    expect(screen.getByText('Create your own theme')).toBeTruthy();
  });

  it('marks the selected space with aria-pressed', () => {
    renderScreen(<SpacePickerScreen initialSelectedId="gratitude" onBack={() => {}} />);
    const gratitude = screen.getByText('Gratitude').closest('button');
    expect(gratitude?.getAttribute('aria-pressed')).toBe('true');
  });

  it('writes the chosen space to the transient store on select', () => {
    renderScreen(<SpacePickerScreen initialSelectedId="journal" onBack={() => {}} />);
    fireEvent.click(screen.getByText('Gratitude'));
    const sel = JSON.parse(localStorage.getItem('jouspace:space:selection')!);
    expect(sel).toEqual({ spaceId: 'gratitude', customThemeId: null });
  });

  it('opens the create form and submits a slugged custom theme', () => {
    renderScreen(<SpacePickerScreen initialSelectedId="journal" onBack={() => {}} />);
    fireEvent.click(screen.getByText('Create your own theme'));
    expect(screen.getByText('Set the tone and placeholders for this space')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Theme name'), {
      target: { value: 'My Morning Pages!' },
    });
    fireEvent.click(screen.getByText('Create'));

    const sel = JSON.parse(localStorage.getItem('jouspace:space:selection')!);
    expect(sel.spaceId).toBe('custom');
    expect(sel.customThemeId).toBe('my_morning_pages');

    // The custom theme is persisted globally.
    const stored = JSON.parse(localStorage.getItem('jouspace:spaces:custom')!);
    expect(stored[0].id).toBe('my_morning_pages');
    expect(stored[0].label).toBe('My Morning Pages!');
  });

  it('rejects a reserved theme name', () => {
    renderScreen(<SpacePickerScreen initialSelectedId="journal" onBack={() => {}} />);
    fireEvent.click(screen.getByText('Create your own theme'));
    fireEvent.change(screen.getByLabelText('Theme name'), {
      target: { value: 'Clarity' },
    });
    fireEvent.click(screen.getByText('Create'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(localStorage.getItem('jouspace:space:selection')).toBeNull();
  });

  it('renders the active custom theme as the create row', () => {
    renderScreen(
      <SpacePickerScreen
        initialSelectedId="custom"
        initialCustom={{ name: CUSTOM.label, cTitle: CUSTOM.placeholderTitle, cBody: CUSTOM.placeholderBody }}
        onBack={() => {}}
      />
    );
    expect(screen.getByText(CUSTOM.label)).toBeTruthy();
    const row = screen.getByText(CUSTOM.label).closest('button');
    expect(row?.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('spaceForTheme', () => {
  it('maps default themes back to their Space', () => {
    expect(spaceForTheme('purpose').id).toBe('gratitude');
    expect(spaceForTheme('discipline').id).toBe('note');
  });

  it('falls back to Journal for unknown themes', () => {
    expect(spaceForTheme('starting_again').id).toBe('journal');
    expect(spaceForTheme('mystery').id).toBe('journal');
  });
});
