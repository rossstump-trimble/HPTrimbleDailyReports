import { describe, expect, it } from "vitest";
import { getSortedNavigationData, navigationData } from "./navigationData";

describe("HPproto navigation", () => {
  it("exposes projects, dashboard, bowling, review queue, and daily intake", () => {
    const ids = navigationData.map((item) => item.id);
    expect(ids).toEqual([
      "projects",
      "dashboard",
      "companies",
      "bowling-sheet",
      "superdaily",
      "review-queue",
      "punch-list",
      "inspections",
      "daily-report",
      "admin",
    ]);
  });

  it("does not include leftover ProjectSight modules", () => {
    const ids = getSortedNavigationData().map((item) => item.id);
    expect(ids).not.toContain("drawings");
    expect(ids).not.toContain("records");
    expect(ids).not.toContain("financials");
    expect(ids).not.toContain("home");
    expect(ids).not.toContain("photos");
    expect(ids).not.toContain("files");
  });
});
