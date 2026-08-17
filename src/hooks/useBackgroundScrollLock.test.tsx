import { describe, it, expect } from 'vitest';
import { useRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import { useBackgroundScrollLock } from './useBackgroundScrollLock';

function TestComp({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useBackgroundScrollLock(active, ref);
  return (
    <div ref={ref}>
      <div data-testid="scroller" style={{ overflowY: 'auto' }}>
        content
      </div>
      <div data-testid="plain">content</div>
    </div>
  );
}

describe('useBackgroundScrollLock', () => {
  it('hides overflow on auto scrollers while active and restores on unmount', () => {
    const { getByTestId } = render(<TestComp active={true} />);
    const scroller = getByTestId('scroller') as HTMLDivElement;
    const plain = getByTestId('plain') as HTMLDivElement;

    expect(scroller.style.overflow).toBe('hidden');
    expect(plain.style.overflow).toBe('');

    cleanup();
    expect(scroller.style.overflow).toBe('auto');
  });

  it('only locks scrollers (overflow auto/scroll), not visible containers', () => {
    function Mixed() {
      const ref = useRef<HTMLDivElement>(null);
      useBackgroundScrollLock(true, ref);
      return (
        <div ref={ref}>
          <div data-testid="auto" style={{ overflowY: 'auto' }}>
            a
          </div>
          <div data-testid="scroll" style={{ overflowY: 'scroll' }}>
            s
          </div>
          <div data-testid="visible" style={{ overflowY: 'visible' }}>
            v
          </div>
        </div>
      );
    }
    const { getByTestId } = render(<Mixed />);
    expect((getByTestId('auto') as HTMLDivElement).style.overflow).toBe('hidden');
    expect((getByTestId('scroll') as HTMLDivElement).style.overflow).toBe('hidden');
    expect((getByTestId('visible') as HTMLDivElement).style.overflow).toBe('');
  });
});
