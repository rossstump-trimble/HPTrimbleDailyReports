import { describe, expect, it, vi } from 'vitest';
import type { DailyReport } from '@/types/hpproto';
import { ProjectSightHttpError } from './client';
import { sendSavedDailyToProjectSight } from './send-intake-daily';

const report: DailyReport = {
  id: 'local-1',
  projectId: 'cys07',
  tradePartnerId: 'titan-electric',
  tradePartnerName: 'Titan Electric',
  date: '2026-08-20',
  submittedAt: '2026-08-20T20:26:25.287Z',
  locationDescription: 'Arena wall',
  workerCount: 12,
  totalHours: 0,
  crewBreakdown: [],
  equipment: [],
  notes: '',
  staCompleted: true,
  emailRecipients: [],
};

const destination = {
  portfolioId: 'pf-1',
  projectId: 'ps-project-1',
  portfolioName: 'HP',
  projectName: 'CYS07',
};

describe('sendSavedDailyToProjectSight', () => {
  it('rejects when the user is not signed in with Trimble Identity', async () => {
    const result = await sendSavedDailyToProjectSight({
      token: null,
      destination,
      report,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  it('rejects when no ProjectSight destination is selected', async () => {
    const result = await sendSavedDailyToProjectSight({
      token: 'tid-token',
      destination: null,
      report,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it('creates the ProjectSight daily and stamps the local report', async () => {
    const send = vi.fn().mockResolvedValue({ projectSightDailyId: 'dr-9', attached: true });
    const mark = vi.fn().mockImplementation((_id: string, meta: { projectSightDailyId: string }) => ({
      ...report,
      ...meta,
    }));
    const result = await sendSavedDailyToProjectSight(
      {
        token: 'tid-token',
        destination,
        report,
        fileBytes: Buffer.from('jpg'),
        fileName: 'daily.jpg',
        mimeType: 'image/jpeg',
      },
      { send, mark },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.projectSightDailyId).toBe('dr-9');
      expect(result.attached).toBe(true);
    }
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'tid-token',
        portfolioId: 'pf-1',
        projectId: 'ps-project-1',
        fileName: 'daily.jpg',
      }),
    );
  });

  it('returns a ProjectSight error without marking the local daily sent', async () => {
    const send = vi.fn().mockRejectedValue(new ProjectSightHttpError(403, 'nope'));
    const mark = vi.fn();
    const result = await sendSavedDailyToProjectSight(
      { token: 'tid-token', destination, report },
      { send, mark },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
    expect(mark).not.toHaveBeenCalled();
  });
});
