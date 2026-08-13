import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Markdown } from './Markdown';

// Whole-response emphasis framing must never italicize the full reply, while
// inline *highlights* and **bold** must survive. See unwrapWholeEmphasis.
describe('Markdown', () => {
  it('renders plain text without italics', () => {
    const { container } = render(<Markdown text="Just a plain reply." />);
    expect(container.getElementsByTagName('em')).toHaveLength(0);
    expect(container).toHaveTextContent('Just a plain reply.');
  });

  it('unwraps a whole-reply single-asterisk frame', () => {
    const { container } = render(
      <Markdown text="*The grief is a companion, not a visitor.*" />
    );
    expect(container.getElementsByTagName('em')).toHaveLength(0);
    expect(container).toHaveTextContent('The grief is a companion, not a visitor.');
  });

  it('unwraps a whole-reply underscore frame', () => {
    const { container } = render(<Markdown text="_You are allowed to sit with the ache._" />);
    expect(container.getElementsByTagName('em')).toHaveLength(0);
    expect(container).toHaveTextContent('You are allowed to sit with the ache.');
  });

  it('keeps inline emphasis as the only italic highlight', () => {
    const { container } = render(
      <Markdown text="It is normal to keep replaying *that one conversation*." />
    );
    expect(container.getElementsByTagName('em')).toHaveLength(1);
  });

  it('keeps bold and inline emphasis in a mixed reply', () => {
    const { container } = render(<Markdown text="**You are enough.** And *this too* matters." />);
    expect(container.getElementsByTagName('strong')).toHaveLength(1);
    expect(container.getElementsByTagName('em')).toHaveLength(1);
  });

  it('does not mangle markdown list items', () => {
    const { container } = render(
      <Markdown text={'- first bullet\n- second bullet'} />
    );
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('drops a dangling opening asterisk mid-stream', () => {
    const { container } = render(<Markdown text="*You are going to make it through" />);
    expect(container).toHaveTextContent('You are going to make it through');
    expect(container.textContent).not.toContain('*');
  });
});
