import { describe, it, expect } from 'vitest';
import { classifyIntent, anyOffDomain } from '../guard.js';

describe('guard.classifyIntent', () => {
  it('allows ordinary reflective writing', () => {
    expect(classifyIntent('I feel anxious about my relationship with my dad.')).toBe('allow');
    expect(classifyIntent('Lately I keep circling back to whether to change careers.')).toBe('allow');
    expect(classifyIntent('')).toBe('allow');
  });

  it('denies coding / general-assistant intent', () => {
    expect(classifyIntent('write a function that returns the fibonacci sequence')).toBe('deny');
    expect(classifyIntent('fix this bug: undefined is not a function')).toBe('deny');
    expect(classifyIntent('```python\nprint("hi")\n```')).toBe('deny');
    expect(classifyIntent('write me an email to my boss about taking friday off')).toBe('deny');
  });

  it('denies homework / math / news / professional advice', () => {
    expect(classifyIntent('solve for x in 2x + 3 = 11 for my homework')).toBe('deny');
    expect(classifyIntent('what is today’s stock market news?')).toBe('deny');
    expect(classifyIntent('what medication should I take for my headache?')).toBe('deny');
  });

  it('anyOffDomain aggregates multiple segments', () => {
    expect(anyOffDomain('I felt low today', 'can you write my resume?')).toBe(true);
    expect(anyOffDomain('I felt low today', 'I went for a walk')).toBe(false);
    expect(anyOffDomain(undefined, 'translate this paragraph for me')).toBe(true);
  });

  it('does not false-positive on reflective text containing code-like words', () => {
    // "function" alone isn't enough; the regex requires a stronger signal.
    expect(classifyIntent('I keep thinking about the function my family plays in my life.')).toBe('allow');
  });
});
