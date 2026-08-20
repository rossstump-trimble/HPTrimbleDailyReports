export interface CpmResult {
  isCritical: boolean;
  totalFloat: number;
  freeFloat: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
}

export interface CpmDependency {
  predecessor_id: string;
  successor_id: string;
  type: "FS" | "SS" | "FF" | "SF";
  lag: number;
}

interface CpmActivity {
  id: string;
  duration: number;
  start_date: string | null;
  parent_id: string | null;
}

export function calculateCPM(
  activities: CpmActivity[],
  dependencies: CpmDependency[]
): Map<string, CpmResult> {
  const results = new Map<string, CpmResult>();

  const leafActivities = activities.filter(
    (a) => !activities.some((c) => c.parent_id === a.id)
  );

  const adjSucc = new Map<string, CpmDependency[]>();
  const adjPred = new Map<string, CpmDependency[]>();
  for (const d of dependencies) {
    if (!adjSucc.has(d.predecessor_id)) adjSucc.set(d.predecessor_id, []);
    adjSucc.get(d.predecessor_id)!.push(d);
    if (!adjPred.has(d.successor_id)) adjPred.set(d.successor_id, []);
    adjPred.get(d.successor_id)!.push(d);
  }

  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  const ls = new Map<string, number>();
  const lf = new Map<string, number>();

  for (const a of leafActivities) {
    es.set(a.id, 0);
    ef.set(a.id, a.duration);
  }

  const sorted = topologicalSort(leafActivities, adjSucc);

  // Forward pass
  for (const id of sorted) {
    const act = leafActivities.find((a) => a.id === id);
    if (!act) continue;
    const preds = adjPred.get(id) ?? [];
    let maxES = 0;
    for (const p of preds) {
      const predEF = ef.get(p.predecessor_id) ?? 0;
      const lag = p.lag ?? 0;
      if (p.type === "FS") maxES = Math.max(maxES, predEF + lag);
      else if (p.type === "SS") maxES = Math.max(maxES, (es.get(p.predecessor_id) ?? 0) + lag);
      else if (p.type === "FF") maxES = Math.max(maxES, predEF + lag - act.duration);
      else if (p.type === "SF") maxES = Math.max(maxES, (es.get(p.predecessor_id) ?? 0) + lag - act.duration);
    }
    es.set(id, maxES);
    ef.set(id, maxES + act.duration);
  }

  // Project duration
  let projectEnd = 0;
  for (const [, v] of Array.from(ef.entries())) projectEnd = Math.max(projectEnd, v);

  // Initialize late values
  for (const a of leafActivities) {
    lf.set(a.id, projectEnd);
    ls.set(a.id, projectEnd - a.duration);
  }

  // Backward pass
  for (let i = sorted.length - 1; i >= 0; i--) {
    const id = sorted[i];
    const act = leafActivities.find((a) => a.id === id);
    if (!act) continue;
    const succs = adjSucc.get(id) ?? [];
    let minLF = projectEnd;
    for (const s of succs) {
      const succLS = ls.get(s.successor_id) ?? projectEnd;
      const lag = s.lag ?? 0;
      if (s.type === "FS") minLF = Math.min(minLF, succLS - lag);
      else if (s.type === "SS") minLF = Math.min(minLF, succLS - lag + act.duration);
      else if (s.type === "FF") minLF = Math.min(minLF, (lf.get(s.successor_id) ?? projectEnd) - lag);
      else if (s.type === "SF") minLF = Math.min(minLF, (lf.get(s.successor_id) ?? projectEnd) - lag + act.duration);
    }
    lf.set(id, minLF);
    ls.set(id, minLF - act.duration);
  }

  // Build results
  for (const a of leafActivities) {
    const eStart = es.get(a.id) ?? 0;
    const eFinish = ef.get(a.id) ?? 0;
    const lStart = ls.get(a.id) ?? 0;
    const lFinish = lf.get(a.id) ?? 0;
    const totalFloat = lStart - eStart;
    const succs = adjSucc.get(a.id) ?? [];
    let freeFloat = projectEnd - eFinish;
    for (const s of succs) {
      const succES = es.get(s.successor_id) ?? 0;
      freeFloat = Math.min(freeFloat, succES - eFinish - (s.lag ?? 0));
    }
    results.set(a.id, {
      isCritical: totalFloat <= 0,
      totalFloat,
      freeFloat: Math.max(0, freeFloat),
      earlyStart: eStart,
      earlyFinish: eFinish,
      lateStart: lStart,
      lateFinish: lFinish,
    });
  }

  return results;
}

function topologicalSort(
  activities: CpmActivity[],
  adjSucc: Map<string, CpmDependency[]>
): string[] {
  const ids = new Set(activities.map((a) => a.id));
  const visited = new Set<string>();
  const result: string[] = [];

  const inDegree = new Map<string, number>();
  for (const id of Array.from(ids)) inDegree.set(id, 0);
  for (const [predId, deps] of Array.from(adjSucc.entries())) {
    if (!ids.has(predId)) continue;
    for (const d of deps) {
      if (ids.has(d.successor_id)) {
        inDegree.set(d.successor_id, (inDegree.get(d.successor_id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of Array.from(inDegree.entries())) {
    if (deg === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    visited.add(id);
    const succs = adjSucc.get(id) ?? [];
    for (const s of succs) {
      if (!ids.has(s.successor_id)) continue;
      const newDeg = (inDegree.get(s.successor_id) ?? 1) - 1;
      inDegree.set(s.successor_id, newDeg);
      if (newDeg === 0) queue.push(s.successor_id);
    }
  }

  // Add any remaining (cycle protection)
  for (const id of Array.from(ids)) {
    if (!visited.has(id)) result.push(id);
  }

  return result;
}

export function traceImpactPath(
  _sourceId: string,
  _activities: CpmActivity[],
  _dependencies: CpmDependency[],
  _cpmResults: Map<string, CpmResult>
): { impactedIds: Set<string>; totalDelayDays: number } {
  return { impactedIds: new Set(), totalDelayDays: 0 };
}
