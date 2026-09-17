import { describe, expect, it } from "vitest";
import { getDashboardPayload, toIsoDate, type SourceDailyReport } from "./enrich";
import { SAMPLE_TRADE_ROSTER } from "./trades";

const AS_OF = new Date(2026, 7, 20); // 20 Aug 2026

describe("getDashboardPayload", () => {
  const sampleReports: SourceDailyReport[] = [
    {
      dailyReportId: 101,
      guid: "dr-101",
      date: "2026-08-03",
      hours: 96,
      workflow: "Approved",
      projectId: 1025,
      createdAt: "2026-08-03T18:00:00Z",
      createdBy: "field@threestardrywall.com",
      createdByName: "Three Star Drywall",
    },
    {
      dailyReportId: 102,
      guid: "dr-102",
      date: "2026-08-20",
      hours: 80,
      workflow: "Approved",
      projectId: 1025,
      createdAt: "2026-08-20T18:00:00Z",
      createdBy: "field@threestardrywall.com",
      createdByName: "Three Star Drywall",
    },
  ];

  it("builds an August 2026 grid with provided trade roster", () => {
    const data = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports, SAMPLE_TRADE_ROSTER);

    expect(data.projectCode).toBe("HP-DEMO");
    expect(data.month).toBe("2026-08");
    expect(data.asOfDate).toBe("2026-08-20");
    expect(data.daysInMonth).toBe(31);
    expect(data.rows).toHaveLength(SAMPLE_TRADE_ROSTER.length);

    const threeStarRow = data.rows.find((r) => r.trade.id === "three-star-drywall");
    expect(threeStarRow).toBeDefined();
    const cellAug3 = threeStarRow?.cells.find((c) => c.date === "2026-08-03");
    expect(cellAug3?.status).toBe("logged");
    expect(cellAug3?.hours).toBe(96);
  });

  it("returns empty rows when project has no trade partners and no reports", () => {
    const data = getDashboardPayload("non-existent-project", "2026-08", AS_OF, [], []);
    expect(data.rows).toHaveLength(0);
    expect(data.kpis.tradesOnsiteToday).toBe(0);
    expect(data.kpis.missingToday).toBe(0);
  });

  it("dynamically includes trade partners from incoming reports", () => {
    const data = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports);
    expect(data.rows.length).toBeGreaterThan(0);
    expect(data.rows.some((r) => r.trade.name === "Three Star Drywall")).toBe(true);
  });

  it("creates separate lines in the dashboard for multiple people from the same company", () => {
    const multiPersonReports: SourceDailyReport[] = [
      {
        dailyReportId: 101,
        guid: "rpt-carlos-1",
        date: "2026-08-20",
        hours: 32,
        workflow: "Approved",
        projectId: 1025,
        createdAt: "2026-08-20T17:00:00Z",
        createdBy: "Carlos Mendoza",
        createdByName: "Titan Electric",
      },
      {
        dailyReportId: 102,
        guid: "rpt-dave-1",
        date: "2026-08-20",
        hours: 48,
        workflow: "Approved",
        projectId: 1025,
        createdAt: "2026-08-20T17:00:00Z",
        createdBy: "Dave Miller",
        createdByName: "Titan Electric",
      },
    ];

    const data = getDashboardPayload("1025", "2026-08", AS_OF, multiPersonReports);
    const titanRows = data.rows.filter(
      (r) => r.trade.companyName === "Titan Electric" || r.trade.name.includes("Titan Electric"),
    );
    expect(titanRows).toHaveLength(2);
    expect(titanRows.some((r) => r.trade.name.includes("Carlos Mendoza"))).toBe(true);
    expect(titanRows.some((r) => r.trade.name.includes("Dave Miller"))).toBe(true);
  });

  it("treats days after as-of as N/A", () => {
    const data = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports, SAMPLE_TRADE_ROSTER);
    const future = data.rows[0].cells.filter((c) => c.dayNumber > 20);
    expect(future.length).toBe(11);
    expect(future.every((c) => c.status === "na" && c.isFuture)).toBe(true);
  });

  it("accurately tracks delinquency for trades missing reports today", () => {
    const data = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports, SAMPLE_TRADE_ROSTER);
    const missing = data.delinquency.missingToday;
    expect(missing.length).toBeGreaterThan(0);
    // Three Star Drywall turned in on Aug 20, so it should not be in missingToday
    expect(missing.some((m) => m.tradeId === "three-star-drywall")).toBe(false);
  });

  it("sums monthly manpower and hours from real logged cells", () => {
    const data = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports, SAMPLE_TRADE_ROSTER);
    const threeStarRow = data.rows.find((r) => r.trade.id === "three-star-drywall");
    expect(threeStarRow?.monthTotalHours).toBe(176); // 96 + 80
  });

  it("is deterministic across calls", () => {
    const a = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports, SAMPLE_TRADE_ROSTER);
    const b = getDashboardPayload("1025", "2026-08", AS_OF, sampleReports, SAMPLE_TRADE_ROSTER);
    expect(a.kpis.monthHours).toBe(b.kpis.monthHours);
    expect(a.rows[0].cells.map((c) => c.status)).toEqual(b.rows[0].cells.map((c) => c.status));
  });
});

describe("toIsoDate", () => {
  it("formats local calendar dates", () => {
    expect(toIsoDate(AS_OF)).toBe("2026-08-20");
  });
});
