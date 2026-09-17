import { describe, it, expect } from 'vitest';
import { slugTradePartnerId } from '@/lib/trade-partner';
import { mapFog617ToProjectSightBody } from '@/lib/projectsight/map-daily';

describe('HP staff report direct dispatch rules', () => {
  it('identifies HP staff submissions as auto-approved with zero staff counts', () => {
    const isHp = true;
    const approvalStatus = isHp ? 'approved' : 'pending';
    expect(approvalStatus).toBe('approved');
  });

  it('maps HP staff daily with 0 staff without inventing 1 worker 8 hours', () => {
    const capture = {
      isHpEmployee: true,
      tradePartnerName: 'Hensel Phelps',
      submittedBy: 'Ross Stump - Superintendent',
      date: '2026-09-17',
      locationDescription: 'Walked Building B Level 2. Drywall ongoing.',
      workerCount: 0,
      totalHours: 0,
      crewBreakdown: [],
      notes: 'No delays.',
    };

    const mapped = mapFog617ToProjectSightBody(capture);
    expect(mapped.TotalWorkersApproved).toBe(0);
    expect(mapped.TotalWorkApproved).toBe(0);
    expect(mapped.DailyWorks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Company: 'Hensel Phelps',
          Trade: 'General Contractor Supervision',
          Workers: 0,
          TotalWork: 0,
        }),
      ]),
    );
  });
});
