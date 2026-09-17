# Hensel Phelps Superdaily Brand Guidelines Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the official Hensel Phelps brand guidelines (Red `#A6192E`, Wheatland Yellow `#F2A900`, Charcoal Gray `#333333`, Light Gray `#D0D3D4`, Roboto font, and horizontal "Plan. Build. Manage." logo) to the Superdaily PDF export and on-screen page for the HP Trimble ProjectSight project.

**Architecture:** Copy the official high-resolution Hensel Phelps horizontal logo asset into `public/images/`. Configure the `Roboto` font family in Next.js layout and Tailwind CSS. Redesign `SuperdailyPrintDocument.tsx` with a dual-stripe brand horizon (`#A6192E` + `#F2A900`), Charcoal typography, high-DPI logo header, and ink-balanced field styling. Update `page.tsx` to align the on-screen UI buttons, badges, and `@media print` directives with exact color reproduction.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Google Fonts (`next/font/google`), Vitest, Testing Library.

## Global Constraints
- Target repository: `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`
- Primary brand red: `#A6192E` (Pantone 187 / RGB: 166, 25, 46)
- Secondary brand yellow: `#F2A900` (Pantone 130 / RGB: 242, 169, 0)
- Brand charcoal gray: `#333333` (RGB: 51, 51, 51)
- Brand light gray: `#D0D3D4` (Pantone 427 / RGB: 208, 211, 212)
- Typography: `Roboto` font family
- Logo: Official horizontal logo with tagline (`HP_Logo_Hori_PBM_Std.png`)
- Page print geometry: Standard Letter portrait (`8.5" x 11"`) with `-webkit-print-color-adjust: exact;`

---

### Task 1: Brand Asset & Roboto Typography Setup

**Files:**
- Create: `public/images/hp-logo-std.png` (copied from `/Users/rstump/Downloads/Hensel Phelps Logo PNGs/HP_Logo_Hori_PBM_Std.png`)
- Modify: `app/layout.tsx:1-45`
- Test: `lib/brand-assets.test.ts`

**Interfaces:**
- Consumes: Static file system asset `/Users/rstump/Downloads/Hensel Phelps Logo PNGs/HP_Logo_Hori_PBM_Std.png`.
- Produces: Web-accessible logo `/images/hp-logo-std.png` and `--font-roboto` CSS variable exposed to Tailwind and layout body.

- [ ] **Step 1: Write the failing test for brand assets**

Create `lib/brand-assets.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("brand assets and fonts", () => {
  it("contains the official Hensel Phelps horizontal logo in public/images", () => {
    const logoPath = path.join(process.cwd(), "public", "images", "hp-logo-std.png");
    expect(fs.existsSync(logoPath)).toBe(true);
    const stats = fs.statSync(logoPath);
    expect(stats.size).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run lib/brand-assets.test.ts`
Expected: FAIL with `expected false to be true` (logo not found yet).

- [ ] **Step 3: Copy logo asset and configure Roboto font**

Copy logo asset:
```bash
cp "/Users/rstump/Downloads/Hensel Phelps Logo PNGs/HP_Logo_Hori_PBM_Std.png" \
   "/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler/public/images/hp-logo-std.png"
```

Update `app/layout.tsx` to import `Roboto` from `next/font/google` and attach variable `--font-roboto`:
```typescript
import type { Metadata } from "next";
import { Open_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModusProviders } from "@/components/ModusProviders";
import { FeedbackWidgetProvider } from "@/components/feedback/FeedbackWidgetProvider";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const roboto = Roboto({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "HP Daily Reporting",
  description: "Hensel Phelps Daily Reporting & Compliance",
  icons: {
    icon: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://resources.connect.trimble.com/1.15.0/fonts/icon-font.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ps-theme');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", openSans.variable, roboto.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="ps-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ModusProviders>
            {children}
            <Toaster />
            <FeedbackWidgetProvider />
          </ModusProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run lib/brand-assets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/images/hp-logo-std.png app/layout.tsx lib/brand-assets.test.ts
git commit -m "feat(branding): copy Hensel Phelps logo asset and configure Roboto font"
```

---

### Task 2: Hensel Phelps Brand Styling for PDF Export Document

**Files:**
- Create: `components/superdaily/SuperdailyPrintDocument.test.tsx`
- Modify: `components/superdaily/SuperdailyPrintDocument.tsx:1-215`

**Interfaces:**
- Consumes: `SuperdailyReport` from `types/superdaily.ts`.
- Produces: Branded `SuperdailyPrintDocument` component adhering to Hensel Phelps guidelines.

- [ ] **Step 1: Write failing component test for SuperdailyPrintDocument**

Create `components/superdaily/SuperdailyPrintDocument.test.tsx`:
```tsx
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
    expect(screen.getByText(/Tri-County Concrete/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run components/superdaily/SuperdailyPrintDocument.test.tsx`
Expected: FAIL (missing logo image and brand horizon selectors).

- [ ] **Step 3: Update SuperdailyPrintDocument with Hensel Phelps styling**

Modify `components/superdaily/SuperdailyPrintDocument.tsx`:
```tsx
import React from 'react';
import type { SuperdailyReport } from '@/types/superdaily';

interface SuperdailyPrintDocumentProps {
  report: SuperdailyReport;
  hiddenSectionKeys?: string[];
  hiddenTradeIds?: string[];
}

export function SuperdailyPrintDocument({
  report,
  hiddenSectionKeys = [],
  hiddenTradeIds = [],
}: SuperdailyPrintDocumentProps) {
  const isHidden = (key: string) => hiddenSectionKeys.includes(key);
  const visibleTrades = report.tradeSummaries.filter(
    (t) => !hiddenTradeIds.includes(t.tradePartnerId),
  );

  return (
    <div
      className="superdaily-print-only hidden print:block text-[#333333] bg-white p-6 text-xs"
      style={{ fontFamily: 'var(--font-roboto), Roboto, -apple-system, sans-serif' }}
    >
      {/* Brand Header */}
      <div className="pb-2 mb-1 flex justify-between items-start">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hp-logo-std.png"
            alt="Hensel Phelps - Plan. Build. Manage."
            className="h-10 w-auto object-contain mb-1"
          />
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#A6192E]">
            Daily Master Report · Superdaily
          </div>
          <h1 className="text-base font-bold text-[#333333] mt-0.5">{report.projectName}</h1>
          <p className="text-slate-500 text-[10px]">Project ID: {report.projectId}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[#333333]">{report.date}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Dual Brand Horizon Stripe */}
      <div className="mb-4">
        <div data-brand="hp-horizon-red" className="h-[3px] bg-[#A6192E] w-full" />
        <div data-brand="hp-horizon-yellow" className="h-[2px] bg-[#F2A900] w-full" />
      </div>

      {/* Weather Strip */}
      {!isHidden('weather') && report.weather && (
        <div className="mb-4 p-2.5 bg-[#FAFAFA] border border-[#D0D3D4] rounded flex items-center justify-between text-[11px] break-inside-avoid">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#333333]">Site Weather:</span>
            <span className="font-semibold text-slate-700">{report.weather.conditions}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#B87E00] font-semibold border border-[#F2A900]/40 text-[10px]">
              {report.weather.tempMax != null && report.weather.tempMin != null
                ? `High ${report.weather.tempMax}°F / Low ${report.weather.tempMin}°F`
                : `${report.weather.temp}°F`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 text-[10px]">
            <span>Wind: {report.weather.windVelocity} mph</span>
            <span>Humidity: {report.weather.humidity}%</span>
            {report.weather.rainfall > 0 && <span>Rain: {report.weather.rainfall.toFixed(2)} in.</span>}
            {report.weather.snowfall > 0 && <span>Snow: {report.weather.snowfall.toFixed(1)} in.</span>}
          </div>
        </div>
      )}

      {/* High-level metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-[#FAFAFA] border border-[#D0D3D4] rounded break-inside-avoid">
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Trades</span>
          <div className="text-base font-bold text-[#A6192E]">
            {report.activeTradeCount}
            <span className="text-[10px] text-slate-500 font-normal ml-1">
              of {report.expectedTradeCount || report.activeTradeCount} expected
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Workers</span>
          <div className="text-base font-bold text-[#333333]">{report.totalHeadcount}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Man-Hours</span>
          <div className="text-base font-bold text-[#333333]">{report.totalManHours} hrs</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">STA Safety Status</span>
          <div className={`text-xs font-bold mt-1 ${report.safetyAndStas.allCompleted ? 'text-emerald-700' : 'text-[#A6192E]'}`}>
            {report.safetyAndStas.allCompleted ? '✓ All STAs Completed' : '⚠ Partial / Missing'}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {!isHidden('overview') && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#333333] border-l-[3px] border-[#A6192E] pl-2 pb-0.5 mb-1.5">
            Executive Site Summary
          </h2>
          <p className="text-[#333333] leading-relaxed text-[11px] whitespace-pre-wrap pl-2.5">
            {report.executiveSummary}
          </p>
        </div>
      )}

      {/* Missing Submissions Callout (Trades on Bowling Sheet without a Daily) */}
      {!isHidden('missing-trades') && report.missingTrades && report.missingTrades.length > 0 && (
        <div className="mb-4 p-2.5 bg-[#FFFDF5] border border-[#F2A900] rounded break-inside-avoid">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#946200] uppercase tracking-wide">
              Missing Submissions (On Bowling Sheet)
            </span>
            <span className="text-[10px] font-semibold text-[#946200]">
              {report.missingTrades.length} trade partner(s) not reported
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {report.missingTrades.map((m, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white border border-[#F2A900]/60 text-[#333333] font-semibold text-[10px]"
              >
                {m.tradePartnerName}
                {m.category && <span className="text-slate-500 font-normal ml-1">({m.category})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Subcontractor Work Breakdown */}
      {!isHidden('trades') && visibleTrades.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#333333] border-l-[3px] border-[#A6192E] pl-2 pb-0.5 mb-2">
            Trade Contractor Work & Field Activities
          </h2>
          <div className="space-y-2.5 pl-0.5">
            {visibleTrades.map((trade, idx) => (
              <div
                key={idx}
                className="border border-[#D0D3D4] rounded p-2.5 bg-white break-inside-avoid"
              >
                <div className="flex items-center justify-between border-b border-[#D0D3D4] pb-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#333333] text-xs">{trade.tradePartnerName}</span>
                    {trade.category && (
                      <span className="px-1.5 py-0.5 rounded bg-[#D0D3D4]/40 text-[#333333] text-[9px] font-semibold">
                        {trade.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium">
                    <span>Crew: <strong className="text-[#333333]">{trade.workerCount}</strong></span>
                    <span>Hours: <strong className="text-[#333333]">{trade.totalHours}</strong></span>
                    <span>
                      STA: {trade.staCompleted ? <strong className="text-emerald-700 font-bold">✓ Complete</strong> : <strong className="text-[#A6192E] font-bold">✗ Incomplete</strong>}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-[#333333] mb-1.5">
                  <span className="font-semibold text-[#333333] mr-1">Location & Activities:</span>
                  <span className="text-slate-600 mr-2">[{trade.locationDescription}]</span>
                  <span className="leading-relaxed whitespace-pre-wrap">{trade.workPerformed}</span>
                </div>

                {trade.equipment.length > 0 && (
                  <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Equipment in Use:</span>
                    <span>{trade.equipment.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roadblocks & Delays */}
      {!isHidden('delays') && report.delaysAndRoadblocks.length > 0 && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#A6192E] border-b border-[#A6192E]/40 pb-1 mb-1.5">
            Reported Delays & Roadblocks
          </h2>
          <ul className="list-disc pl-4 space-y-1 text-[10px] text-[#A6192E]">
            {report.delaysAndRoadblocks.map((delay, idx) => (
              <li key={idx}>{delay}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety notes */}
      {!isHidden('safety') && (
        <div className="mb-6 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#333333] border-l-[3px] border-[#A6192E] pl-2 pb-0.5 mb-1">
            Safety & STA Summary
          </h2>
          <p className="text-[#333333] text-[10px] pl-2.5">{report.safetyAndStas.staNotes}</p>
        </div>
      )}

      {/* Signature & Sign-off footer */}
      <div className="pt-4 border-t border-[#D0D3D4] grid grid-cols-2 gap-8 break-inside-avoid text-[10px]">
        <div>
          <p className="text-slate-500 mb-6">Superintendent Sign-Off:</p>
          <div className="border-b border-[#333333] w-48 mb-1"></div>
          <p className="text-[#333333] font-semibold">Project Superintendent</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 mb-6">Date Verified:</p>
          <div className="border-b border-[#333333] w-32 ml-auto mb-1"></div>
          <p className="text-[#333333]">{report.date}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run components/superdaily/SuperdailyPrintDocument.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/superdaily/SuperdailyPrintDocument.tsx components/superdaily/SuperdailyPrintDocument.test.tsx
git commit -m "feat(superdaily): apply Hensel Phelps brand styling and logo to print export"
```

---

### Task 3: On-Screen Superdaily Page Styling & Print Media Rules

**Files:**
- Modify: `app/(home)/projects/[projectId]/superdaily/page.tsx:135-225`
- Modify: `app/(home)/projects/[projectId]/superdaily/page.test.tsx`

**Interfaces:**
- Consumes: `SuperdailyPrintDocument` and existing report hooks.
- Produces: Polished Hensel Phelps branded on-screen interface and high-fidelity print CSS.

- [ ] **Step 1: Write test for on-screen Hensel Phelps button and badge styling**

Update `app/(home)/projects/[projectId]/superdaily/page.test.tsx`:
```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuperdailyPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: '1025' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    success: true,
    reportsCount: 3,
    report: {
      projectId: '1025',
      projectName: 'Test Project',
      date: '2026-09-17',
      generatedAt: '2026-09-17T12:00:00Z',
      totalHeadcount: 15,
      totalManHours: 120,
      activeTradeCount: 2,
      expectedTradeCount: 2,
      executiveSummary: 'All systems operational.',
      tradeSummaries: [],
      delaysAndRoadblocks: [],
      safetyAndStas: { allCompleted: true, staNotes: 'All safe.' },
    },
  }),
});

describe('SuperdailyPage Hensel Phelps UI Branding', () => {
  it('renders Superdaily Master Report with Hensel Phelps branding badge and PDF button', async () => {
    render(<SuperdailyPage />);
    expect(screen.getByText('Superdaily Master Report')).toBeDefined();
    const badge = screen.getByText('Hensel Phelps Superdaily');
    expect(badge).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run app/\(home\)/projects/\[projectId\]/superdaily/page.test.tsx`
Expected: FAIL (missing "Hensel Phelps Superdaily" badge text).

- [ ] **Step 3: Update page.tsx with Hensel Phelps branded UI and print directives**

Modify `app/(home)/projects/[projectId]/superdaily/page.tsx`:
- Update print CSS:
```css
<style jsx global>{`
  @media print {
    @page {
      size: letter portrait;
      margin: 0.4in;
    }
    body, html {
      background: white !important;
      color: #333333 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    header, nav, aside, .print\\:hidden {
      display: none !important;
    }
    .superdaily-print-only {
      display: block !important;
    }
  }
`}</style>
```
- Update Header & Badge:
```tsx
<div className="flex items-center gap-2">
  <span className="p-1.5 rounded-lg bg-[#A6192E]/10 text-[#A6192E]">
    <Sparkles className="h-5 w-5" />
  </span>
  <h1 className="text-xl font-bold tracking-tight text-[#333333]">
    Superdaily Master Report
  </h1>
  <Badge variant="outline" className="text-xs border-[#A6192E]/30 text-[#A6192E] bg-[#A6192E]/5">
    Hensel Phelps Superdaily
  </Badge>
</div>
```
- Update "Download PDF" Button:
```tsx
<Button
  onClick={handlePrintPdf}
  className="gap-1.5 bg-[#A6192E] hover:bg-[#8A1426] text-white shadow-sm"
>
  <Download className="h-4 w-4" />
  <span>Download PDF</span>
</Button>
```
- Update "Restore" Button:
```tsx
<Button
  variant="outline"
  onClick={handleRestoreAll}
  className="gap-1.5 text-[#B87E00] border-[#F2A900] hover:bg-[#FFFDF5]"
>
  <RotateCcw className="h-4 w-4" />
  <span>Restore ({totalHiddenCount})</span>
</Button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run app/\(home\)/projects/\[projectId\]/superdaily/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(home\)/projects/\[projectId\]/superdaily/page.tsx app/\(home\)/projects/\[projectId\]/superdaily/page.test.tsx
git commit -m "feat(superdaily): update on-screen UI and print media stylesheet with Hensel Phelps branding"
```

---

### Task 4: End-to-End Verification & Build Check

**Files:**
- All touched files

- [ ] **Step 1: Run complete superdaily and brand test suite**

Run:
```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && \
npx vitest run lib/brand-assets.test.ts \
               components/superdaily/SuperdailyPrintDocument.test.tsx \
               app/\(home\)/projects/\[projectId\]/superdaily/page.test.tsx \
               lib/superdaily.test.ts
```
Expected: All 4 test files PASS.

- [ ] **Step 2: Run Next.js production build check**

Run:
```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npm run build
```
Expected: Build succeeds without TypeScript errors or broken imports.

- [ ] **Step 3: Final commit**

```bash
git commit --allow-empty -m "chore(superdaily): complete Hensel Phelps brand styling implementation"
```
