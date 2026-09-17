import type { CrewEntry } from '@/types/hpproto';

export function calculateCrewTotals(crew: CrewEntry[]): {
  workerCount: number;
  totalHours: number;
  updatedCrew: CrewEntry[];
} {
  let workerCount = 0;
  let totalHours = 0;
  const updatedCrew = crew.map((row) => {
    const count = Math.max(0, Number(row.count) || 0);
    const hpp = row.hoursPerWorker != null ? Math.max(0, Number(row.hoursPerWorker) || 0) : 8.0;
    const rowTotal = Math.round(count * hpp * 10) / 10;
    workerCount += count;
    totalHours += rowTotal;
    return {
      ...row,
      count,
      hoursPerWorker: hpp,
      totalHours: rowTotal,
    };
  });
  return {
    workerCount,
    totalHours: Math.round(totalHours * 10) / 10,
    updatedCrew,
  };
}
