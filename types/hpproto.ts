import type { PunchItem } from '@/types/punch';
import type { InspectionRecord } from '@/types/inspections';

export * from '@/types/inspections';

export interface TierSubcontractor {
  name: string;
  count: number;
  workerCount?: number;
  trade?: string;
}

export interface TradePartner {
  id: string;
  name: string;
  contactEmail?: string;
  category?: string;
  companyName?: string;
  submitterName?: string;
}

export interface CompanyContact {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  title?: string;
  phone?: string;
}

export interface ProjectCompany {
  id: string;
  psCompanyId?: number;
  name: string;
  trade?: string;
  isTracked: boolean;
  contacts: CompanyContact[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  tradePartners: TradePartner[];
  availableCompanies?: ProjectCompany[];
  createdAt: string;
  workingDays?: number[]; // [0..6], 0=Sun, 1=Mon, ..., 6=Sat. Default [1,2,3,4,5]
  tradeDayOverrides?: Record<string, 'onsite' | 'offsite'>; // Key: `${tradePartnerId}:${dateIso}`
  excludedTradePartnerIds?: string[];
  psPortfolioId?: string;
  psProjectId?: string;
  lat?: number;
  lon?: number;
}

export interface CrewEntry {
  craft: string;
  count: number;
  hoursPerWorker?: number;
  totalHours?: number;
}

export interface DailyReportAttachment {
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  category?: 'daily_capture' | 'sta_form';
}

export interface DailyReport {
  id: string;
  projectId: string;
  tradePartnerId: string;
  tradePartnerName: string;
  date: string; // YYYY-MM-DD
  submittedAt: string; // ISO 8601
  submittedBy?: string;
  locationDescription: string;
  workerCount: number;
  totalHours: number;
  crewBreakdown: CrewEntry[];
  tierSubcontractors?: TierSubcontractor[];
  tierSubsSummary?: string;
  equipment: string[];
  notes: string;
  tradesAndFavors?: string;
  isHpEmployee?: boolean;
  staCompleted: boolean;
  emailRecipients: string[];
  rawSourceFileName?: string;
  rawSourcePath?: string;
  rawSourceFiles?: DailyReportAttachment[];
  staFiles?: DailyReportAttachment[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  projectSightDailyId?: string;
  projectSightPortfolioId?: string;
  projectSightProjectId?: string;
  sentToProjectSightAt?: string;
}

export interface BowlingCell {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  tradePartnerId: string;
  tradePartnerName: string;
  status: 'submitted' | 'missing' | 'na';
  dailyReportId?: string;
  workerCount?: number;
  totalHours?: number;
  staCompleted?: boolean;
  fullReport?: DailyReport;
}

export interface BowlingMatrix {
  projectId: string;
  projectCode: string;
  projectName: string;
  month: string; // YYYY-MM
  daysInMonth: number;
  tradePartners: TradePartner[];
  workingDays: number[];
  rows: {
    tradePartner: TradePartner;
    cells: BowlingCell[];
    monthTotalWorkers: number;
    monthTotalHours: number;
    submittedDaysCount: number;
  }[];
}

export interface AccessControlConfig {
  allowedDomains: string[];
  allowedEmails: string[];
  adminEmails: string[];
  allowPasskeyLogin: boolean;
  updatedAt?: string;
}

export interface StoreData {
  projects: Project[];
  dailyReports: DailyReport[];
  punchItems?: PunchItem[];
  inspections?: InspectionRecord[];
  accessControl?: AccessControlConfig;
}

export const MAX_DAILY_REPORTS = 2000;
