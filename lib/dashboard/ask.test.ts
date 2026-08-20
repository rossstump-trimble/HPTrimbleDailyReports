import { describe, expect, it } from "vitest";
import { answerDashboardQuestion } from "./ask";
import { getDashboardPayload } from "./enrich";

const AS_OF = new Date(2026, 7, 20);
const data = getDashboardPayload("cys07", "2026-08", AS_OF);

describe("answerDashboardQuestion", () => {
  it("lists trades missing a daily today", () => {
    const result = answerDashboardQuestion("Who didn't turn in a daily today?", data);
    expect(result.answer).toMatch(/3 trades/);
    expect(result.bullets.some((b) => b.includes("Berg Electric"))).toBe(true);
    expect(result.bullets.some((b) => b.includes("MSI Steel"))).toBe(true);
  });

  it("answers whether a named trade is on site", () => {
    const berg = answerDashboardQuestion("Is Berg Electric on site today?", data);
    expect(berg.answer).toMatch(/on site/i);
    expect(berg.answer).toMatch(/has not turned in/i);

    const freeman = answerDashboardQuestion("Is Freeman Group on site today?", data);
    expect(freeman.answer).toMatch(/not on site/i);
  });

  it("returns last check-in for a trade", () => {
    const result = answerDashboardQuestion("When did CB Floors last check in?", data);
    expect(result.answer).toMatch(/CB Floors last turned in/i);
  });

  it("separates HP backlog from trade misses", () => {
    const result = answerDashboardQuestion("Which reports are waiting on HP to log?", data);
    expect(result.answer).toMatch(/HP logging backlog/i);
    expect(result.answer).toMatch(/not a trade-partner miss/i);
  });

  it("surfaces top missing days", () => {
    const result = answerDashboardQuestion("Which days this month had the most missing reports?", data);
    expect(result.answer).toMatch(/most missing/i);
    expect(result.bullets.length).toBeGreaterThan(0);
  });
});
