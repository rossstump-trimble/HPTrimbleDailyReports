import type { TierSubcontractor } from '@/types/hpproto';

export interface Fog617Capture {
  tradePartnerName?: string;
  submittedBy?: string;
  date?: string;
  locationDescription?: string;
  workerCount?: number;
  totalHours?: number;
  crewBreakdown?: { craft: string; count: number; hoursPerWorker?: number; totalHours?: number }[];
  equipment?: string[];
  notes?: string;
  staCompleted?: boolean;
  staFiles?: { fileName: string; filePath: string }[];
  tierSubcontractors?: TierSubcontractor[];
  tierSubsSummary?: string;
  tradesAndFavors?: string;
  isHpEmployee?: boolean;
}

const TITLE_MAX = 120;

export function buildDailyTitle(capture: Fog617Capture): string {
  const trade = (capture.tradePartnerName || '').trim();
  const location = (capture.locationDescription || '').trim();
  const title = [trade, location].filter(Boolean).join(' — ');
  if (!title) return 'Daily Report';
  return title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1)}…` : title;
}

export function buildDailyNarrative(capture: Fog617Capture): string {
  const reporter = capture.submittedBy?.trim();
  const crewLines = (capture.crewBreakdown ?? [])
    .filter((row) => row.craft)
    .map((row) => {
      const h = row.hoursPerWorker ?? 8;
      const tot = row.totalHours ?? row.count * h;
      return `${row.craft} (${row.count}) @ ${h}h = ${tot}h`;
    });
  const crew = crewLines.length > 0 ? crewLines.join('; ') : '—';
  const tierSubs =
    (capture.tierSubcontractors ?? []).length > 0
      ? (capture.tierSubcontractors ?? [])
          .map((s) => `${s.name} (${s.count} workers${s.trade ? ` · ${s.trade}` : ''})`)
          .join('; ')
      : capture.tierSubsSummary?.trim() || 'None';
  const equipment = (capture.equipment ?? []).filter(Boolean).join(', ');
  const trade = (capture.tradePartnerName || '').trim();

  const lines = [
    reporter ? `Reporter: ${reporter}` : '',
    `Trade partner: ${trade || '—'}`,
    `Location / work: ${capture.locationDescription?.trim() || '—'}`,
    `Headcount: ${capture.workerCount ?? 0}`,
    `Total hours: ${capture.totalHours ?? 0}`,
    `Crew breakdown: ${crew}`,
    `Tier subcontractors: ${tierSubs}`,
    `Equipment: ${equipment || '—'}`,
    `STA completed: ${capture.staCompleted ? 'yes' : 'no'}`,
    capture.tradesAndFavors ? `Trades & favors: ${capture.tradesAndFavors}` : '',
    `Notes: ${capture.notes?.trim() || '—'}`,
  ].filter(Boolean);
  return lines.join('\n');
}

export function mapFog617ToProjectSightBody(capture: Fog617Capture): Record<string, unknown> {
  const trade = (capture.tradePartnerName || '').trim();
  const location = (capture.locationDescription || '').trim();
  const effectiveLocation = location || 'Jobsite';
  const notes = (capture.notes || '').trim();
  const workDescription = location || buildDailyNarrative(capture);

  const crew = capture.crewBreakdown ?? [];
  const calculatedWorkerCount = crew.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
  const calculatedTotalHours = crew.reduce((sum, r) => {
    const count = Number(r.count) || 0;
    const hpp = Number(r.hoursPerWorker) || 8;
    const rowTotal = Number(r.totalHours) || count * hpp;
    return sum + rowTotal;
  }, 0);

  const workerCount = capture.workerCount || calculatedWorkerCount || 1;
  const totalHours = capture.totalHours || calculatedTotalHours || workerCount * 8;
  const hoursPerWorker =
    workerCount > 0 && totalHours > 0
      ? Math.round((totalHours / workerCount) * 10) / 10
      : 8;

  const dailyWorksItems: Record<string, unknown>[] = [];
  if (crew.length > 0) {
    for (const r of crew) {
      const cCount = Number(r.count) || 0;
      const cHpp = Number(r.hoursPerWorker) || 8.0;
      const cTotal = Number(r.totalHours) || cCount * cHpp;
      dailyWorksItems.push({
        CompanyName: trade || 'Trade Partner',
        Company: trade || 'Trade Partner',
        Trade: r.craft || trade || 'Trade Partner',
        TradePartner: trade || 'Trade Partner',
        WorkDescription: workDescription,
        Description: workDescription,
        WorkPerformed: location || workDescription,
        Workers: cCount,
        WorkerCount: cCount,
        ManpowerQty: cTotal,
        HoursPerDay: cHpp,
        TotalWork: cTotal,
        Status: 'Approved',
        StatusID: 69,
        DetailLevel: 'BasicWithWorkers',
        Location: effectiveLocation,
        LocationDescription: effectiveLocation,
        Notes: notes || '',
      });
    }
  } else {
    dailyWorksItems.push({
      CompanyName: trade || 'Trade Partner',
      Company: trade || 'Trade Partner',
      Trade: trade || 'Trade Partner',
      TradePartner: trade || 'Trade Partner',
      WorkDescription: workDescription,
      Description: workDescription,
      WorkPerformed: location || workDescription,
      Workers: workerCount,
      WorkerCount: workerCount,
      ManpowerQty: totalHours,
      HoursPerDay: hoursPerWorker,
      TotalWork: totalHours,
      Status: 'Approved',
      StatusID: 69,
      DetailLevel: 'BasicWithWorkers',
      Location: effectiveLocation,
      LocationDescription: effectiveLocation,
      Notes: notes || '',
    });
  }

  return {
    Date: capture.date || '',
    Title: buildDailyTitle(capture),
    Description: buildDailyNarrative(capture),
    TotalWorkersApproved: workerCount,
    TotalWorkApproved: totalHours,
    DailyWorks: dailyWorksItems,
    Works: dailyWorksItems,
  };
}
