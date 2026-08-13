import { describe, it, expect } from 'vitest';
import { MessageSchema, EntrySchema, ProfileSchema } from '../schemas.js';

describe('schemas.MessageSchema', () => {
  it('rejects the system role', () => {
    const result = MessageSchema.safeParse({ role: 'system', content: 'hi' });
    expect(result.success).toBe(false);
  });

  it('accepts user and assistant roles', () => {
    expect(MessageSchema.safeParse({ role: 'user', content: 'hi' }).success).toBe(true);
    expect(MessageSchema.safeParse({ role: 'assistant', content: 'hi' }).success).toBe(true);
  });

  it('rejects empty content', () => {
    expect(MessageSchema.safeParse({ role: 'user', content: '' }).success).toBe(false);
  });
});

describe('schemas.EntrySchema', () => {
  it('caps content at 8000 chars', () => {
    const ok = EntrySchema.safeParse({
      id: '1',
      date: 'Aug 1',
      title: 't',
      theme: 'clarity',
      content: 'x'.repeat(8000),
    });
    expect(ok.success).toBe(true);
    const tooLong = EntrySchema.safeParse({
      id: '1',
      date: 'Aug 1',
      title: 't',
      theme: 'clarity',
      content: 'x'.repeat(8001),
    });
    expect(tooLong.success).toBe(false);
  });
});

describe('schemas.ProfileSchema', () => {
  it('accepts a well-formed profile and bounds personalization', () => {
    expect(
      ProfileSchema.safeParse({
        userName: 'Vera',
        topThemes: ['clarity', 'rest'],
        personalization: 'x'.repeat(2000),
      }).success
    ).toBe(true);
    expect(
      ProfileSchema.safeParse({ personalization: 'x'.repeat(2001) }).success
    ).toBe(false);
  });
});
