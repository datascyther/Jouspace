import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('imports homeService', async () => {
    const mod = await import('@/features/home/services/HomeService');
    expect(mod).toBeTruthy();
  });
});
