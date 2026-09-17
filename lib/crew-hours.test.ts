import { describe, it, expect } from 'vitest';
import { calculateCrewTotals } from './crew-hours';

describe('calculateCrewTotals', () => {
  it('accurately computes total worker count and total hours from crew breakdown', () => {
    const crew = [
      { craft: 'Journeyman Electrician', count: 4, hoursPerWorker: 8 },
      { craft: 'Apprentice', count: 2, hoursPerWorker: 4 },
      { craft: 'Foreman', count: 1, hoursPerWorker: 9.5 },
    ];
    const totals = calculateCrewTotals(crew);
    expect(totals.workerCount).toBe(7);
    expect(totals.totalHours).toBe(49.5);
    expect(totals.updatedCrew[0].totalHours).toBe(32);
    expect(totals.updatedCrew[1].totalHours).toBe(8);
    expect(totals.updatedCrew[2].totalHours).toBe(9.5);
  });
});
