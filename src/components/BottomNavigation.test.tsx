import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNavigation } from './BottomNavigation';

describe('BottomNavigation Memory tab', () => {
  it('renders the PiBrain glyph (an svg) for the Memory tab', () => {
    render(<BottomNavigation activeTab="memory" onTabChange={() => {}} />);
    const memoryBtn = screen.getByRole('button', { name: 'Memory' });
    expect(memoryBtn).toBeInTheDocument();
    expect(memoryBtn.querySelector('svg')).not.toBeNull();
  });
});
