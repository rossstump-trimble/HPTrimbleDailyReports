import { describe, expect, it } from "vitest";
import { getDashboardPayload, toIsoDate } from "./enrich";
import { TRADE_ROSTER } from "./trades";

const AS_OF = new Date(2026, 7, 20); // 20 Aug 2026

describe("getDashboardPayload", () => {
  it("builds a four-state August 2026 grid from enriched ProjectSight trades", () => {
    const data = getDashboardPayload("cys07", "2026-08", AS_OF);

    expect(data.projectCode).toBe("CYS07");
    expect(data.month).toBe("2026-08");
    expect(data.asOfDate).toBe("2026-08-20");
    expect(data.daysInMonth).toBe(31);
    expect(data.rows).toHaveLength(TRADE_ROSTER.length);
    expect(data.sourceReportCount).toBeGreaterThan(0);

    const statuses = new Set(data.rows.flatMap((r) => r.cells.map((c) => c.status)));
    expect(statuses.has("logged")).toBe(true);
    expect(statuses.has("received")).toBe(true);
    expect(statuses.has("missing")).toBe(true);
    expect(statuses.has("na")).toBe(true);
  });

  it("treats days after as-of as N/A", () => {
    const data = getDashboardPayload("cys07", "2026-08", AS_OF);
    const future = data.rows[0].cells.filter((c) => c.dayNumber > 20);
    expect(future.length).toBe(11);
    expect(future.every((c) => c.status === "na" && c.isFuture)).toBe(true);
  });

  it("uses a stable today story for delinquency", () => {
    const data = getDashboardPayload("cys07", "2026-08", AS_OF);
    const names = data.delinquency.missingToday.map((i) => i.tradeName).sort();
    expect(names).toEqual(["Berg Electric", "MSI Steel", "Nevell Group"]);

    const berg = data.rows.find((r) => r.trade.id === "berg-electric")!.cells[19];
    expect(berg.date).toBe("2026-08-20");
    expect(berg.status).toBe("missing");

    const murray = data.rows.find((r) => r.trade.id === "murray-company")!.cells[19];
    expect(murray.status).toBe("received");
  });

  it("sums monthly manpower from non-missing onsite cells", () => {
    const data = getDashboardPayload("cys07", "2026-08", AS_OF);
    for (const row of data.rows) {
      const expected = row.cells.reduce((s, c) => s + (c.manpower ?? 0), 0);
      expect(row.monthTotalManpower).toBe(expected);
    }
  });

  it("is deterministic across calls", () => {
    const a = getDashboardPayload("cys07", "2026-08", AS_OF);
    const b = getDashboardPayload("cys07", "2026-08", AS_OF);
    expect(a.kpis.monthHours).toBe(b.kpis.monthHours);
    expect(a.rows[0].cells.map((c) => c.status)).toEqual(b.rows[0].cells.map((c) => c.status));
  });
});

describe("toIsoDate", () => {
  it("formats local calendar dates", () => {
    expect(toIsoDate(AS_OF)).toBe("2026-08-20");
  });
});
