export interface TradePartner {
  id: string;
  name: string;
  contactEmail?: string;
  category?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  tradePartners: TradePartner[];
  createdAt: string;
}

export interface CrewEntry {
  craft: string;
  count: number;
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
  equipment: string[];
  notes: string;
  staCompleted: boolean;
  emailRecipients: string[];
  rawSourceFileName?: string;
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
}

export interface BowlingMatrix {
  projectId: string;
  projectCode: string;
  projectName: string;
  month: string; // YYYY-MM
  daysInMonth: number;
  tradePartners: TradePartner[];
  rows: {
    tradePartner: TradePartner;
    cells: BowlingCell[];
    monthTotalWorkers: number;
    monthTotalHours: number;
    submittedDaysCount: number;
  }[];
}

export interface StoreData {
  projects: Project[];
  dailyReports: DailyReport[];
}
