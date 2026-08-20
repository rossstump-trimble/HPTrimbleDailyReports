import fs from 'fs';
import path from 'path';
import { Project, DailyReport, BowlingMatrix, BowlingCell, StoreData } from '@/types/hpproto';

export type { StoreData };

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'hpproto-db.json');

const SEEDED_PROJECTS: Project[] = [
  {
    id: 'cys07',
    code: 'CYS07',
    name: 'CYS07 - Data Center Campus',
    createdAt: '2026-08-01T00:00:00.000Z',
    tradePartners: [
      { id: 'alc', name: 'ALC', contactEmail: 'daily@alc-controls.com', category: 'Controls' },
      { id: 'black-roofing', name: 'Black Roofing', contactEmail: 'reports@blackroofing.com', category: 'Roofing' },
      { id: 'apex-steel', name: 'Apex Steel', contactEmail: 'cys07@apexsteel.com', category: 'Structural Steel' },
      { id: 'titan-electric', name: 'Titan Electric', contactEmail: 'field@titanelectric.com', category: 'Electrical' },
      { id: 'cascade-plumbing', name: 'Cascade Plumbing & Mechanical', contactEmail: 'foreman@cascade-pm.com', category: 'Mechanical' },
      { id: 'precision-drywall', name: 'Precision Drywall', contactEmail: 'cys07@precisiondrywall.com', category: 'Interiors' },
    ],
  },
];

export function getStore(filePath: string = DEFAULT_DB_PATH): StoreData {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    const initialData: StoreData = { projects: SEEDED_PROJECTS, dailyReports: [] };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed.projects || parsed.projects.length === 0) {
      parsed.projects = SEEDED_PROJECTS;
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch {
    const initialData: StoreData = { projects: SEEDED_PROJECTS, dailyReports: [] };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export function saveStore(data: StoreData, filePath: string = DEFAULT_DB_PATH): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

export function getProjects(filePath: string = DEFAULT_DB_PATH): Project[] {
  return getStore(filePath).projects;
}

export function getProjectById(projectId: string, filePath: string = DEFAULT_DB_PATH): Project | undefined {
  return getProjects(filePath).find(p => p.id.toLowerCase() === projectId.toLowerCase());
}

export function upsertDailyReport(report: DailyReport, filePath: string = DEFAULT_DB_PATH): DailyReport {
  const store = getStore(filePath);
  const filtered = store.dailyReports.filter(
    r => !(r.projectId === report.projectId && r.tradePartnerId === report.tradePartnerId && r.date === report.date),
  );
  filtered.push(report);
  store.dailyReports = filtered;
  saveStore(store, filePath);
  return report;
}

export function getBowlingMatrix(
  projectId: string,
  yearMonth: string,
  filePath: string = DEFAULT_DB_PATH,
): BowlingMatrix {
  const project = getProjectById(projectId, filePath) ?? SEEDED_PROJECTS[0];
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const store = getStore(filePath);
  const projectDailies = store.dailyReports.filter(
    r => r.projectId === project.id && r.date.startsWith(yearMonth),
  );

  const rows = project.tradePartners.map(trade => {
    let monthTotalWorkers = 0;
    let monthTotalHours = 0;
    let submittedDaysCount = 0;

    const cells: BowlingCell[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${yearMonth}-${dayStr}`;
      const daily = projectDailies.find(r => r.tradePartnerId === trade.id && r.date === dateStr);

      if (daily) {
        submittedDaysCount++;
        monthTotalWorkers += daily.workerCount ?? 0;
        monthTotalHours += daily.totalHours ?? 0;
        cells.push({
          date: dateStr,
          dayNumber: day,
          tradePartnerId: trade.id,
          tradePartnerName: trade.name,
          status: 'submitted',
          dailyReportId: daily.id,
          workerCount: daily.workerCount,
          totalHours: daily.totalHours,
          staCompleted: daily.staCompleted,
        });
      } else {
        cells.push({
          date: dateStr,
          dayNumber: day,
          tradePartnerId: trade.id,
          tradePartnerName: trade.name,
          status: 'missing',
        });
      }
    }

    return { tradePartner: trade, cells, monthTotalWorkers, monthTotalHours, submittedDaysCount };
  });

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    month: yearMonth,
    daysInMonth,
    tradePartners: project.tradePartners,
    rows,
  };
}
