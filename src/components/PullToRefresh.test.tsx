import { describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { PullToRefresh } from './PullToRefresh';

/**
 * jsdom has no TouchEvent constructor, so build plain bubbled Events with a
 * synthetic `touches` array (what the gesture reads).
 */
function fireTouch(el: Element, type: 'touchstart' | 'touchmove' | 'touchend', y: number) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', {
    value: type === 'touchend' ? [] : [{ clientY: y, identifier: 1 }],
    configurable: true,
  });
  Object.defineProperty(ev, 'changedTouches', {
    value: [{ clientY: y, identifier: 1 }],
    configurable: true,
  });
  el.dispatchEvent(ev);
  return ev;
}

/** Drag: start → move → end. `dy` is the total finger travel downward. */
function drag(el: Element, startY: number, dy: number) {
  fireTouch(el, 'touchstart', startY);
  fireTouch(el, 'touchmove', startY + dy);
  fireTouch(el, 'touchend', startY + dy);
}

function setup(props: { onRefresh?: () => Promise<void> | void; onError?: (m: string) => void; disabled?: boolean } = {}) {
  const onRefresh = props.onRefresh ?? vi.fn(() => Promise.resolve());
  const onError = props.onError ?? vi.fn();
  const utils = render(
    <PullToRefresh onRefresh={onRefresh} onError={onError} disabled={props.disabled} className="px-4">
      <ul>
        <li>entry one</li>
        <li>entry two</li>
      </ul>
    </PullToRefresh>
  );
  const scroll = utils.container.querySelector('.ptr-scroll') as HTMLElement;
  return { onRefresh, onError, scroll, ...utils };
}

describe('PullToRefresh', () => {
  it('renders children inside the scroll container', () => {
    const { getByText } = setup();
    expect(getByText('entry one')).toBeTruthy();
    expect(getByText('entry two')).toBeTruthy();
  });

  it('does not fire onRefresh for a sub-threshold pull', () => {
    const { onRefresh, scroll } = setup();
    drag(scroll, 100, 100); // dy=100 → pull = 40 < 72
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('fires onRefresh once past the threshold and shows the indicator', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );
    const { scroll, getByLabelText, queryByLabelText } = setup({ onRefresh });
    await act(async () => {
      drag(scroll, 100, 300); // dy=300 → pull = 80 ≥ 72
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Refreshing')).toBeTruthy();

    await act(async () => {
      resolveRefresh();
      await Promise.resolve();
    });
    expect(queryByLabelText('Refreshing')).toBeNull();
  });

  it('ignores a second pull while a refresh is already in flight', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );
    const { scroll } = setup({ onRefresh });

    await act(async () => {
      drag(scroll, 100, 300);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Attempt a concurrent pull while the first refresh is still pending.
    await act(async () => {
      drag(scroll, 100, 300);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefresh();
      await Promise.resolve();
    });
  });

  it('routes a rejected refresh to onError and still settles the indicator', async () => {
    const onRefresh = vi.fn(() => Promise.reject(new Error('boom')));
    const onError = vi.fn();
    const { scroll, queryByLabelText } = setup({ onRefresh, onError });

    await act(async () => {
      drag(scroll, 100, 300);
    });
    await act(async () => {});

    expect(onError).toHaveBeenCalledWith('boom');
    expect(queryByLabelText('Refreshing')).toBeNull();
  });

  it('does not start a pull when the container has scrolled content', () => {
    const { onRefresh, scroll } = setup();
    scroll.scrollTop = 120;
    drag(scroll, 100, 300);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('does not fire onRefresh while disabled', () => {
    const { onRefresh, scroll } = setup({ disabled: true });
    drag(scroll, 100, 300);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
