import fs from "fs";
import path from "path";
import { TRADE_ROSTER, INTERNAL_DOMAINS, EXCLUDED_DOMAINS, domainFromEmail } from "./trades";
import type {
  CellStatus,
  DashboardAnalytics,
  DashboardCell,
  DashboardKpis,
  DashboardPayload,
  DashboardRow,
  DayMissingStat,
  DelinquencyItem,
  JobToDateMonth,
  JobToDateRow,
  WeekdayPattern,
} from "./types";

const SOURCE_PATH = path.join(process.cwd(), "data", "projectsight-dailies.json");

export interface SourceDailyReport {
  dailyReportId: number;
  guid: string;
  date: string;
  hours: number | null;
  workflow: string;
  projectId: number;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

interface SourceFile {
  reports: SourceDailyReport[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function loadSourceReports(filePath: string = SOURCE_PATH): SourceDailyReport[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as SourceFile;
  return parsed.reports ?? [];
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentYearMonth(asOf: Date = new Date()): string {
  return `${asOf.getFullYear()}-${String(asOf.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [y, m] = yearMonth.split("-").map(Number);
  return { year: y, month: m };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed: string): number {
  // xorshift from hashed seed
  let x = hash(seed) || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

function monthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function priorMonths(yearMonth: string, count: number): string[] {
  const { year, month } = parseYearMonth(yearMonth);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/**
 * Demo-stable story for "today" so delinquency + agent answers stay coherent.
 * Only applied when asOfDate falls on this calendar day.
 */
const TODAY_STORY: Record<string, CellStatus | "skip"> = {
  "cb-floors": "logged",
  "murray-company": "received",
  "berg-electric": "missing",
  "best-contracting": "logged",
  "msi-steel": "missing",
  "cosco-fire": "received",
  "cp-contractors": "logged",
  "freeman-group": "na",
  "nevell-group": "missing",
  "first-impulse": "logged",
};

function isTradeOnsite(
  tradeId: string,
  date: Date,
  isWeekend: boolean,
  weekendWorkChance: number,
  seed: string,
): boolean {
  if (isWeekend) return unit(`${seed}:wknd`) < weekendWorkChance;

  const day = date.getDate();
  const weekday = date.getDay();

  // Freeman Group: Tue–Thu only
  if (tradeId === "freeman-group" && (weekday === 1 || weekday === 5)) return false;
  // First Impulse: on site after the 12th
  if (tradeId === "first-impulse" && day < 13) return false;
  // Cosco Fire: off first week
  if (tradeId === "cosco-fire" && day <= 7) return false;
  // Best Contracting: off mid-month punch-list gap
  if (tradeId === "best-contracting" && day >= 14 && day <= 16) return false;

  return true;
}

function buildCell(
  tradeId: string,
  typicalCrew: number,
  reliability: number,
  hpLogRate: number,
  weekendWorkChance: number,
  date: Date,
  asOf: Date,
): DashboardCell {
  const iso = toIsoDate(date);
  const asOfIso = toIsoDate(asOf);
  const dayNumber = date.getDate();
  const weekdayIdx = date.getDay();
  const isWeekend = weekdayIdx === 0 || weekdayIdx === 6;
  const isToday = iso === asOfIso;
  const isFuture = iso > asOfIso;
  const seed = `${tradeId}:${iso}`;

  const base: Omit<DashboardCell, "onsite" | "status" | "manpower" | "hours" | "hasDelayClaim"> = {
    date: iso,
    dayNumber,
    weekday: WEEKDAYS[weekdayIdx],
    isWeekend,
    isToday,
    isFuture,
  };

  if (isFuture) {
    return { ...base, onsite: false, status: "na", manpower: null, hours: null, hasDelayClaim: false };
  }

  let statusOverride: CellStatus | undefined;
  if (isToday && TODAY_STORY[tradeId] && TODAY_STORY[tradeId] !== "skip") {
    statusOverride = TODAY_STORY[tradeId] as CellStatus;
  }

  const onsite = statusOverride === "na"
    ? false
    : statusOverride
      ? statusOverride !== "na"
      : isTradeOnsite(tradeId, date, isWeekend, weekendWorkChance, seed);

  if (!onsite) {
    return { ...base, onsite: false, status: "na", manpower: null, hours: null, hasDelayClaim: false };
  }

  let status: CellStatus;
  if (statusOverride && statusOverride !== "na") {
    status = statusOverride;
  } else {
    let submitChance = reliability;
    if (weekdayIdx === 1) submitChance *= 0.78; // Mondays run late
    const submitted = unit(`${seed}:submit`) < submitChance;
    if (!submitted) {
      status = "missing";
    } else {
      status = unit(`${seed}:log`) < hpLogRate ? "logged" : "received";
    }
  }

  const crewJitter = Math.round((unit(`${seed}:crew`) - 0.5) * 4);
  const manpower = status === "missing" ? null : Math.max(1, typicalCrew + crewJitter);
  const shift = unit(`${seed}:shift`) < 0.15 ? 10 : 8;
  const hours = manpower == null ? null : manpower * shift;
  const hasDelayClaim = unit(`${seed}:delay`) < 0.04;

  return {
    ...base,
    onsite: true,
    status,
    manpower,
    hours,
    hasDelayClaim,
  };
}

function buildMonthRows(yearMonth: string, asOf: Date): DashboardRow[] {
  const { year, month } = parseYearMonth(yearMonth);
  const n = daysInMonth(yearMonth);

  return TRADE_ROSTER.map((trade) => {
    const cells: DashboardCell[] = [];
    let monthTotalManpower = 0;
    let monthTotalHours = 0;
    let onsiteDays = 0;
    let loggedDays = 0;
    let receivedUnloggedDays = 0;
    let missingDays = 0;

    for (let day = 1; day <= n; day++) {
      const date = new Date(year, month - 1, day);
      const cell = buildCell(
        trade.id,
        trade.typicalCrew,
        trade.reliability,
        trade.hpLogRate,
        trade.weekendWorkChance,
        date,
        asOf,
      );
      cells.push(cell);
      if (cell.onsite) {
        onsiteDays += 1;
        monthTotalManpower += cell.manpower ?? 0;
        monthTotalHours += cell.hours ?? 0;
        if (cell.status === "logged") loggedDays += 1;
        if (cell.status === "received") receivedUnloggedDays += 1;
        if (cell.status === "missing") missingDays += 1;
      }
    }

    return {
      trade: {
        id: trade.id,
        name: trade.name,
        category: trade.category,
        domain: trade.domain,
      },
      cells,
      monthTotalManpower,
      monthTotalHours,
      onsiteDays,
      loggedDays,
      receivedUnloggedDays,
      missingDays,
    };
  });
}

function compliancePct(logged: number, onsite: number): number {
  if (onsite === 0) return 100;
  return Math.round((logged / onsite) * 100);
}

function buildAnalytics(yearMonth: string, asOf: Date, rows: DashboardRow[]): DashboardAnalytics {
  const n = daysInMonth(yearMonth);
  const mixCounts: Record<CellStatus, number> = { logged: 0, received: 0, missing: 0, na: 0 };
  const dailyTrend: DashboardAnalytics["dailyTrend"] = [];
  const missingByDay: DayMissingStat[] = [];

  for (let day = 1; day <= n; day++) {
    const sample = rows[0]?.cells[day - 1];
    const tally = { logged: 0, received: 0, missing: 0, na: 0 };
    const missingNames: string[] = [];
    let onsiteCount = 0;
    for (const row of rows) {
      const cell = row.cells[day - 1];
      tally[cell.status] += 1;
      mixCounts[cell.status] += 1;
      if (cell.onsite) onsiteCount += 1;
      if (cell.status === "missing") missingNames.push(row.trade.name);
    }
    dailyTrend.push({
      date: sample?.date ?? "",
      dayNumber: day,
      ...tally,
    });
    if (sample && !sample.isFuture) {
      missingByDay.push({
        date: sample.date,
        dayNumber: day,
        weekday: sample.weekday,
        missingCount: missingNames.length,
        onsiteCount,
        trades: missingNames,
      });
    }
  }

  const weekdayBuckets: Record<string, { onsite: number; missing: number }> = {};
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell.isFuture) continue;
      const bucket = weekdayBuckets[cell.weekday] ?? { onsite: 0, missing: 0 };
      if (cell.onsite) bucket.onsite += 1;
      if (cell.status === "missing") bucket.missing += 1;
      weekdayBuckets[cell.weekday] = bucket;
    }
  }

  const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayPattern: WeekdayPattern[] = weekdayOrder.map((weekday) => {
    const b = weekdayBuckets[weekday] ?? { onsite: 0, missing: 0 };
    return {
      weekday,
      onsite: b.onsite,
      missing: b.missing,
      missingRate: b.onsite === 0 ? 0 : Math.round((b.missing / b.onsite) * 100),
    };
  });

  const tradeCompliance = rows.map((row) => ({
    tradeId: row.trade.id,
    tradeName: row.trade.name,
    category: row.trade.category,
    onsiteDays: row.onsiteDays,
    loggedDays: row.loggedDays,
    receivedUnloggedDays: row.receivedUnloggedDays,
    missingDays: row.missingDays,
    compliancePct: compliancePct(row.loggedDays, row.onsiteDays),
    manpower: row.monthTotalManpower,
    hours: row.monthTotalHours,
  }));

  const jtdMonths = priorMonths(yearMonth, 8);
  const months: JobToDateMonth[] = jtdMonths.map((m) => ({ month: m, label: monthLabel(m) }));
  const jtdRows: JobToDateRow[] = TRADE_ROSTER.map((trade) => {
    const byMonth = jtdMonths.map((m) => {
      const monthRows = m === yearMonth ? rows : buildMonthRows(m, asOf);
      const row = monthRows.find((r) => r.trade.id === trade.id);
      return {
        month: m,
        manpower: row?.monthTotalManpower ?? 0,
        hours: row?.monthTotalHours ?? 0,
        missingDays: row?.missingDays ?? 0,
      };
    });
    return {
      tradeId: trade.id,
      tradeName: trade.name,
      byMonth,
      totalManpower: byMonth.reduce((s, x) => s + x.manpower, 0),
      totalHours: byMonth.reduce((s, x) => s + x.hours, 0),
    };
  });

  return {
    statusMix: [
      { status: "logged", label: "Logged in Project Sight", count: mixCounts.logged },
      { status: "received", label: "Received, not logged", count: mixCounts.received },
      { status: "missing", label: "Missing daily", count: mixCounts.missing },
      { status: "na", label: "Not on site", count: mixCounts.na },
    ],
    tradeCompliance: [...tradeCompliance].sort((a, b) => a.compliancePct - b.compliancePct),
    topMissingDays: [...missingByDay].sort((a, b) => b.missingCount - a.missingCount).slice(0, 6),
    weekdayPattern,
    dailyTrend,
    jobToDate: { months, rows: jtdRows },
  };
}

export function getDashboardPayload(
  projectId: string,
  yearMonth: string,
  asOf: Date = new Date(),
): DashboardPayload {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error("Invalid month format. Expected YYYY-MM");
  }

  const sourceReports = loadSourceReports();
  const rows = buildMonthRows(yearMonth, asOf);
  const asOfDate = toIsoDate(asOf);
  const analytics = buildAnalytics(yearMonth, asOf, rows);

  let loggedDaysThisMonth = 0;
  let onsiteDaysThisMonth = 0;
  let monthManpower = 0;
  let monthHours = 0;
  const missingToday: DelinquencyItem[] = [];
  const hpBacklog: DelinquencyItem[] = [];

  for (const row of rows) {
    loggedDaysThisMonth += row.loggedDays;
    onsiteDaysThisMonth += row.onsiteDays;
    monthManpower += row.monthTotalManpower;
    monthHours += row.monthTotalHours;

    const todayCell = row.cells.find((c) => c.isToday);
    if (todayCell?.status === "missing") {
      missingToday.push({
        tradeId: row.trade.id,
        tradeName: row.trade.name,
        category: row.trade.category,
        date: todayCell.date,
        kind: "missing",
        manpower: todayCell.manpower,
        hours: todayCell.hours,
      });
    }

    for (const cell of row.cells) {
      if (cell.status === "received") {
        hpBacklog.push({
          tradeId: row.trade.id,
          tradeName: row.trade.name,
          category: row.trade.category,
          date: cell.date,
          kind: "hp-backlog",
          manpower: cell.manpower,
          hours: cell.hours,
        });
      }
    }
  }

  const todayRow = rows[0]?.cells.find((c) => c.isToday);
  const tradesOnsiteToday = todayRow
    ? rows.filter((r) => r.cells.find((c) => c.isToday)?.onsite).length
    : 0;
  const hpBacklogToday = todayRow
    ? rows.filter((r) => r.cells.find((c) => c.isToday)?.status === "received").length
    : 0;

  const kpis: DashboardKpis = {
    asOfDate,
    tradesOnsiteToday,
    missingToday: missingToday.length,
    hpBacklogToday,
    monthCompliancePct: compliancePct(loggedDaysThisMonth, onsiteDaysThisMonth),
    monthManpower,
    monthHours,
    onsiteDaysThisMonth,
    loggedDaysThisMonth,
  };

  const matchedSource = sourceReports.filter((r) => {
    const domain = domainFromEmail(r.createdBy);
    if (!domain || INTERNAL_DOMAINS.has(domain) || EXCLUDED_DOMAINS.has(domain)) return false;
    return TRADE_ROSTER.some((t) => t.domain === domain);
  });

  return {
    projectId: projectId.toLowerCase(),
    projectCode: projectId.toUpperCase(),
    projectName: "CYS07 — Data Center Campus",
    month: yearMonth,
    asOfDate,
    daysInMonth: daysInMonth(yearMonth),
    sourceReportCount: matchedSource.length,
    rows,
    kpis,
    delinquency: { missingToday, hpBacklog },
    analytics,
  };
}

export { buildMonthRows };
