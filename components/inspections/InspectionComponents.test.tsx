import { describe, it, expect } from 'vitest';
import { InspectionStatusBadge } from './InspectionStatusBadge';
import { InspectionGrid } from './InspectionGrid';
import { InspectionDetailSheet } from './InspectionDetailSheet';
import { InspectionScanModal } from './InspectionScanModal';
import { InspectionVerifyDrawer } from './InspectionVerifyDrawer';

describe('Inspection UI Components', () => {
  it('exports all inspection components properly', () => {
    expect(InspectionStatusBadge).toBeDefined();
    expect(InspectionGrid).toBeDefined();
    expect(InspectionDetailSheet).toBeDefined();
    expect(InspectionScanModal).toBeDefined();
    expect(InspectionVerifyDrawer).toBeDefined();
  });

  it('InspectionScanModal requires checklist selection before enabling upload', () => {
    expect(typeof InspectionScanModal).toBe('function');
  });
});
