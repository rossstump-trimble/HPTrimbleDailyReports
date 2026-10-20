import type { SourcePageText } from '@/lib/extract-response';

export type { SourcePageText };
export type SourcePreviewKind = 'image' | 'pdf' | 'text' | 'none';

export function sourcePreviewKind(file: File | null): SourcePreviewKind {
  if (!file) return 'none';
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/i.test(name)) return 'image';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    type.includes('spreadsheet') ||
    type === 'application/vnd.ms-excel' ||
    /\.(xlsx|xls|csv|txt)$/i.test(name)
  ) {
    return 'text';
  }
  return 'none';
}

export function sourcePageTextFor(
  pages: SourcePageText[] | undefined,
  page: number,
): string {
  if (!pages?.length) return '';
  return pages.find((entry) => entry.page === page)?.text ?? '';
}
