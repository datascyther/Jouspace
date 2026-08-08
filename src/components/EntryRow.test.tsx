import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntryRow, type Entry } from './EntryRow';

const entry: Entry = {
  id: 'e1',
  date: 'Aug 1',
  title: 'My first entry',
  theme: 'clarity',
  content: 'hello',
};

describe('EntryRow', () => {
  it('renders a semantic button with an accessible label', () => {
    render(<EntryRow entry={entry} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('aria-label')).toContain('My first entry');
  });

  it('invokes onClick with the entry', () => {
    const onClick = vi.fn();
    render(<EntryRow entry={entry} onClick={onClick} />);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledWith(entry);
  });
});
