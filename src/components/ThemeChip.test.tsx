import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeChip } from './ThemeChip';

describe('ThemeChip', () => {
  it('renders a button when an onClick handler is supplied', () => {
    const onClick = vi.fn();
    const { container } = render(<ThemeChip label="clarity" onClick={onClick} />);
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    btn?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a non-interactive span when no onClick is supplied', () => {
    const { container } = render(<ThemeChip label="clarity" />);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('span')).not.toBeNull();
  });
});
