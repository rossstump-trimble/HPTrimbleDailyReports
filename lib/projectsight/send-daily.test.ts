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
  it('creates new daily report once then attaches the file', async () => {
    const createDailyReport = vi.fn().mockResolvedValue({
      id: '2',
      payload: { DailyReportID: 2, Date: '2026-08-20T00:00:00', WorkflowState: 4 },
    });
    const attachDailyReportFile = vi.fn().mockResolvedValue(undefined);
    const result = await sendFog617ToProjectSight(args, {
      createDailyReport,
      attachDailyReportFile,
    });
    expect(createDailyReport).toHaveBeenCalledTimes(1);
    expect(createDailyReport.mock.calls[0][3]).toEqual(
      expect.objectContaining({
        Title: 'ALC — Roof',
        TotalWorkApproved: 32,
        TotalWorkersApproved: 4,
      }),
    );
    expect(result).toEqual({ projectSightDailyId: '2', attached: true });
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
    expect(createDailyReport).toHaveBeenCalledTimes(1);
    expect(attachDailyReportFile).not.toHaveBeenCalled();
  });

  it('attaches multiple files when files array is provided', async () => {
    const createDailyReport = vi.fn().mockResolvedValue({ id: 'dr-4' });
    const attachDailyReportFile = vi.fn().mockResolvedValue(undefined);
    const result = await sendFog617ToProjectSight(
      {
        ...args,
        files: [
          { fileName: 'photo1.jpg', fileBytes: Buffer.from('img1'), mimeType: 'image/jpeg' },
          { fileName: 'photo2.jpg', fileBytes: Buffer.from('img2'), mimeType: 'image/jpeg' },
        ],
      },
      { createDailyReport, attachDailyReportFile },
    );
    expect(result).toEqual({ projectSightDailyId: 'dr-4', attached: true });
    expect(attachDailyReportFile).toHaveBeenCalledTimes(2);
  });

  it('attaches both daily capture files and STA form files with distinct prefixes', async () => {
    const createDailyReport = vi.fn().mockResolvedValue({ id: 'dr-100' });
    const attachDailyReportFile = vi.fn().mockResolvedValue(undefined);

    const files = [
      { fileName: 'fog617-sheet.jpg', fileBytes: Buffer.from('img1'), category: 'daily_capture' as const },
      { fileName: 'signed-sta.jpg', fileBytes: Buffer.from('img2'), category: 'sta_form' as const },
    ];

    const result = await sendFog617ToProjectSight(
      { ...args, files },
      { createDailyReport, attachDailyReportFile },
    );

    expect(result.attached).toBe(true);
    expect(attachDailyReportFile).toHaveBeenCalledTimes(2);
    expect(attachDailyReportFile.mock.calls[0][4]).toBe('Daily-Capture-1-fog617-sheet.jpg');
    expect(attachDailyReportFile.mock.calls[1][4]).toBe('STA-Form-1-signed-sta.jpg');
  });
});
