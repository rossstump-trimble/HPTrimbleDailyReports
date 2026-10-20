import { describe, expect, it } from "vitest";
import { answerDashboardQuestion } from "./ask";
import { getDashboardPayload } from "./enrich";
import { SAMPLE_TRADE_ROSTER } from "./trades";

const AS_OF = new Date(2026, 7, 20);
const data = getDashboardPayload("1025", "2026-08", AS_OF, undefined, SAMPLE_TRADE_ROSTER);

describe("answerDashboardQuestion", () => {
  it("lists trades missing a daily today", () => {
    const result = answerDashboardQuestion("Who didn't turn in a daily today?", data);
    expect(result.answer).toMatch(/trades on site/);
    expect(result.bullets.length).toBeGreaterThan(0);
  });

  it("answers whether a named trade is on site", () => {
    const electro = answerDashboardQuestion("Is Electro Electrical Co. on site today?", data);
    expect(electro.answer).toMatch(/on site/i);
  });

  it("separates HP backlog from trade misses", () => {
    const result = answerDashboardQuestion("Which reports are waiting on HP to log?", data);
    expect(result.answer).toMatch(/HP logging backlog|received/i);
  });

  it("surfaces top missing days", () => {
    const result = answerDashboardQuestion("Which days this month had the most missing reports?", data);
    expect(result.answer).toMatch(/most missing/i);
    expect(result.bullets.length).toBeGreaterThan(0);
  });

  it("handles empty dashboard gracefully", () => {
    const emptyData = getDashboardPayload("1025", "2026-08", AS_OF, []);
    const result = answerDashboardQuestion("Who didn't turn in a daily today?", emptyData);
    expect(result.answer).toMatch(/no trade partner companies/i);
  });
});
