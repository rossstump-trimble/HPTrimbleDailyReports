import { describe, expect, it } from 'vitest';
import { sourcePageTextFor, sourcePreviewKind } from './source-preview';

describe('sourcePreviewKind', () => {
  it('detects images, PDFs, and other files', () => {
    expect(sourcePreviewKind(new File([], 'daily.jpg', { type: 'image/jpeg' }))).toBe('image');
    expect(sourcePreviewKind(new File([], 'scan.PNG', { type: '' }))).toBe('image');
    expect(sourcePreviewKind(new File([], 'report.pdf', { type: 'application/pdf' }))).toBe('pdf');
    expect(sourcePreviewKind(new File([], 'daily.xlsx', { type: '' }))).toBe('text');
    expect(sourcePreviewKind(null)).toBe('none');
  });
});

describe('sourcePageTextFor', () => {
  const pages = [
    { page: 1, text: 'cover' },
    { page: 2, text: 'crew hours' },
  ];

  it('returns the matching page text', () => {
    expect(sourcePageTextFor(pages, 2)).toBe('crew hours');
  });

  it('falls back to empty string when that page has no OCR', () => {
    expect(sourcePageTextFor(pages, 9)).toBe('');
    expect(sourcePageTextFor(undefined, 1)).toBe('');
  });
});
