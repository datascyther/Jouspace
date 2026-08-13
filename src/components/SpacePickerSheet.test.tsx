import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayStackProvider } from '../hooks/useFocusTrap';
import { SpacePickerSheet, SPACES, getSpaceById, spaceForTheme } from './SpacePickerSheet';

function renderSheet(node: React.ReactElement) {
  return render(<OverlayStackProvider>{node}</OverlayStackProvider>);
}

const CUSTOM = {
  id: 'my_morning',
  label: 'My Morning',
  placeholderTitle: 'First light',
  placeholderBody: 'Today begins...',
};

describe('SpacePickerSheet', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the four preset spaces plus the create option', () => {
    renderSheet(
      <SpacePickerSheet
        isOpen
        onClose={() => {}}
        selectedSpaceId="journal"
        onSelectSpace={() => {}}
        onCreateCustomTheme={() => {}}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Choose a space' })).toBeTruthy();
    for (const space of SPACES) {
      expect(screen.getByText(space.label)).toBeTruthy();
    }
    expect(screen.getByText('Create your own theme')).toBeTruthy();
  });

  it('marks the selected space with aria-pressed', () => {
    renderSheet(
      <SpacePickerSheet
        isOpen
        onClose={() => {}}
        selectedSpaceId="gratitude"
        onSelectSpace={() => {}}
        onCreateCustomTheme={() => {}}
      />
    );
    const gratitude = screen.getByText('Gratitude').closest('button');
    expect(gratitude?.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onSelectSpace with the chosen space', () => {
    const onSelect = vi.fn();
    renderSheet(
      <SpacePickerSheet
        isOpen
        onClose={() => {}}
        selectedSpaceId="journal"
        onSelectSpace={onSelect}
        onCreateCustomTheme={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Gratitude'));
    expect(onSelect).toHaveBeenCalledWith(getSpaceById('gratitude'));
  });

  it('opens the create form and submits a slugged custom theme', () => {
    const onCreate = vi.fn();
    renderSheet(
      <SpacePickerSheet
        isOpen
        onClose={() => {}}
        selectedSpaceId="journal"
        onSelectSpace={() => {}}
        onCreateCustomTheme={onCreate}
      />
    );
    fireEvent.click(screen.getByText('Create your own theme'));
    expect(screen.getByRole('dialog', { name: 'Create your own theme' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Theme name'), {
      target: { value: 'My Morning Pages!' },
    });
    fireEvent.click(screen.getByText('Create'));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const created = onCreate.mock.calls[0][0];
    expect(created.id).toBe('my_morning_pages');
    expect(created.label).toBe('My Morning Pages!');
  });

  it('rejects a reserved theme name', () => {
    const onCreate = vi.fn();
    renderSheet(
      <SpacePickerSheet
        isOpen
        onClose={() => {}}
        selectedSpaceId="journal"
        onSelectSpace={() => {}}
        onCreateCustomTheme={onCreate}
      />
    );
    fireEvent.click(screen.getByText('Create your own theme'));
    fireEvent.change(screen.getByLabelText('Theme name'), {
      target: { value: 'Clarity' },
    });
    fireEvent.click(screen.getByText('Create'));
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('renders the active custom theme as the create row', () => {
    renderSheet(
      <SpacePickerSheet
        isOpen
        onClose={() => {}}
        selectedSpaceId="custom"
        onSelectSpace={() => {}}
        customTheme={CUSTOM}
        onCreateCustomTheme={() => {}}
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
