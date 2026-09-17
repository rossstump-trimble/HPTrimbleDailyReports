import fs from 'fs';
import path from 'path';
import { slugTradePartnerId } from '@/lib/trade-partner';
import {
  Project,
  DailyReport,
  BowlingMatrix,
  BowlingCell,
  StoreData,
  TradePartner,
  ProjectCompany,
  CompanyContact,
  MAX_DAILY_REPORTS,
} from '@/types/hpproto';
import type { PunchItem, PunchCommitActionItem, PunchCommitResult } from '@/types/punch';

export type { StoreData };
export { MAX_DAILY_REPORTS };

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'hpproto-db.json');

export const DEMO_PROJECT_TRADE_PARTNERS: TradePartner[] = [];

export const SEEDED_PROJECTS: Project[] = [
  {
    id: '1025',
    code: 'HP-DEMO',
    name: 'Hensel Phelps Demo Project',
    createdAt: '2026-08-01T00:00:00.000Z',
    workingDays: [1, 2, 3, 4, 5],
    psPortfolioId: '8fddbe9f-933a-43b9-8b5e-17ff16f14598',
    psProjectId: '1025',
    tradePartners: [],
  },
];

export class CapacityLimitError extends Error {
  constructor(message = `System capacity limit of ${MAX_DAILY_REPORTS} daily reports reached. New submissions are locked.`) {
    super(message);
    this.name = 'CapacityLimitError';
  }
}

export function getCapacityStatus(filePath: string = DEFAULT_DB_PATH): { total: number; max: number; isLocked: boolean } {
  const count = getStore(filePath).dailyReports.length;
  return {
    total: count,
    max: MAX_DAILY_REPORTS,
    isLocked: count >= MAX_DAILY_REPORTS,
  };
}

export function getInitialProjects(): Project[] {
  return JSON.parse(JSON.stringify(SEEDED_PROJECTS));
}

export function getStore(filePath: string = DEFAULT_DB_PATH): StoreData {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    const initialData: StoreData = { projects: getInitialProjects(), dailyReports: [] };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    if (parsed.projects && Array.isArray(parsed.projects)) {
      parsed.projects = parsed.projects.filter(p => p.id.toLowerCase() !== 'cys07');
    }
    if (!parsed.projects || parsed.projects.length === 0) {
      parsed.projects = getInitialProjects();
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
    } else {
      let changed = false;
      for (const seeded of SEEDED_PROJECTS) {
        const existing = parsed.projects.find(p => p.id.toLowerCase() === seeded.id.toLowerCase());
        if (!existing) {
          parsed.projects.push(JSON.parse(JSON.stringify(seeded)));
          changed = true;
        } else if (!existing.tradePartners) {
          existing.tradePartners = [];
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    }
    return parsed;
  } catch {
    const initialData: StoreData = { projects: getInitialProjects(), dailyReports: [] };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export function saveStore(data: StoreData, filePath: string = DEFAULT_DB_PATH): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

export function getProjects(filePath: string = DEFAULT_DB_PATH): Project[] {
  return getStore(filePath).projects;
}

export function getProjectById(projectId: string, filePath: string = DEFAULT_DB_PATH): Project | undefined {
  return getProjects(filePath).find(p => p.id.toLowerCase() === projectId.toLowerCase());
}

export function createProject(
  projectData: {
    name: string;
    code?: string;
    workingDays?: number[];
    tradePartners?: TradePartner[];
    psPortfolioId?: string;
    psProjectId?: string;
  },
  filePath: string = DEFAULT_DB_PATH,
): Project {
  const store = getStore(filePath);
  const id = projectData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `proj-${Date.now()}`;

  let uniqueId = id;
  let counter = 1;
  while (store.projects.some(p => p.id.toLowerCase() === uniqueId.toLowerCase())) {
    uniqueId = `${id}-${counter++}`;
  }

  const code = projectData.code?.trim().toUpperCase() || uniqueId.toUpperCase().slice(0, 8);
  const newProject: Project = {
    id: uniqueId,
    code,
    name: projectData.name.trim(),
    createdAt: new Date().toISOString(),
    workingDays: projectData.workingDays || [1, 2, 3, 4, 5],
    psPortfolioId: projectData.psPortfolioId || '8fddbe9f-933a-43b9-8b5e-17ff16f14598',
    psProjectId: projectData.psProjectId || '1025',
    tradePartners:
      projectData.tradePartners && projectData.tradePartners.length > 0
        ? projectData.tradePartners
        : DEMO_PROJECT_TRADE_PARTNERS,
  };

  store.projects.push(newProject);
  saveStore(store, filePath);
  return newProject;
}

export function deleteProject(projectId: string, filePath: string = DEFAULT_DB_PATH): boolean {
  const store = getStore(filePath);
  const initialCount = store.projects.length;
  const filtered = store.projects.filter(p => p.id.toLowerCase() !== projectId.toLowerCase());

  if (filtered.length !== initialCount) {
    const updatedStore: StoreData = {
      projects: filtered,
      dailyReports: store.dailyReports.filter(r => r.projectId.toLowerCase() !== projectId.toLowerCase()),
    };
    saveStore(updatedStore, filePath);
    return true;
  }
  return false;
}

export function updateProjectWorkingDays(
  projectId: string,
  workingDays: number[],
  filePath: string = DEFAULT_DB_PATH,
): Project | undefined {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return undefined;
  proj.workingDays = workingDays;
  saveStore(store, filePath);
  return proj;
}

export function updateProjectTradePartners(
  projectId: string,
  tradePartners: TradePartner[],
  filePath: string = DEFAULT_DB_PATH,
): Project | undefined {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return undefined;
  proj.tradePartners = tradePartners;
  if (proj.excludedTradePartnerIds && tradePartners.length > 0) {
    const included = new Set(tradePartners.flatMap(tp => [tp.id.toLowerCase(), tp.name.toLowerCase()]));
    proj.excludedTradePartnerIds = proj.excludedTradePartnerIds.filter(id => !included.has(id.toLowerCase()));
  }
  saveStore(store, filePath);
  return proj;
}

function syncTradePartnersFromCompanies(proj: Project): void {
  proj.tradePartners = (proj.availableCompanies || [])
    .filter(c => c.isTracked)
    .map(c => ({ id: c.id, name: c.name, category: c.trade }));
}

export function getProjectCompanies(
  projectId: string,
  filePath: string = DEFAULT_DB_PATH,
): ProjectCompany[] {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return [];

  if (proj.availableCompanies === undefined) {
    proj.availableCompanies = (proj.tradePartners || []).map(tp => ({
      id: tp.id,
      name: tp.name,
      trade: tp.category,
      isTracked: true,
      contacts: [],
    }));
    saveStore(store, filePath);
  }

  return proj.availableCompanies;
}

export function setProjectCompanies(
  projectId: string,
  companies: ProjectCompany[],
  filePath: string = DEFAULT_DB_PATH,
): void {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return;

  proj.availableCompanies = companies;
  syncTradePartnersFromCompanies(proj);
  saveStore(store, filePath);
}

export function toggleCompanyTracking(
  projectId: string,
  companyId: string,
  isTracked: boolean,
  filePath: string = DEFAULT_DB_PATH,
): ProjectCompany[] {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return [];

  if (proj.availableCompanies === undefined) {
    proj.availableCompanies = (proj.tradePartners || []).map(tp => ({
      id: tp.id,
      name: tp.name,
      trade: tp.category,
      isTracked: true,
      contacts: [],
    }));
  }

  const company = proj.availableCompanies.find(c => c.id.toLowerCase() === companyId.toLowerCase());
  if (company) {
    company.isTracked = isTracked;
  }
  syncTradePartnersFromCompanies(proj);
  saveStore(store, filePath);
  return proj.availableCompanies;
}

export function addCompanyContact(
  projectId: string,
  companyId: string,
  contact: CompanyContact,
  filePath: string = DEFAULT_DB_PATH,
): CompanyContact {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return contact;

  if (proj.availableCompanies === undefined) {
    proj.availableCompanies = (proj.tradePartners || []).map(tp => ({
      id: tp.id,
      name: tp.name,
      trade: tp.category,
      isTracked: true,
      contacts: [],
    }));
  }

  const company = proj.availableCompanies.find(c => c.id.toLowerCase() === companyId.toLowerCase());
  if (!company) return contact;

  const contactEmail = (contact.email || '').trim().toLowerCase();
  const contactName = (contact.displayName || '').trim().toLowerCase();
  const existingIndex = company.contacts.findIndex(c => {
    if (c.id === contact.id) return true;
    const email = (c.email || '').trim().toLowerCase();
    const name = (c.displayName || '').trim().toLowerCase();
    if (contactEmail && email && email === contactEmail) return true;
    if (contactName && name && name === contactName) return true;
    return false;
  });

  if (existingIndex >= 0) {
    company.contacts[existingIndex] = { ...company.contacts[existingIndex], ...contact };
  } else {
    company.contacts.push(contact);
  }

  saveStore(store, filePath);
  return contact;
}

export function removeTradePartnerFromProject(
  projectId: string,
  companyIdOrName: string,
  purgeReports: boolean = true,
  filePath: string = DEFAULT_DB_PATH,
): { project?: Project; removedCount: number; purgedReportsCount: number } {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return { removedCount: 0, purgedReportsCount: 0 };

  const rawTarget = companyIdOrName.trim();
  const target = rawTarget.toLowerCase();

  // If passed an id like "three-star--john-doe" or name like "Three Star Drywall (John Doe)"
  const baseTarget = (target.includes('--') ? target.split('--')[0] : target.replace(/\s*\([^)]*\)\s*$/, '')).trim();
  const submitterMatch = rawTarget.match(/\(([^)]+)\)$/);
  const submitterLabel = (submitterMatch ? submitterMatch[1] : (target.includes('--') ? target.split('--')[1] : null))?.trim().toLowerCase();

  const initialPartnersLen = proj.tradePartners?.length || 0;

  const matchingPartnerIds = new Set<string>();
  const matchingPartnerNames = new Set<string>();

  (proj.tradePartners || []).forEach(tp => {
    const tpId = tp.id.toLowerCase();
    const tpName = tp.name.toLowerCase();
    if (tpId === target || tpName === target || tpId === baseTarget || tpName === baseTarget) {
      matchingPartnerIds.add(tpId);
      matchingPartnerNames.add(tpName);
    }
  });

  let removedCount = 0;
  if (!submitterLabel) {
    proj.tradePartners = (proj.tradePartners || []).filter(
      tp => tp.id.toLowerCase() !== target && tp.name.toLowerCase() !== target && tp.id.toLowerCase() !== baseTarget && tp.name.toLowerCase() !== baseTarget,
    );
    removedCount = initialPartnersLen - (proj.tradePartners?.length || 0);

    if (!proj.excludedTradePartnerIds) {
      proj.excludedTradePartnerIds = [];
    }
    const excludedSet = new Set(proj.excludedTradePartnerIds.map(x => x.toLowerCase()));
    excludedSet.add(target);
    excludedSet.add(baseTarget);
    matchingPartnerIds.forEach(id => excludedSet.add(id));
    matchingPartnerNames.forEach(name => excludedSet.add(name));
    proj.excludedTradePartnerIds = Array.from(excludedSet);
  }

  let purgedReportsCount = 0;
  if (purgeReports) {
    const initialReportsLen = store.dailyReports.length;
    store.dailyReports = store.dailyReports.filter(r => {
      if (r.projectId.toLowerCase() !== projectId.toLowerCase()) return true;
      const rId = (r.tradePartnerId || '').toLowerCase();
      const rName = (r.tradePartnerName || '').toLowerCase();
      const isCompanyMatch =
        rId === target ||
        rName === target ||
        rId === baseTarget ||
        rName === baseTarget ||
        matchingPartnerIds.has(rId) ||
        matchingPartnerNames.has(rName);

      if (!isCompanyMatch) return true;

      // If specific submitter requested, only purge that submitter's reports
      if (submitterLabel) {
        const sub = getReportSubmitterKey(r);
        const subKey = sub.key.toLowerCase();
        const subName = sub.displayName.toLowerCase();
        const subSlug = slugTradePartnerId(subName);
        if (
          subKey === submitterLabel ||
          subName === submitterLabel ||
          subSlug === submitterLabel ||
          subName.includes(submitterLabel) ||
          submitterLabel.includes(subName)
        ) {
          return false;
        }
        return true;
      }

      return false;
    });
    purgedReportsCount = initialReportsLen - store.dailyReports.length;
  }

  if (proj.tradeDayOverrides && !submitterLabel) {
    for (const key of Object.keys(proj.tradeDayOverrides)) {
      const [tpId] = key.split(':');
      if (tpId && (tpId.toLowerCase() === target || tpId.toLowerCase() === baseTarget || matchingPartnerIds.has(tpId.toLowerCase()))) {
        delete proj.tradeDayOverrides[key];
      }
    }
  }

  saveStore(store, filePath);
  return { project: proj, removedCount, purgedReportsCount };
}

export function setTradeDayOverride(
  projectId: string,
  tradePartnerId: string,
  dateIso: string,
  status: 'onsite' | 'offsite' | 'clear',
  filePath: string = DEFAULT_DB_PATH,
): Project | undefined {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return undefined;

  if (!proj.tradeDayOverrides) {
    proj.tradeDayOverrides = {};
  }

  const key = `${tradePartnerId}:${dateIso.slice(0, 10)}`;
  if (status === 'clear') {
    delete proj.tradeDayOverrides[key];
  } else {
    proj.tradeDayOverrides[key] = status;
  }

  saveStore(store, filePath);
  return proj;
}

export function getReportSubmitterKey(r: {
  submittedBy?: string;
  emailRecipients?: string[];
}): { key: string; displayName: string } {
  const by = (r.submittedBy || '').trim();
  const email = (r.emailRecipients?.[0] || '').trim();
  const isGeneric =
    !by ||
    by.toLowerCase() === 'field intake' ||
    by.toLowerCase() === 'projectsight' ||
    by.toLowerCase() === 'superintendent';

  if (!isGeneric) {
    return { key: by.toLowerCase(), displayName: by };
  }
  if (email) {
    return { key: email.toLowerCase(), displayName: email };
  }
  if (by) {
    return { key: by.toLowerCase(), displayName: by };
  }
  return { key: '__default', displayName: '' };
}

function isSameReportSubmitter(a: DailyReport, b: DailyReport): boolean {
  if (a.id === b.id) return true;
  const subA = getReportSubmitterKey(a);
  const subB = getReportSubmitterKey(b);

  if (subA.key !== '__default' && subB.key !== '__default') {
    return subA.key === subB.key;
  }
  if (subA.key !== subB.key) {
    return false;
  }
  return a.id === b.id;
}

export function upsertDailyReport(report: DailyReport, filePath: string = DEFAULT_DB_PATH): DailyReport {
  const store = getStore(filePath);
  const isMatch = (r: DailyReport) => {
    if (r.id === report.id) return true;
    if (
      r.projectId.toLowerCase() === report.projectId.toLowerCase() &&
      r.tradePartnerId.toLowerCase() === report.tradePartnerId.toLowerCase() &&
      r.date === report.date
    ) {
      return isSameReportSubmitter(r, report);
    }
    return false;
  };

  const existingIndex = store.dailyReports.findIndex(isMatch);

  if (existingIndex < 0 && store.dailyReports.length >= MAX_DAILY_REPORTS) {
    throw new CapacityLimitError();
  }

  const normalized: DailyReport = {
    ...report,
    approvalStatus: report.approvalStatus || 'pending',
  };

  const filtered = store.dailyReports.filter((r) => !isMatch(r));
  filtered.push(normalized);
  store.dailyReports = filtered;
  saveStore(store, filePath);
  return normalized;
}

export function getDailyReportById(
  id: string,
  filePath: string = DEFAULT_DB_PATH,
): DailyReport | undefined {
  return getStore(filePath).dailyReports.find((report) => report.id === id);
}

export function deleteDailyReport(id: string, filePath: string = DEFAULT_DB_PATH): boolean {
  const store = getStore(filePath);
  const initialLen = store.dailyReports.length;
  store.dailyReports = store.dailyReports.filter((r) => r.id !== id);
  if (store.dailyReports.length !== initialLen) {
    saveStore(store, filePath);
    return true;
  }
  return false;
}

export function ensureTradePartnerInProject(
  store: StoreData,
  projectId: string,
  companyName?: string,
  companyId?: string,
): boolean {
  if (!companyName?.trim()) return false;
  const project = store.projects.find((p) => p.id.toLowerCase() === projectId.toLowerCase());
  if (!project) return false;
  if (!project.tradePartners) {
    project.tradePartners = [];
  }
  const cleanName = companyName.trim();
  const exists = project.tradePartners.some(
    (tp) =>
      tp.name.toLowerCase() === cleanName.toLowerCase() ||
      (companyId && tp.id.toLowerCase() === companyId.toLowerCase()),
  );
  if (!exists) {
    const tpId = companyId || slugTradePartnerId(cleanName);
    project.tradePartners.push({
      id: tpId,
      name: cleanName,
      category: 'Trade Partner',
    });
    if (project.excludedTradePartnerIds) {
      const cleanLower = cleanName.toLowerCase();
      project.excludedTradePartnerIds = project.excludedTradePartnerIds.filter(
        id => id.toLowerCase() !== cleanLower && (!companyId || id.toLowerCase() !== companyId.toLowerCase()),
      );
    }
    return true;
  }
  return false;
}

export function approveDailyReport(
  id: string,
  approverEmail?: string,
  filePath: string = DEFAULT_DB_PATH,
): DailyReport | undefined {
  const store = getStore(filePath);
  const index = store.dailyReports.findIndex((report) => report.id === id);
  if (index < 0) return undefined;
  const report = store.dailyReports[index];
  const updated: DailyReport = {
    ...report,
    approvalStatus: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: approverEmail || 'Superintendent',
  };
  store.dailyReports[index] = updated;
  ensureTradePartnerInProject(store, report.projectId, report.tradePartnerName, report.tradePartnerId);
  saveStore(store, filePath);
  return updated;
}

export interface ProjectSightSendMeta {
  projectSightDailyId: string;
  projectSightPortfolioId: string;
  projectSightProjectId: string;
  sentToProjectSightAt: string;
}

export function markDailySentToProjectSight(
  id: string,
  meta: ProjectSightSendMeta,
  filePath: string = DEFAULT_DB_PATH,
): DailyReport | undefined {
  const store = getStore(filePath);
  const index = store.dailyReports.findIndex((report) => report.id === id);
  if (index < 0) {
    return undefined;
  }
  const report = store.dailyReports[index];
  const updated: DailyReport = {
    ...report,
    ...meta,
    approvalStatus: 'approved',
  };
  store.dailyReports[index] = updated;
  ensureTradePartnerInProject(store, report.projectId, report.tradePartnerName, report.tradePartnerId);
  saveStore(store, filePath);
  return updated;
}

export function getBowlingMatrix(
  projectId: string,
  yearMonth: string,
  filePath: string = DEFAULT_DB_PATH,
  workingDaysOverride?: number[],
  liveReports?: DailyReport[],
): BowlingMatrix {
  const project = getProjectById(projectId, filePath) ?? SEEDED_PROJECTS[0];
  const activeWorkingDays = workingDaysOverride ?? project.workingDays ?? [1, 2, 3, 4, 5];
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const store = getStore(filePath);
  const localDailies = store.dailyReports.filter(
    (r) => r.projectId.toLowerCase() === project.id.toLowerCase() && r.date.startsWith(yearMonth),
  );
  const extraDailies = (liveReports || []).filter(
    (r) => r.projectId.toLowerCase() === project.id.toLowerCase() && r.date.startsWith(yearMonth),
  );
  const projectDailies = [...localDailies, ...extraDailies];

  const projectPartners = project.tradePartners ? [...project.tradePartners] : [];
  const excludedSet = new Set((project.excludedTradePartnerIds || []).map((x) => x.toLowerCase()));

  // Dynamically include trade partners found in dailies if not already listed or excluded
  for (const d of projectDailies) {
    const tName = (d.tradePartnerName || '').trim();
    const tId = d.tradePartnerId?.trim() || slugTradePartnerId(tName);
    if (excludedSet.has(tName.toLowerCase()) || excludedSet.has(tId.toLowerCase())) {
      continue;
    }
    if (
      tName &&
      !projectPartners.some(
        (tp) => tp.id.toLowerCase() === tId.toLowerCase() || tp.name.toLowerCase() === tName.toLowerCase(),
      )
    ) {
      projectPartners.push({
        id: tId,
        name: tName,
        category: 'Trade Partner',
      });
    }
  }

  // Build rows: if multiple people from the same company submitted reports, each gets a separate line!
  const rows: BowlingMatrix['rows'] = [];

  for (const trade of projectPartners) {
    const tradeReports = projectDailies.filter(
      (r) =>
        r.tradePartnerId.toLowerCase() === trade.id.toLowerCase() ||
        r.tradePartnerName.toLowerCase() === trade.name.toLowerCase(),
    );

    // Group reports by submitter (person)
    const submitterGroups = new Map<string, { key: string; displayName: string; reports: DailyReport[] }>();
    for (const r of tradeReports) {
      const sub = getReportSubmitterKey(r);
      const existing = submitterGroups.get(sub.key);
      if (existing) {
        existing.reports.push(r);
      } else {
        submitterGroups.set(sub.key, { key: sub.key, displayName: sub.displayName, reports: [r] });
      }
    }

    const linesToBuild: {
      rowTrade: TradePartner;
      reports: DailyReport[];
    }[] = [];

    if (submitterGroups.size <= 1) {
      const reports = submitterGroups.size === 1 ? Array.from(submitterGroups.values())[0].reports : [];
      linesToBuild.push({ rowTrade: trade, reports });
    } else {
      // Multiple submitters from the same company -> each gets a separate line!
      for (const group of Array.from(submitterGroups.values())) {
        const hasNamedSubmitter = group.displayName && group.key !== '__default';
        const label = hasNamedSubmitter ? group.displayName : 'Field Foreman';
        linesToBuild.push({
          rowTrade: {
            ...trade,
            id: `${trade.id}--${slugTradePartnerId(label)}`,
            name: `${trade.name} (${label})`,
            companyName: trade.name,
            submitterName: label,
          },
          reports: group.reports,
        });
      }
    }

    for (const { rowTrade, reports } of linesToBuild) {
      let monthTotalWorkers = 0;
      let monthTotalHours = 0;
      let submittedDaysCount = 0;

      const cells: BowlingCell[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const dateStr = `${yearMonth}-${dayStr}`;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const isWorkDay = activeWorkingDays.includes(dayOfWeek);
        const overrideKey = `${trade.id}:${dateStr}`;
        const dayOverride = project.tradeDayOverrides?.[overrideKey];

        const daily = reports.find((r) => r.date === dateStr);

        if (daily) {
          submittedDaysCount++;
          monthTotalWorkers += daily.workerCount ?? 0;
          monthTotalHours += daily.totalHours ?? 0;
          cells.push({
            date: dateStr,
            dayNumber: day,
            tradePartnerId: rowTrade.id,
            tradePartnerName: rowTrade.name,
            status: 'submitted',
            dailyReportId: daily.id,
            workerCount: daily.workerCount,
            totalHours: daily.totalHours,
            staCompleted: daily.staCompleted,
            fullReport: daily,
          });
        } else if (dayOverride === 'offsite') {
          cells.push({
            date: dateStr,
            dayNumber: day,
            tradePartnerId: rowTrade.id,
            tradePartnerName: rowTrade.name,
            status: 'na',
          });
        } else if (dayOverride === 'onsite') {
          cells.push({
            date: dateStr,
            dayNumber: day,
            tradePartnerId: rowTrade.id,
            tradePartnerName: rowTrade.name,
            status: 'missing',
          });
        } else if (isWorkDay) {
          cells.push({
            date: dateStr,
            dayNumber: day,
            tradePartnerId: rowTrade.id,
            tradePartnerName: rowTrade.name,
            status: 'missing',
          });
        } else {
          cells.push({
            date: dateStr,
            dayNumber: day,
            tradePartnerId: rowTrade.id,
            tradePartnerName: rowTrade.name,
            status: 'na',
          });
        }
      }

      rows.push({
        tradePartner: rowTrade,
        cells,
        monthTotalWorkers,
        monthTotalHours,
        submittedDaysCount,
      });
    }
  }

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    month: yearMonth,
    daysInMonth,
    tradePartners: project.tradePartners,
    workingDays: activeWorkingDays,
    rows,
  };
}

export function getPunchItems(projectId: string, filePath: string = DEFAULT_DB_PATH): PunchItem[] {
  const store = getStore(filePath);
  return (store.punchItems || []).filter(
    (p) => p.projectId.toLowerCase() === projectId.toLowerCase(),
  );
}

export function upsertPunchItem(
  projectId: string,
  item: PunchItem,
  filePath: string = DEFAULT_DB_PATH,
): PunchItem {
  const store = getStore(filePath);
  if (!store.punchItems) store.punchItems = [];
  const idx = store.punchItems.findIndex((p) => p.id === item.id);
  const normalized: PunchItem = { ...item, projectId };
  if (idx >= 0) {
    store.punchItems[idx] = normalized;
  } else {
    store.punchItems.push(normalized);
  }
  saveStore(store, filePath);
  return normalized;
}

export function batchCommitPunchItems(
  projectId: string,
  actions: PunchCommitActionItem[],
  filePath: string = DEFAULT_DB_PATH,
): PunchCommitResult {
  const store = getStore(filePath);
  if (!store.punchItems) store.punchItems = [];

  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const action of actions) {
    if (action.action === 'create') {
      const partial = action.item ?? {};
      const newItem: PunchItem = {
        id: `punch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        projectId,
        description: partial.description ?? '',
        status: partial.status ?? 'open',
        tradeName: partial.tradeName ?? '',
        locationDescription: partial.locationDescription ?? '',
        importance: partial.importance ?? 'normal',
        ...partial,
      };
      store.punchItems.push(newItem);
      createdCount++;
    } else if (action.action === 'resolve' || action.action === 'reinspect') {
      const target = store.punchItems.find(
        (p) =>
          p.projectId.toLowerCase() === projectId.toLowerCase() &&
          (action.targetItemId ? p.id === action.targetItemId : p.itemNumber === action.targetItemNumber),
      );
      if (!target) {
        failedCount++;
        errors.push(`Item not found: ${action.targetItemId ?? action.targetItemNumber}`);
        continue;
      }
      target.status = action.action === 'resolve' ? 'resolved' : 'reopened';
      if (action.notes) target.resolutionNotes = action.notes;
      updatedCount++;
    } else {
      failedCount++;
      errors.push(`Unknown action: ${String((action as PunchCommitActionItem).action)}`);
    }
  }

  saveStore(store, filePath);
  const items = (store.punchItems || []).filter(
    (p) => p.projectId.toLowerCase() === projectId.toLowerCase(),
  );
  return { success: failedCount === 0, createdCount, updatedCount, failedCount, items, errors };
}
