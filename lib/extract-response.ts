import type { TierSubcontractor } from '@/types/hpproto';

export interface SourcePageText {
  page: number;
  text: string;
}

export interface ExtractedDaily {
  tradePartnerName?: string;
  date?: string; // YYYY-MM-DD
  locationDescription?: string;
  workerCount?: number;
  totalHours?: number;
  crewBreakdown?: { craft: string; count: number }[];
  tierSubcontractors?: TierSubcontractor[];
  tierSubsSummary?: string;
  equipment?: string[];
  notes?: string;
  tradesAndFavors?: string;
  staCompleted?: boolean;
  emailRecipients?: string[];
  spokenTranscript?: string;
  sourcePages?: SourcePageText[];
}

export function unwrapExtractResponse(payload: unknown): ExtractedDaily {
  if (!payload || typeof payload !== 'object') return {};
  const record = payload as Record<string, unknown>;
  if (record.extracted && typeof record.extracted === 'object' && !Array.isArray(record.extracted)) {
    return record.extracted as ExtractedDaily;
  }
  const rest = { ...record };
  delete rest.success;
  delete rest.error;
  return rest as ExtractedDaily;
}

export function extractedDailyHasContent(extracted: ExtractedDaily): boolean {
  return Boolean(
    extracted.tradePartnerName ||
    extracted.locationDescription ||
    (typeof extracted.workerCount === 'number' && extracted.workerCount > 0) ||
    (typeof extracted.totalHours === 'number' && extracted.totalHours > 0) ||
    (extracted.crewBreakdown && extracted.crewBreakdown.length > 0) ||
    (extracted.tierSubcontractors && extracted.tierSubcontractors.length > 0) ||
    extracted.tierSubsSummary ||
    (extracted.equipment && extracted.equipment.length > 0) ||
    extracted.notes ||
    extracted.tradesAndFavors ||
    extracted.spokenTranscript ||
    extracted.sourcePages?.some((page) => page.text.trim()),
  );
}
