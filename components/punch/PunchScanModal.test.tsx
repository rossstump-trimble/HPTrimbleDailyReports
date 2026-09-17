import { describe, it, expect } from 'vitest';
import { sanitizeImageForSecureSite, PunchScanModal } from './PunchScanModal';

describe('PunchScanModal Component', () => {
  it('exports PunchScanModal and sanitizeImageForSecureSite', () => {
    expect(PunchScanModal).toBeDefined();
    expect(sanitizeImageForSecureSite).toBeDefined();
  });

  it('sanitizes image and strips EXIF filename/metadata', async () => {
    const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
    const file = new File([blob], 'jobsite_photo_with_gps.jpg', { type: 'image/jpeg' });
    const sanitized = await sanitizeImageForSecureSite(file);
    expect(sanitized.name).toContain('sanitized_');
    expect(sanitized.type).toBe('image/jpeg');
  });
});
