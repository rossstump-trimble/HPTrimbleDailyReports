import { describe, it, expect, vi, beforeAll } from 'vitest';
import { sanitizeImageForSecureSite, PunchScanModal } from './PunchScanModal';

describe('PunchScanModal Component', () => {
  beforeAll(() => {
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = vi.fn();
    }
  });

  it('exports PunchScanModal and sanitizeImageForSecureSite', () => {
    expect(PunchScanModal).toBeDefined();
    expect(sanitizeImageForSecureSite).toBeDefined();
  });

  it('sanitizes image and strips EXIF filename/metadata', async () => {
    // In jsdom Image does not trigger onload by default without a real image or simulated event
    const originalImage = global.Image;
    try {
      global.Image = class {
        onload: () => void = () => {};
        width = 100;
        height = 100;
        set src(_v: string) {
          setTimeout(() => this.onload(), 10);
        }
      } as unknown as typeof Image;

      const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
      const file = new File([blob], 'jobsite_photo_with_gps.jpg', { type: 'image/jpeg' });
      const sanitized = await sanitizeImageForSecureSite(file);
      expect(sanitized.name).toContain('sanitized_');
      expect(sanitized.type).toBe('image/jpeg');
    } finally {
      global.Image = originalImage;
    }
  });
});
