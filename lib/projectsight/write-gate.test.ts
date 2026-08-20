import { describe, it, expect } from 'vitest';
import { collectionMethodAllowed, itemMethodAllowed, attachMethodAllowed } from './write-gate';

describe('write-gate', () => {
  it('allows GET and POST on the daily collection', () => {
    expect(collectionMethodAllowed('GET')).toBe(true);
    expect(collectionMethodAllowed('POST')).toBe(true);
    expect(collectionMethodAllowed('PUT')).toBe(false);
    expect(collectionMethodAllowed('PATCH')).toBe(false);
    expect(collectionMethodAllowed('DELETE')).toBe(false);
  });

  it('allows GET only on an existing daily item', () => {
    expect(itemMethodAllowed('GET')).toBe(true);
    expect(itemMethodAllowed('POST')).toBe(false);
    expect(itemMethodAllowed('PUT')).toBe(false);
    expect(itemMethodAllowed('PATCH')).toBe(false);
    expect(itemMethodAllowed('DELETE')).toBe(false);
  });

  it('allows POST on attach (file only)', () => {
    expect(attachMethodAllowed('POST')).toBe(true);
    expect(attachMethodAllowed('PUT')).toBe(false);
    expect(attachMethodAllowed('PATCH')).toBe(false);
  });
});
