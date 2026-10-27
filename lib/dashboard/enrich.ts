import fs from "fs";
import path from "path";
import { TRADE_ROSTER, INTERNAL_DOMAINS, EXCLUDED_DOMAINS, domainFromEmail } from "./trades";
import { slugTradePartnerId } from "@/lib/trade-partner";
import { getProjectById, SEEDED_PROJECTS } from "@/lib/store";
import type {
  CellStatus,
  DashboardAnalytics,
  DashboardCell,
  DashboardKpis,
  DashboardPayload,
  DashboardRow,
  DashboardTradePartner,
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

function buildMonthRows(
  yearMonth: string,
  asOf: Date,
  sourceReports: SourceDailyReport[] = [],
  projectWorkingDays: number[] = [1, 2, 3, 4, 5],
  trades: DashboardTradePartner[] = [],
): DashboardRow[] {
  const { year, month } = parseYearMonth(yearMonth);
  const n = daysInMonth(yearMonth);
  const asOfIso = toIsoDate(asOf);

  return trades.map((trade) => {
    const cells: DashboardCell[] = [];
    let monthTotalManpower = 0;
    let monthTotalHours = 0;
    let onsiteDays = 0;
    let loggedDays = 0;
    let receivedUnloggedDays = 0;
    let missingDays = 0;

    const tradeReports = sourceReports.filter((r) => {
      const targetName = trade.companyName || trade.name;
      const nameMatch =
        r.createdByName &&
        (r.createdByName.toLowerCase() === targetName.toLowerCase() ||
          r.createdByName.toLowerCase().includes(targetName.toLowerCase()) ||
          targetName.toLowerCase().includes(r.createdByName.toLowerCase()));
      const domainMatch = trade.domain && r.createdBy && r.createdBy.toLowerCase().includes(trade.domain.toLowerCase());
      const idMatch = r.guid && r.guid.toLowerCase().includes(trade.id.toLowerCase());
      if (!(nameMatch || domainMatch || idMatch)) return false;

      if (trade.submitterName) {
        const sub = trade.submitterName.toLowerCase();
        const author = (r.createdBy || "").toLowerCase();
        return author === sub || author.includes(sub) || sub.includes(author);
      }
      return true;
    });

    for (let day = 1; day <= n; day++) {
      const date = new Date(year, month - 1, day);
      const iso = toIsoDate(date);
      const weekdayIdx = date.getDay();
      const isWeekend = weekdayIdx === 0 || weekdayIdx === 6;
      const isWorkDay = projectWorkingDays.includes(weekdayIdx);
      const isToday = iso === asOfIso;
      const isFuture = iso > asOfIso;

      const base: Omit<DashboardCell, "onsite" | "status" | "manpower" | "hours" | "hasDelayClaim"> = {
        date: iso,
        dayNumber: day,
        weekday: WEEKDAYS[weekdayIdx],
        isWeekend,
        isToday,
        isFuture,
      };

      if (isFuture) {
        cells.push({ ...base, onsite: false, status: "na", manpower: null, hours: null, hasDelayClaim: false });
        continue;
      }

      const report = tradeReports.find((r) => r.date === iso);

      if (report) {
        const isApproved =
          report.workflow?.toLowerCase().includes("closed") ||
          report.workflow?.toLowerCase().includes("approved") ||
          Boolean(report.dailyReportId);
        const status: CellStatus = isApproved ? "logged" : "received";
        const manpower = report.hours ? Math.max(1, Math.round(report.hours / 8)) : (trade.typicalCrew || 8);
        const hours = report.hours || manpower * 8;

        const cell: DashboardCell = {
          ...base,
          onsite: true,
          status,
          manpower,
          hours,
          hasDelayClaim: false,
        };
        cells.push(cell);
        onsiteDays += 1;
        monthTotalManpower += manpower;
        monthTotalHours += hours;
        if (status === "logged") loggedDays += 1;
        if (status === "received") receivedUnloggedDays += 1;
      } else if (!isWorkDay) {
        cells.push({ ...base, onsite: false, status: "na", manpower: null, hours: null, hasDelayClaim: false });
      } else {
        const cell: DashboardCell = {
          ...base,
          onsite: true,
          status: "missing",
          manpower: null,
          hours: null,
          hasDelayClaim: false,
        };
        cells.push(cell);
        onsiteDays += 1;
        missingDays += 1;
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

function buildAnalytics(
  yearMonth: string,
  asOf: Date,
  rows: DashboardRow[],
  trades: DashboardTradePartner[] = [],
  projectWorkingDays: number[] = [1, 2, 3, 4, 5],
  sourceReports: SourceDailyReport[] = [],
): DashboardAnalytics {
  const { year, month } = parseYearMonth(yearMonth);
  const n = daysInMonth(yearMonth);
  const asOfIso = toIsoDate(asOf);
  const mixCounts: Record<CellStatus, number> = { logged: 0, received: 0, missing: 0, na: 0 };
  const dailyTrend: DashboardAnalytics["dailyTrend"] = [];
  const missingByDay: DayMissingStat[] = [];

  for (let day = 1; day <= n; day++) {
    const date = new Date(year, month - 1, day);
    const iso = toIsoDate(date);
    const weekday = WEEKDAYS[date.getDay()];
    const isFuture = iso > asOfIso;

    const tally = { logged: 0, received: 0, missing: 0, na: 0 };
    const missingNames: string[] = [];
    let onsiteCount = 0;
    for (const row of rows) {
      const cell = row.cells[day - 1];
      if (!cell) continue;
      tally[cell.status] += 1;
      mixCounts[cell.status] += 1;
      if (cell.onsite) onsiteCount += 1;
      if (cell.status === "missing") missingNames.push(row.trade.name);
    }
    dailyTrend.push({
      date: iso,
      dayNumber: day,
      ...tally,
    });
    if (!isFuture) {
      missingByDay.push({
        date: iso,
        dayNumber: day,
        weekday,
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
  const monthRowLookup = new Map<string, Map<string, DashboardRow>>();
  for (const m of jtdMonths) {
    const monthRows = m === yearMonth ? rows : buildMonthRows(m, asOf, sourceReports, projectWorkingDays, trades);
    const byTradeId = new Map<string, DashboardRow>();
    for (const r of monthRows) {
      byTradeId.set(r.trade.id, r);
    }
    monthRowLookup.set(m, byTradeId);
  }
  const jtdRows: JobToDateRow[] = trades.map((trade) => {
    const byMonth = jtdMonths.map((m) => {
      const row = monthRowLookup.get(m)?.get(trade.id);
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
  overrideReports?: SourceDailyReport[],
  overrideTrades?: DashboardTradePartner[],
): DashboardPayload {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error("Invalid month format. Expected YYYY-MM");
  }

  const proj = getProjectById(projectId);
  const sourceReports = overrideReports ?? [];

  let trades: DashboardTradePartner[] = [];
  if (overrideTrades) {
    trades = [...overrideTrades];
  } else if (proj?.tradePartners && proj.tradePartners.length > 0) {
    trades = proj.tradePartners.map((tp) => ({
      id: tp.id,
      name: tp.name,
      category: tp.category || "Trade Partner",
      domain: domainFromEmail(tp.contactEmail) || `${tp.id}.com`,
    }));
  }

  const excludedSet = new Set((proj?.excludedTradePartnerIds || []).map((x) => x.toLowerCase()));

  // Include any trade partner names present in the source reports
  for (const r of sourceReports) {
    const name = (r.createdByName || "").trim();
    const slug = slugTradePartnerId(name);
    if (excludedSet.has(name.toLowerCase()) || excludedSet.has(slug.toLowerCase())) {
      continue;
    }
    if (name && !trades.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      trades.push({
        id: slug,
        name,
        category: "Trade Partner",
        domain: domainFromEmail(r.createdBy) || `${slug}.com`,
      });
    }
  }

  if (excludedSet.size > 0) {
    trades = trades.filter(
      (t) =>
        !excludedSet.has(t.id.toLowerCase()) &&
        !excludedSet.has(t.name.toLowerCase()) &&
        !excludedSet.has(slugTradePartnerId(t.name)),
    );
  }

  // Expand lines if multiple people from the same company submitted daily reports
  if (!overrideTrades && trades.length > 0 && sourceReports.length > 0) {
    const reportsByName = new Map<string, SourceDailyReport[]>();
    const reportsBySlug = new Map<string, SourceDailyReport[]>();
    for (const r of sourceReports) {
      if (!r.createdByName) continue;
      const nameKey = r.createdByName.toLowerCase();
      const slugKey = slugTradePartnerId(r.createdByName).toLowerCase();
      const list1 = reportsByName.get(nameKey) ?? [];
      list1.push(r);
      reportsByName.set(nameKey, list1);

      const list2 = reportsBySlug.get(slugKey) ?? [];
      list2.push(r);
      reportsBySlug.set(slugKey, list2);
    }

    const expandedTrades: DashboardTradePartner[] = [];
    for (const trade of trades) {
      const byName = reportsByName.get(trade.name.toLowerCase()) ?? [];
      const bySlug = reportsBySlug.get(trade.id.toLowerCase()) ?? [];
      const companyReports = Array.from(new Set([...byName, ...bySlug]));

      const submitters = Array.from(
        new Set(
          companyReports
            .map((r) => (r.createdBy || "").trim())
            .filter(
              (by) =>
                by &&
                by.toLowerCase() !== "field@trade.com" &&
                by.toLowerCase() !== "field@company.com",
            ),
        ),
      );

      if (submitters.length > 1) {
        for (const sub of submitters) {
          expandedTrades.push({
            ...trade,
            id: `${trade.id}--${slugTradePartnerId(sub)}`,
            name: `${trade.name} (${sub})`,
            companyName: trade.name,
            submitterName: sub,
            domain: domainFromEmail(sub) || trade.domain,
          });
        }
      } else {
        expandedTrades.push(trade);
      }
    }
    trades = expandedTrades;
  }

  const workingDays = proj?.workingDays || [1, 2, 3, 4, 5];
  const rows = buildMonthRows(yearMonth, asOf, sourceReports, workingDays, trades);
  const asOfDate = toIsoDate(asOf);
  const analytics = buildAnalytics(yearMonth, asOf, rows, trades, workingDays, sourceReports);

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
    return trades.some((t) => t.domain === domain);
  });

  return {
    projectId: projectId.toLowerCase(),
    projectCode: proj?.code || (projectId === "1025" ? "HP-DEMO" : projectId.toUpperCase()),
    projectName: proj?.name || "Hensel Phelps Demo Project",
    month: yearMonth,
    asOfDate,
    daysInMonth: daysInMonth(yearMonth),
    sourceReportCount: matchedSource.length > 0 ? matchedSource.length : sourceReports.length,
    rows,
    kpis,
    delinquency: { missingToday, hpBacklog },
    analytics,
  };
}

export { buildMonthRows };
