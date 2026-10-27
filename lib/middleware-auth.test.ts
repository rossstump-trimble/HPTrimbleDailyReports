import { describe, it, expect } from 'vitest';
import { isPublicIntakePath } from './middleware-auth';

describe('isPublicIntakePath', () => {
  it('allows trade partner intake path as public', () => {
    expect(isPublicIntakePath('/intake/1025')).toBe(true);
    expect(isPublicIntakePath('/api/intake/submit')).toBe(true);
    expect(isPublicIntakePath('/api/intake/extract')).toBe(true);
  });

  it('protects HP staff intake path and internal APIs from public access', () => {
    expect(isPublicIntakePath('/intake/1025/hp')).toBe(false);
    expect(isPublicIntakePath('/intake/project-abc/hp')).toBe(false);
    expect(isPublicIntakePath('/intake/1025/hp/')).toBe(false);
    expect(isPublicIntakePath('/api/bowling/1025')).toBe(false);
    expect(isPublicIntakePath('/api/v1/feedback/tasks')).toBe(false);
    expect(isPublicIntakePath('/admin')).toBe(false);
  });
});
