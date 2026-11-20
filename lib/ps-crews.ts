import type { CompanyCrew } from '@/types/hpproto';

export interface PsCrew {
  psCrewId: number;
  name: string;
  workers?: number;
}

export function psCrewsFromCompany(raw: Record<string, unknown>): PsCrew[] {
  if (!Array.isArray(raw.Crews)) return [];
  const crews: PsCrew[] = [];
  for (const entry of raw.Crews) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (row.Deleted === true) continue;
    const psCrewId = Number(row.CrewID);
    const name = String(row.CrewName ?? '').trim();
    if (!Number.isFinite(psCrewId) || psCrewId <= 0 || !name) continue;
    // ProjectSight gives every company an unnamed default crew; it is not a real crew to pick.
    if (row.IsDefault === true && name.toUpperCase() === 'N/A') continue;
    const workers = Number(row.Workers);
    crews.push({ psCrewId, name, ...(Number.isFinite(workers) ? { workers } : {}) });
  }
  return crews;
}

// A hand-typed crew with the same name is linked rather than duplicated, so reports
// already filed under it start carrying the real ProjectSight crew id.
export function mergePsCrews(existing: CompanyCrew[] | undefined, incoming: PsCrew[]): CompanyCrew[] {
  const merged = (existing ?? []).map((crew) => ({ ...crew }));
  for (const crew of incoming) {
    const match =
      merged.find((c) => c.psCrewId === crew.psCrewId) ??
      merged.find((c) => c.psCrewId == null && c.name.trim().toLowerCase() === crew.name.toLowerCase());
    if (match) {
      match.name = crew.name;
      match.psCrewId = crew.psCrewId;
    } else {
      merged.push({ id: `ps-crew-${crew.psCrewId}`, name: crew.name, psCrewId: crew.psCrewId });
    }
  }
  return merged;
}
