export interface Fog617Capture {
  tradePartnerName?: string;
  date?: string;
  locationDescription?: string;
  workerCount?: number;
  totalHours?: number;
  crewBreakdown?: { craft: string; count: number }[];
  equipment?: string[];
  notes?: string;
  staCompleted?: boolean;
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
  const crew = (capture.crewBreakdown ?? [])
    .filter((row) => row.craft)
    .map((row) => `${row.craft} (${row.count})`)
    .join('; ');
  const equipment = (capture.equipment ?? []).filter(Boolean).join(', ');
  const lines = [
    `Location / work: ${capture.locationDescription?.trim() || '—'}`,
    `Headcount: ${capture.workerCount ?? 0}`,
    `Total hours: ${capture.totalHours ?? 0}`,
    `Crew: ${crew || '—'}`,
    `Equipment: ${equipment || '—'}`,
    `STA completed: ${capture.staCompleted ? 'yes' : 'no'}`,
    `Notes: ${capture.notes?.trim() || '—'}`,
  ];
  return lines.join('\n');
}

export function mapFog617ToProjectSightBody(capture: Fog617Capture): Record<string, unknown> {
  return {
    Date: capture.date || '',
    Title: buildDailyTitle(capture),
    Description: buildDailyNarrative(capture),
  };
}
