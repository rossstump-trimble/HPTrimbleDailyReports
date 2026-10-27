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
  InspectionRecord,
  AccessControlConfig,
} from '@/types/hpproto';
import type { PunchItem, PunchCommitActionItem, PunchCommitResult } from '@/types/punch';

export type { StoreData };
export { MAX_DAILY_REPORTS };

export function getDefaultDbPath(): string {
  if (process.env.HPPROTO_DB_PATH) {
    return process.env.HPPROTO_DB_PATH;
  }
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return path.join(process.cwd(), 'data', 'hpproto-test-db.json');
  }
  return path.join(process.cwd(), 'data', 'hpproto-db.json');
}

export const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'hpproto-db.json');

export const DEMO_PROJECT_TRADE_PARTNERS: TradePartner[] = [];

export const SEEDED_PROJECTS: Project[] = [
  {
    id: '8',
    code: 'RTP',
    name: 'Ross Tests Permissions',
    createdAt: '2026-08-19T00:00:00.000Z',
    workingDays: [1, 2, 3, 4, 5],
    psPortfolioId: 'b68d7ced-68be-45a3-b1ae-99b0250db779',
    psProjectId: '8',
    tradePartners: [],
  },
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

export function getCapacityStatus(filePath: string = getDefaultDbPath()): { total: number; max: number; isLocked: boolean } {
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

export function getStore(filePath: string = getDefaultDbPath()): StoreData {
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
  } catch (err) {
    console.error('[store] failed to parse store file, returning in-memory initial data without overwriting disk:', err);
    return { projects: getInitialProjects(), dailyReports: [] };
  }
}

export function saveStore(data: StoreData, filePath: string = getDefaultDbPath()): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

export function getProjects(filePath: string = getDefaultDbPath()): Project[] {
  return getStore(filePath).projects;
}

export function getProjectById(projectId: string, filePath: string = getDefaultDbPath()): Project | undefined {
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
  filePath: string = getDefaultDbPath(),
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
  const intakeToken = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  const newProject: Project = {
    id: uniqueId,
    code,
    name: projectData.name.trim(),
    intakeToken,
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

export function deleteProject(projectId: string, filePath: string = getDefaultDbPath()): boolean {
  const store = getStore(filePath);
  const initialCount = store.projects.length;
  const filtered = store.projects.filter(p => p.id.toLowerCase() !== projectId.toLowerCase());

  if (filtered.length !== initialCount) {
    const updatedStore: StoreData = {
      ...store,
      projects: filtered,
      dailyReports: store.dailyReports.filter(r => r.projectId.toLowerCase() !== projectId.toLowerCase()),
      punchItems: store.punchItems
        ? store.punchItems.filter(p => p.projectId.toLowerCase() !== projectId.toLowerCase())
        : undefined,
      inspections: store.inspections
        ? store.inspections.filter(ins => ins.projectId.toLowerCase() !== projectId.toLowerCase())
        : undefined,
    };
    saveStore(updatedStore, filePath);
    return true;
  }
  return false;
}

export const DEFAULT_ALLOWED_DOMAINS = ['henselphelps.com', 'trimble.com'];
export const DEFAULT_ADMIN_EMAILS = [
  'ross_stump@trimble.com',
  'nathan_patton@trimble.com',
  'jadan_anderson@trimble.com',
  'egrim@henselphelps.com',
];

export function getAccessControl(filePath: string = getDefaultDbPath()): AccessControlConfig {
  const store = getStore(filePath);
  const current = store.accessControl;
  const envAdmins = (process.env.ACCESS_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const envDomains = (process.env.ALLOWED_LOGIN_DOMAINS || '')
    .split(',')
    .map(d => d.trim().toLowerCase().replace(/^@+/, ''))
    .filter(Boolean);

  const allowedDomains = Array.from(
    new Set([
      ...(current?.allowedDomains && current.allowedDomains.length > 0
        ? current.allowedDomains.map(d => d.trim().toLowerCase().replace(/^@+/, ''))
        : DEFAULT_ALLOWED_DOMAINS),
      ...envDomains,
    ]),
  ).filter(Boolean);

  const adminEmails = Array.from(
    new Set([
      ...(current?.adminEmails && current.adminEmails.length > 0
        ? current.adminEmails.map(e => e.trim().toLowerCase())
        : DEFAULT_ADMIN_EMAILS),
      'egrim@henselphelps.com',
      ...envAdmins,
    ]),
  ).filter(Boolean);

  const allowedEmails = Array.from(
    new Set((current?.allowedEmails || []).map(e => e.trim().toLowerCase()).filter(Boolean)),
  );

  return {
    allowedDomains,
    allowedEmails,
    adminEmails,
    allowPasskeyLogin: current?.allowPasskeyLogin ?? false,
    updatedAt: current?.updatedAt,
  };
}

export function updateAccessControl(
  updates: Partial<AccessControlConfig>,
  filePath: string = getDefaultDbPath(),
): AccessControlConfig {
  const store = getStore(filePath);
  const current = getAccessControl(filePath);

  const next: AccessControlConfig = {
    allowedDomains: updates.allowedDomains
      ? Array.from(
          new Set(
            updates.allowedDomains
              .map(d => d.trim().toLowerCase().replace(/^@+/, ''))
              .filter(Boolean),
          ),
        )
      : current.allowedDomains,
    allowedEmails: updates.allowedEmails
      ? Array.from(
          new Set(
            updates.allowedEmails
              .map(e => e.trim().toLowerCase())
              .filter(Boolean),
          ),
        )
      : current.allowedEmails,
    adminEmails: updates.adminEmails
      ? Array.from(
          new Set(
            updates.adminEmails
              .map(e => e.trim().toLowerCase())
              .filter(Boolean),
          ),
        )
      : current.adminEmails,
    allowPasskeyLogin:
      updates.allowPasskeyLogin !== undefined
        ? Boolean(updates.allowPasskeyLogin)
        : current.allowPasskeyLogin,
    updatedAt: new Date().toISOString(),
  };

  store.accessControl = next;
  saveStore(store, filePath);
  return next;
}

export function updateProjectWorkingDays(
  projectId: string,
  workingDays: number[],
  filePath: string = getDefaultDbPath(),
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
  filePath: string = getDefaultDbPath(),
): Project | undefined {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return undefined;
  const excludedSet = new Set((proj.excludedTradePartnerIds || []).map(id => id.toLowerCase()));
  proj.tradePartners = tradePartners.filter(
    tp => !excludedSet.has(tp.id.toLowerCase()) && !excludedSet.has(tp.name.toLowerCase()) && !excludedSet.has(slugTradePartnerId(tp.name)),
  );
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
  filePath: string = getDefaultDbPath(),
): ProjectCompany[] {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return [];

  if (!proj.availableCompanies) {
    proj.availableCompanies = [];
  }

  const excludedSet = new Set((proj.excludedTradePartnerIds || []).map(x => x.toLowerCase()));
  const existingCompanyKeys = new Set<string>();
  for (const c of proj.availableCompanies) {
    existingCompanyKeys.add(c.id.toLowerCase());
    existingCompanyKeys.add(c.name.toLowerCase());
  }

  // Ensure any partner currently in tradePartners is in availableCompanies
  let changed = false;
  for (const tp of proj.tradePartners || []) {
    const exists =
      existingCompanyKeys.has(tp.id.toLowerCase()) ||
      existingCompanyKeys.has(tp.name.toLowerCase());
    if (!exists) {
      proj.availableCompanies.push({
        id: tp.id,
        name: tp.name,
        trade: tp.category || 'Trade Partner',
        isTracked: !excludedSet.has(tp.id.toLowerCase()) && !excludedSet.has(tp.name.toLowerCase()) && !excludedSet.has(slugTradePartnerId(tp.name)),
        contacts: [],
      });
      existingCompanyKeys.add(tp.id.toLowerCase());
      existingCompanyKeys.add(tp.name.toLowerCase());
      changed = true;
    }
  }

  // Also make sure isTracked aligns with excludedTradePartnerIds
  for (const c of proj.availableCompanies) {
    const isExcluded =
      excludedSet.has(c.id.toLowerCase()) ||
      excludedSet.has(c.name.toLowerCase()) ||
      excludedSet.has(slugTradePartnerId(c.name));
    if (isExcluded && c.isTracked) {
      c.isTracked = false;
      changed = true;
    }
  }

  if (changed) {
    saveStore(store, filePath);
  }

  return proj.availableCompanies;
}

export function setProjectCompanies(
  projectId: string,
  companies: ProjectCompany[],
  filePath: string = getDefaultDbPath(),
): void {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return;

  proj.availableCompanies = companies;
  const excludedSet = new Set((proj.excludedTradePartnerIds || []).map(x => x.toLowerCase()));

  for (const c of companies) {
    const cId = c.id.toLowerCase();
    const cName = c.name.toLowerCase();
    const cSlug = slugTradePartnerId(c.name);
    if (!c.isTracked) {
      if (cId) excludedSet.add(cId);
      if (cName) excludedSet.add(cName);
      if (cSlug) excludedSet.add(cSlug);
    } else {
      excludedSet.delete(cId);
      excludedSet.delete(cName);
      if (cSlug) excludedSet.delete(cSlug);
    }
  }

  proj.excludedTradePartnerIds = Array.from(excludedSet);
  syncTradePartnersFromCompanies(proj);
  saveStore(store, filePath);
}

export function toggleCompanyTracking(
  projectId: string,
  companyId: string,
  isTracked: boolean,
  filePath: string = getDefaultDbPath(),
): ProjectCompany[] {
  const store = getStore(filePath);
  const proj = store.projects.find(p => p.id.toLowerCase() === projectId.toLowerCase());
  if (!proj) return [];

  if (!proj.availableCompanies) {
    proj.availableCompanies = [];
  }

  const rawId = (companyId || '').trim();
  const decodedId = decodeURIComponent(rawId).trim().toLowerCase();
  const slugId = slugTradePartnerId(decodedId);
  const rawSlug = slugTradePartnerId(rawId);

  // Match all matching entries in availableCompanies
  let matchingCompanies = proj.availableCompanies.filter(c => {
    const cId = c.id.toLowerCase();
    const cName = c.name.toLowerCase();
    const cSlug = slugTradePartnerId(c.name);
    return (
      cId === decodedId ||
      cName === decodedId ||
      (slugId && cSlug === slugId) ||
      (slugId && cId === slugId) ||
      cName === rawId.toLowerCase() ||
      (rawSlug && cSlug === rawSlug) ||
      (c.psCompanyId != null && String(c.psCompanyId) === decodedId)
    );
  });

  if (matchingCompanies.length === 0) {
    // Check if it exists in tradePartners
    const tpMatch = (proj.tradePartners || []).find(tp => {
      const tpId = tp.id.toLowerCase();
      const tpName = tp.name.toLowerCase();
      const tpSlug = slugTradePartnerId(tp.name);
      return (
        tpId === decodedId ||
        tpName === decodedId ||
        (slugId && tpSlug === slugId) ||
        (slugId && tpId === slugId) ||
        tpName === rawId.toLowerCase() ||
        (rawSlug && tpSlug === rawSlug)
      );
    });
    if (tpMatch) {
      const created: ProjectCompany = {
        id: tpMatch.id,
        name: tpMatch.name,
        trade: tpMatch.category || 'Trade Partner',
        isTracked,
        contacts: [],
      };
      proj.availableCompanies.push(created);
      matchingCompanies.push(created);
    } else {
      const created: ProjectCompany = {
        id: slugId || rawSlug || decodedId,
        name: rawId,
        trade: 'Trade Partner',
        isTracked,
        contacts: [],
      };
      proj.availableCompanies.push(created);
      matchingCompanies.push(created);
    }
  }

  // Update isTracked on all matching companies
  for (const comp of matchingCompanies) {
    comp.isTracked = isTracked;
  }

  if (!proj.excludedTradePartnerIds) {
    proj.excludedTradePartnerIds = [];
  }

  // Collect all identifier forms to add/remove from exclusions
  const idsToProcess = new Set<string>();
  if (decodedId) idsToProcess.add(decodedId);
  if (rawId) idsToProcess.add(rawId.toLowerCase());
  if (slugId) idsToProcess.add(slugId);
  if (rawSlug) idsToProcess.add(rawSlug);

  for (const comp of matchingCompanies) {
    if (comp.id) idsToProcess.add(comp.id.toLowerCase());
    if (comp.name) idsToProcess.add(comp.name.toLowerCase());
    const s = slugTradePartnerId(comp.name);
    if (s) idsToProcess.add(s);
  }

  if (!isTracked) {
    // Add all representations to excludedTradePartnerIds so bowling matrix and daily sync ignore it
    for (const id of Array.from(idsToProcess)) {
      if (!proj.excludedTradePartnerIds.some(x => x.toLowerCase() === id)) {
        proj.excludedTradePartnerIds.push(id);
      }
    }
    // Remove from active tradePartners
    proj.tradePartners = (proj.tradePartners || []).filter(
      tp =>
        !idsToProcess.has(tp.id.toLowerCase()) &&
        !idsToProcess.has(tp.name.toLowerCase()) &&
        !idsToProcess.has(slugTradePartnerId(tp.name)),
    );
  } else {
    // Re-enable tracking: remove from excludedTradePartnerIds
    proj.excludedTradePartnerIds = proj.excludedTradePartnerIds.filter(
      x => !idsToProcess.has(x.toLowerCase()),
    );
    // Ensure active trade partner is included
    if (!proj.tradePartners) {
      proj.tradePartners = [];
    }
    for (const comp of matchingCompanies) {
      const alreadyIn = proj.tradePartners.some(
        tp =>
          idsToProcess.has(tp.id.toLowerCase()) ||
          idsToProcess.has(tp.name.toLowerCase()) ||
          idsToProcess.has(slugTradePartnerId(tp.name)),
      );
      if (!alreadyIn) {
        proj.tradePartners.push({
          id: comp.id,
          name: comp.name,
          category: comp.trade,
        });
      }
    }
  }

  syncTradePartnersFromCompanies(proj);
  saveStore(store, filePath);
  return proj.availableCompanies;
}

export function addCompanyContact(
  projectId: string,
  companyId: string,
  contact: CompanyContact,
  filePath: string = getDefaultDbPath(),
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
  filePath: string = getDefaultDbPath(),
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

    if (proj.availableCompanies) {
      const slugTarget = slugTradePartnerId(rawTarget);
      proj.availableCompanies = proj.availableCompanies.filter(
        c => c.id.toLowerCase() !== target && c.name.toLowerCase() !== target && c.id.toLowerCase() !== baseTarget && c.name.toLowerCase() !== baseTarget && slugTradePartnerId(c.name) !== slugTarget,
      );
    }
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
  filePath: string = getDefaultDbPath(),
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
  // When both are generic (e.g. 'Field Intake' / default), match as the same submitter
  // so repeat submissions on the same date update rather than duplicating.
  if (subA.key === '__default' && subB.key === '__default') {
    return true;
  }
  return false;
}

export function upsertDailyReport(report: DailyReport, filePath: string = getDefaultDbPath()): DailyReport {
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

  const existingReport = existingIndex >= 0 ? store.dailyReports[existingIndex] : undefined;
  const isExplicitEdit = Boolean(existingReport && existingReport.id === report.id);
  const normalized: DailyReport = {
    ...report,
    approvalStatus:
      report.approvalStatus ||
      (isExplicitEdit ? existingReport?.approvalStatus : undefined) ||
      'pending',
    approvedAt: report.approvedAt ?? (isExplicitEdit ? existingReport?.approvedAt : undefined),
    approvedBy: report.approvedBy ?? (isExplicitEdit ? existingReport?.approvedBy : undefined),
    projectSightDailyId:
      report.projectSightDailyId ?? (isExplicitEdit ? existingReport?.projectSightDailyId : undefined),
    projectSightPortfolioId:
      report.projectSightPortfolioId ?? (isExplicitEdit ? existingReport?.projectSightPortfolioId : undefined),
    projectSightProjectId:
      report.projectSightProjectId ?? (isExplicitEdit ? existingReport?.projectSightProjectId : undefined),
    sentToProjectSightAt:
      report.sentToProjectSightAt ?? (isExplicitEdit ? existingReport?.sentToProjectSightAt : undefined),
  };

  const filtered = store.dailyReports.filter((r) => !isMatch(r));
  filtered.push(normalized);
  store.dailyReports = filtered;
  saveStore(store, filePath);
  return normalized;
}

export function getDailyReportById(
  id: string,
  filePath: string = getDefaultDbPath(),
): DailyReport | undefined {
  return getStore(filePath).dailyReports.find((report) => report.id === id);
}

export function deleteDailyReport(id: string, filePath: string = getDefaultDbPath()): boolean {
  const store = getStore(filePath);
  const initialLen = store.dailyReports.length;
  const targetReport = store.dailyReports.find((r) => r.id === id);
  store.dailyReports = store.dailyReports.filter((r) => r.id !== id);
  if (store.dailyReports.length !== initialLen) {
    saveStore(store, filePath);

    // Also remove from ingested-dailies disaster recovery backup directory if it exists
    if (targetReport?.projectId && targetReport?.date) {
      try {
        const safeProject = (targetReport.projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
        const safeDate = (targetReport.date || 'no-date').replace(/[^0-9-]/g, '_');
        const safeDailyId = (id || '').replace(/[^a-zA-Z0-9._-]/g, '_');
        const backupDir = path.join(process.cwd(), 'data', 'ingested-dailies', safeProject, safeDate, safeDailyId);
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.warn('[deleteDailyReport] failed to clean up backup folder', err);
      }
    }

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
    if (!project.availableCompanies) {
      project.availableCompanies = [];
    }
    const inAvailable = project.availableCompanies.some(
      c => c.id.toLowerCase() === tpId.toLowerCase() || c.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (!inAvailable) {
      project.availableCompanies.push({
        id: tpId,
        name: cleanName,
        trade: 'Trade Partner',
        isTracked: true,
        contacts: [],
      });
    }
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
  filePath: string = getDefaultDbPath(),
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
  filePath: string = getDefaultDbPath(),
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
  filePath: string = getDefaultDbPath(),
  workingDaysOverride?: number[],
  liveReports?: DailyReport[],
): BowlingMatrix {
  const project = getProjectById(projectId, filePath) ?? {
    id: projectId,
    code: projectId.toUpperCase().slice(0, 8),
    name: projectId,
    createdAt: new Date().toISOString(),
    workingDays: [1, 2, 3, 4, 5],
    tradePartners: [],
  };
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

  const excludedSet = new Set((project.excludedTradePartnerIds || []).map((x) => x.toLowerCase()));
  const projectPartners = (project.tradePartners ? [...project.tradePartners] : []).filter(
    (tp) => !excludedSet.has(tp.id.toLowerCase()) && !excludedSet.has(tp.name.toLowerCase()) && !excludedSet.has(slugTradePartnerId(tp.name)),
  );

  // Dynamically include trade partners found in dailies if not already listed or excluded
  for (const d of projectDailies) {
    const tName = (d.tradePartnerName || '').trim();
    const tId = d.tradePartnerId?.trim() || slugTradePartnerId(tName);
    if (
      excludedSet.has(tName.toLowerCase()) ||
      excludedSet.has(tId.toLowerCase()) ||
      excludedSet.has(slugTradePartnerId(tName))
    ) {
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

export function getPunchItems(projectId: string, filePath: string = getDefaultDbPath()): PunchItem[] {
  const store = getStore(filePath);
  return (store.punchItems || []).filter(
    (p) => p.projectId.toLowerCase() === projectId.toLowerCase(),
  );
}

export function upsertPunchItem(
  projectId: string,
  item: PunchItem,
  filePath: string = getDefaultDbPath(),
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
  filePath: string = getDefaultDbPath(),
): PunchCommitResult {
  const store = getStore(filePath);
  if (!store.punchItems) store.punchItems = [];

  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const actionItem of actions) {
    switch (actionItem.action) {
      case 'create': {
        const partial = actionItem.item ?? {};
        const { id: _unusedId, projectId: _unusedProjId, ...partialWithoutId } = partial;
        const newItem: PunchItem = {
          id: `punch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          projectId,
          description: partialWithoutId.description ?? '',
          status: partialWithoutId.status ?? 'open',
          tradeName: partialWithoutId.tradeName ?? '',
          locationDescription: partialWithoutId.locationDescription ?? '',
          importance: partialWithoutId.importance ?? 'normal',
          ...partialWithoutId,
        };
        store.punchItems.push(newItem);
        createdCount++;
        break;
      }
      case 'resolve':
      case 'reinspect': {
        const target = store.punchItems.find(
          (p) =>
            p.projectId.toLowerCase() === projectId.toLowerCase() &&
            (actionItem.targetItemId
              ? p.id === actionItem.targetItemId || p.psPunchId === actionItem.targetItemId
              : p.itemNumber === actionItem.targetItemNumber),
        );
        if (!target) {
          failedCount++;
          errors.push(`Item not found: ${actionItem.targetItemId ?? actionItem.targetItemNumber}`);
          continue;
        }
        target.status = actionItem.action === 'resolve' ? 'resolved' : 'reopened';
        if (actionItem.notes) target.resolutionNotes = actionItem.notes;
        updatedCount++;
        break;
      }
      default: {
        const _exhaustive: never = actionItem.action;
        failedCount++;
        errors.push(`Unknown action: ${String(_exhaustive)}`);
      }
    }
  }

  saveStore(store, filePath);
  const items = (store.punchItems || []).filter(
    (p) => p.projectId.toLowerCase() === projectId.toLowerCase(),
  );
  return { success: failedCount === 0, createdCount, updatedCount, failedCount, items, errors };
}

export function getInspectionsForProject(
  projectId: string,
  filePath: string = getDefaultDbPath(),
): InspectionRecord[] {
  const store = getStore(filePath);
  return (store.inspections || []).filter(
    (ins) => ins.projectId.toLowerCase() === projectId.toLowerCase(),
  );
}

export function getInspectionById(
  inspectionId: string,
  filePath: string = getDefaultDbPath(),
): InspectionRecord | null {
  const store = getStore(filePath);
  return (store.inspections || []).find((ins) => ins.id === inspectionId) || null;
}

export function saveInspectionRecord(
  record: InspectionRecord,
  filePath: string = getDefaultDbPath(),
): InspectionRecord {
  const store = getStore(filePath);
  if (!store.inspections) store.inspections = [];
  const idx = store.inspections.findIndex((ins) => ins.id === record.id);
  if (idx >= 0) {
    store.inspections[idx] = record;
  } else {
    store.inspections.push(record);
  }
  saveStore(store, filePath);
  return record;
}

export function clearInspectionsForProject(
  projectId: string,
  filePath: string = getDefaultDbPath(),
): void {
  const store = getStore(filePath);
  if (!store.inspections) return;
  store.inspections = store.inspections.filter(
    (ins) => ins.projectId.toLowerCase() !== projectId.toLowerCase(),
  );
  saveStore(store, filePath);
}

export function updateInspectionRecord(
  inspectionId: string,
  updates: Partial<InspectionRecord>,
  filePath: string = getDefaultDbPath(),
): InspectionRecord | null {
  const store = getStore(filePath);
  if (!store.inspections) return null;
  const idx = store.inspections.findIndex((ins) => ins.id === inspectionId);
  if (idx < 0) return null;
  const updated: InspectionRecord = {
    ...store.inspections[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  store.inspections[idx] = updated;
  saveStore(store, filePath);
  return updated;
}

