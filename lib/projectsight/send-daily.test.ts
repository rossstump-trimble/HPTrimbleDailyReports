import { describe, it, expect, vi } from 'vitest';
import { sendFog617ToProjectSight } from './send-daily';
import { ProjectSightHttpError } from './client';

const capture = {
  tradePartnerName: 'ALC',
  date: '2026-08-20',
  locationDescription: 'Roof',
  workerCount: 4,
  totalHours: 32,
  crewBreakdown: [{ craft: 'Electrician', count: 4 }],
  equipment: ['Lift'],
  notes: 'ok',
  staCompleted: true,
};

const args = {
  token: 'tok',
  portfolioId: 'pf',
  projectId: 'pr',
  capture,
  fileName: 'FOG617.xlsx',
  fileBytes: Buffer.from('x'),
  mimeType: 'application/vnd.ms-excel',
};

describe('sendFog617ToProjectSight', () => {
  it('returns attached true when create and attach succeed', async () => {
    const createDailyReport = vi.fn().mockResolvedValue({ id: 'dr-1' });
    const attachDailyReportFile = vi.fn().mockResolvedValue(undefined);
    const result = await sendFog617ToProjectSight(args, {
      createDailyReport,
      attachDailyReportFile,
    });
    expect(result).toEqual({ projectSightDailyId: 'dr-1', attached: true });
    expect(attachDailyReportFile).toHaveBeenCalled();
  });

  it('does not attach when create fails', async () => {
    const createDailyReport = vi.fn().mockRejectedValue(new ProjectSightHttpError(500, 'nope'));
    const attachDailyReportFile = vi.fn();
    await expect(
      sendFog617ToProjectSight(args, { createDailyReport, attachDailyReportFile }),
    ).rejects.toMatchObject({ status: 500 });
    expect(attachDailyReportFile).not.toHaveBeenCalled();
  });

  it('returns attached false when attach fails after create', async () => {
    const createDailyReport = vi.fn().mockResolvedValue({ id: 'dr-2' });
    const attachDailyReportFile = vi.fn().mockRejectedValue(new ProjectSightHttpError(502, 'file fail'));
    const result = await sendFog617ToProjectSight(args, {
      createDailyReport,
      attachDailyReportFile,
    });
    expect(result.projectSightDailyId).toBe('dr-2');
    expect(result.attached).toBe(false);
    expect(result.attachError).toContain('file fail');
  });

  it('creates without attaching when there is no FOG 617 file', async () => {
    const createDailyReport = vi.fn().mockResolvedValue({ id: 'dr-3' });
    const attachDailyReportFile = vi.fn();
    const result = await sendFog617ToProjectSight(
      { ...args, fileBytes: undefined, fileName: undefined },
      { createDailyReport, attachDailyReportFile },
    );
    expect(result).toEqual({ projectSightDailyId: 'dr-3', attached: false });
    expect(attachDailyReportFile).not.toHaveBeenCalled();
  });
});
