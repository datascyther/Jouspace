import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryHeader } from './MemoryHeader';

describe('MemoryHeader avatar', () => {
  it('renders the passed-in user initials', () => {
    render(<MemoryHeader userInitials="N" />);
    expect(screen.getByRole('button', { name: 'User profile' }).textContent).toBe('N');
  });

  it('falls back to "VU" when initials are not provided', () => {
    render(<MemoryHeader />);
    expect(screen.getByRole('button', { name: 'User profile' }).textContent).toBe('VU');
  });
});
