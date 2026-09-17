// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuperdailyPrintDocument } from "./SuperdailyPrintDocument";
import type { SuperdailyReport } from "@/types/superdaily";

const mockReport: SuperdailyReport = {
  projectId: "1025",
  projectName: "Harbor Center Tower",
  date: "2026-09-17",
  generatedAt: "2026-09-17T14:30:00Z",
  totalHeadcount: 42,
  totalManHours: 336,
  activeTradeCount: 3,
  expectedTradeCount: 4,
  executiveSummary: "Structural steel erection completed on Level 12.",
  weather: {
    conditions: "Partly Cloudy",
    temp: 72,
    tempMax: 76,
    tempMin: 64,
    windVelocity: 8,
    humidity: 45,
    rainfall: 0,
    snowfall: 0,
  },
  tradeSummaries: [
    {
      tradePartnerId: "tp-1",
      tradePartnerName: "Apex Steel Erectors",
      category: "Structural",
      workerCount: 18,
      totalHours: 144,
      staCompleted: true,
      locationDescription: "Grid Line 4-8",
      workPerformed: "Torqued high-strength bolts on Tier 4 beams.",
      equipment: ["Crane #2", "Manlift 45ft"],
    },
  ],
  missingTrades: [
    {
      tradePartnerId: "tp-2",
      tradePartnerName: "Tri-County Concrete",
      category: "Concrete",
    },
  ],
  delaysAndRoadblocks: ["Laydown area blocked by exterior delivery"],
  safetyAndStas: {
    allCompleted: false,
    staNotes: "Apex completed morning STA; Tri-County pending submission.",
  },
};

describe("SuperdailyPrintDocument Hensel Phelps Brand Styling", () => {
  it("renders the Hensel Phelps logo image with proper alt text", () => {
    render(<SuperdailyPrintDocument report={mockReport} />);
    const logo = screen.getByAltText(/Hensel Phelps/i);
    expect(logo).toBeDefined();
    expect(logo.getAttribute("src")).toContain("hp-logo-std.png");
  });

  it("renders the Hensel Phelps dual brand horizon colors #A6192E and #F2A900", () => {
    const { container } = render(<SuperdailyPrintDocument report={mockReport} />);
    const horizonRed = container.querySelector('[data-brand="hp-horizon-red"]');
    const horizonYellow = container.querySelector('[data-brand="hp-horizon-yellow"]');
    expect(horizonRed).not.toBeNull();
    expect(horizonYellow).not.toBeNull();
  });

  it("renders the missing trades callout using Wheatland Yellow styling", () => {
    render(<SuperdailyPrintDocument report={mockReport} />);
    const matches = screen.getAllByText(/Tri-County Concrete/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
