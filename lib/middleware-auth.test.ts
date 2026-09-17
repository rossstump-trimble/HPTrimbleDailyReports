import { describe, it, expect } from 'vitest';
import { isPublicIntakePath } from './middleware-auth';

describe('isPublicIntakePath', () => {
  it('allows trade partner intake path as public', () => {
    expect(isPublicIntakePath('/intake/1025')).toBe(true);
    expect(isPublicIntakePath('/api/intake/submit')).toBe(true);
    expect(isPublicIntakePath('/api/intake/extract')).toBe(true);
  });

  it('protects HP staff intake path from public access', () => {
    expect(isPublicIntakePath('/intake/1025/hp')).toBe(false);
    expect(isPublicIntakePath('/intake/project-abc/hp')).toBe(false);
    expect(isPublicIntakePath('/intake/1025/hp/')).toBe(false);
  });
});
