export type CellStatus = "logged" | "received" | "missing" | "na";

export interface DashboardTradePartner {
  id: string;
  name: string;
  category: string;
  domain: string;
}

export interface DashboardCell {
  date: string;
  dayNumber: number;
  weekday: string;
  isWeekend: boolean;
  isToday: boolean;
  isFuture: boolean;
  onsite: boolean;
  status: CellStatus;
  manpower: number | null;
  hours: number | null;
  hasDelayClaim: boolean;
}

export interface DashboardRow {
  trade: DashboardTradePartner;
  cells: DashboardCell[];
  monthTotalManpower: number;
  monthTotalHours: number;
  onsiteDays: number;
  loggedDays: number;
  receivedUnloggedDays: number;
  missingDays: number;
}

export interface DelinquencyItem {
  tradeId: string;
  tradeName: string;
  category: string;
  date: string;
  kind: "missing" | "hp-backlog";
  manpower: number | null;
  hours: number | null;
}

export interface DayMissingStat {
  date: string;
  dayNumber: number;
  weekday: string;
  missingCount: number;
  onsiteCount: number;
  trades: string[];
}

export interface TradeComplianceStat {
  tradeId: string;
  tradeName: string;
  category: string;
  onsiteDays: number;
  loggedDays: number;
  receivedUnloggedDays: number;
  missingDays: number;
  compliancePct: number;
  manpower: number;
  hours: number;
}

export interface WeekdayPattern {
  weekday: string;
  onsite: number;
  missing: number;
  missingRate: number;
}

export interface JobToDateMonth {
  month: string;
  label: string;
}

export interface JobToDateRow {
  tradeId: string;
  tradeName: string;
  byMonth: {
    month: string;
    manpower: number;
    hours: number;
    missingDays: number;
  }[];
  totalManpower: number;
  totalHours: number;
}

export interface DashboardKpis {
  asOfDate: string;
  tradesOnsiteToday: number;
  missingToday: number;
  hpBacklogToday: number;
  monthCompliancePct: number;
  monthManpower: number;
  monthHours: number;
  onsiteDaysThisMonth: number;
  loggedDaysThisMonth: number;
}

export interface DashboardAnalytics {
  statusMix: { status: CellStatus; label: string; count: number }[];
  tradeCompliance: TradeComplianceStat[];
  topMissingDays: DayMissingStat[];
  weekdayPattern: WeekdayPattern[];
  dailyTrend: {
    date: string;
    dayNumber: number;
    logged: number;
    received: number;
    missing: number;
    na: number;
  }[];
  jobToDate: {
    months: JobToDateMonth[];
    rows: JobToDateRow[];
  };
}

export interface DashboardPayload {
  projectId: string;
  projectCode: string;
  projectName: string;
  month: string;
  asOfDate: string;
  daysInMonth: number;
  sourceReportCount: number;
  rows: DashboardRow[];
  kpis: DashboardKpis;
  delinquency: {
    missingToday: DelinquencyItem[];
    hpBacklog: DelinquencyItem[];
  };
  analytics: DashboardAnalytics;
}

export interface AskResult {
  answer: string;
  bullets: string[];
  suggestedFollowUps: string[];
}
