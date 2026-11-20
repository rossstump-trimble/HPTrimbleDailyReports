import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DailyDetailModal, type BowlingCellDetail } from './DailyDetailModal';
import type { DailyReport } from '@/types/hpproto';

const baseReport: DailyReport = {
  id: 'r1',
  projectId: 'p1',
  tradePartnerId: 'tp1',
  tradePartnerName: 'Apex Electric',
  date: '2026-11-17',
  submittedAt: '2026-11-17T15:00:00Z',
  submittedBy: 'Foreman',
  locationDescription: 'Level 2 conduit rough-in',
  workerCount: 4,
  totalHours: 32,
  crewBreakdown: [],
  equipment: [],
  notes: '',
  staCompleted: true,
  emailRecipients: [],
};

function cellFor(report: DailyReport): BowlingCellDetail {
  return {
    date: report.date,
    dayNumber: 1,
    tradePartnerId: report.tradePartnerId,
    tradePartnerName: report.tradePartnerName,
    status: 'submitted',
    workerCount: report.workerCount,
    totalHours: report.totalHours,
    staCompleted: true,
    fullReport: report,
  };
}

describe('DailyDetailModal original wording', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ authenticated: false }) }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('offers the original wording when the report was submitted in another language', () => {
    const translated: DailyReport = {
      ...baseReport,
      originalLanguage: 'es',
      translationStatus: 'translated',
      originalText: {
        locationDescription: 'Instalación de tubería en el nivel 2',
        notes: '',
        tradesAndFavors: '',
        tierSubsSummary: '',
        equipment: [],
        crewCrafts: [],
        tierTrades: [],
      },
    };

    render(<DailyDetailModal open onOpenChange={() => {}} cell={cellFor(translated)} />);

    expect(screen.getByText(/View original wording/)).toBeTruthy();
    expect(screen.getByText('Instalación de tubería en el nivel 2')).toBeTruthy();
  });

  it('shows nothing extra for an English report', () => {
    render(<DailyDetailModal open onOpenChange={() => {}} cell={cellFor(baseReport)} />);

    expect(screen.queryByText(/View original wording/)).toBeNull();
  });
});
