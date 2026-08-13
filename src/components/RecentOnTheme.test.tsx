import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentOnTheme } from './RecentOnTheme';
import type { Entry } from './EntryRow';

// Newest-first, mirroring how journal.entries is handed to the composer.
const entries: Entry[] = [
  { id: 'c1', date: 'Aug 7', title: 'Morning clarity', theme: 'clarity', content: 'one' },
  { id: 'c2', date: 'Aug 4', title: 'What I finally see', theme: 'clarity', content: 'two' },
  { id: 'c3', date: 'Jul 30', title: 'Making sense of it all', theme: 'clarity', content: 'three' },
  { id: 'c4', date: 'Jul 20', title: 'Fourth clarity', theme: 'clarity', content: 'four' },
  { id: 'p1', date: 'Aug 8', title: 'Deadline', theme: 'pressure', content: 'five' },
];

describe('RecentOnTheme', () => {
  it('renders nothing when the journal has no history on that theme', () => {
    const { container } = render(
      <RecentOnTheme theme="purpose" entries={entries} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only entries matching the selected theme', () => {
    render(<RecentOnTheme theme="clarity" entries={entries} />);
    expect(screen.getByText('Morning clarity')).toBeInTheDocument();
    expect(screen.queryByText('Deadline')).not.toBeInTheDocument();
  });

  it('caps the list at three rows while reporting the real total', () => {
    render(
      <RecentOnTheme
        theme="clarity"
        entries={entries}
        onExploreThread={vi.fn()}
      />
    );
    expect(screen.getByText('4 entries')).toBeInTheDocument();
    expect(screen.queryByText('Fourth clarity')).not.toBeInTheDocument();
    // 3 rows + the "Explore thread" action
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('excludes the entry currently being edited', () => {
    render(
      <RecentOnTheme theme="clarity" entries={entries} excludeId="c1" />
    );
    expect(screen.queryByText('Morning clarity')).not.toBeInTheDocument();
  });

  it('invokes onOpenEntry with the tapped entry', () => {
    const onOpenEntry = vi.fn();
    render(
      <RecentOnTheme theme="clarity" entries={entries} onOpenEntry={onOpenEntry} />
    );
    screen.getByText('Morning clarity').closest('button')?.click();
    expect(onOpenEntry).toHaveBeenCalledWith(entries[0]);
  });

  it('invokes onExploreThread with the theme id', () => {
    const onExploreThread = vi.fn();
    render(
      <RecentOnTheme
        theme="clarity"
        entries={entries}
        onExploreThread={onExploreThread}
      />
    );
    screen.getByRole('button', { name: /explore thread/i }).click();
    expect(onExploreThread).toHaveBeenCalledWith('clarity');
  });
});
