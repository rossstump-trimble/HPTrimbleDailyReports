# ProjectSight Daily Hours Breakdown, Reporter Attribution, Attachments & STA Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure daily reports filed to ProjectSight accurately calculate and preserve worker hours per craft, clearly display original reporter attribution in the body narrative, attach captured daily images and dedicated STA safety form photos to the ProjectSight daily report, and flag missing STA reports on the Bowling Sheet and Dashboard.

**Architecture:** Extend the domain data model in `types/hpproto.ts` to support per-role hours and categorized attachments (`daily_capture` vs `sta_form`). Update `map-daily.ts` to output `Reporter: <name>`, craft-specific hours lines, and multi-craft `DailyWorks` records. Update `send-daily.ts` and submission routes to prefix and attach all files. Insert a dedicated mobile-first STA photo capture step into the intake wizard, and update Bowling Sheet cells and the project dashboard with clear missing-STA indicators and reporter contact cards.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons, Vitest, ProjectSight REST API.

## Global Constraints

- Never break existing daily report submissions or existing store records.
- Preserve backward compatibility for older daily records where `hoursPerWorker` or `staFiles` are not present.
- Total hours must strictly equal the sum of `count * hoursPerWorker` across all craft rows.
- Uploaded attachment filenames to ProjectSight must be cleanly prefixed (`Daily-Capture-N-...` and `STA-Form-N-...`).
- Do not run OCR on STA photos; store them directly as raw attachments.

---

### Task 1: Data Model & Types Extension

**Files:**
- Modify: `types/hpproto.ts:55-105`
- Modify: `lib/projectsight/map-daily.ts:5-25`
- Test: `lib/projectsight/map-daily.test.ts`

**Interfaces:**
- Consumes: Existing `DailyReport`, `CrewEntry`, `DailyReportAttachment`, `Fog617Capture`.
- Produces: Updated `CrewEntry` with `hoursPerWorker` and `totalHours`, updated `DailyReportAttachment` with `category`, and updated `DailyReport` / `Fog617Capture` with `submittedBy` and `staFiles`.

- [ ] **Step 1: Write the failing test for types and capture properties**

In `lib/projectsight/map-daily.test.ts`, add a test verifying `Fog617Capture` accepts `submittedBy`, detailed `crewBreakdown` fields, and `staFiles`:

```typescript
it('preserves reporter attribution and per-craft hours in Fog617Capture mapping', () => {
  const captureWithReporter: Fog617Capture = {
    tradePartnerName: 'Apex Electric',
    submittedBy: 'Evan Grimm, Foreman',
    date: '2026-09-17',
    crewBreakdown: [
      { craft: 'Journeyman Electrician', count: 4, hoursPerWorker: 8, totalHours: 32 },
      { craft: 'Apprentice Electrician', count: 2, hoursPerWorker: 4, totalHours: 8 },
    ],
    workerCount: 6,
    totalHours: 40,
    staCompleted: true,
  };
  const body = mapFog617ToProjectSightBody(captureWithReporter);
  expect(body.Description).toContain('Reporter: Evan Grimm, Foreman');
  expect(body.TotalWorkApproved).toBe(40);
  expect(body.TotalWorkersApproved).toBe(6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run lib/projectsight/map-daily.test.ts`
Expected: FAIL (missing `submittedBy` property on `Fog617Capture` or `Reporter` not in `Description`).

- [ ] **Step 3: Update `types/hpproto.ts` and `Fog617Capture` in `lib/projectsight/map-daily.ts`**

In `types/hpproto.ts`:
```typescript
export interface CrewEntry {
  craft: string;
  count: number;
  hoursPerWorker?: number;
  totalHours?: number;
}

export interface DailyReportAttachment {
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  category?: 'daily_capture' | 'sta_form';
}

export interface DailyReport {
  id: string;
  projectId: string;
  tradePartnerId: string;
  tradePartnerName: string;
  date: string;
  submittedAt: string;
  submittedBy?: string;
  locationDescription: string;
  workerCount: number;
  totalHours: number;
  crewBreakdown: CrewEntry[];
  tierSubcontractors?: TierSubcontractor[];
  tierSubsSummary?: string;
  equipment: string[];
  notes: string;
  tradesAndFavors?: string;
  isHpEmployee?: boolean;
  staCompleted: boolean;
  emailRecipients: string[];
  rawSourceFileName?: string;
  rawSourcePath?: string;
  rawSourceFiles?: DailyReportAttachment[];
  staFiles?: DailyReportAttachment[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  projectSightDailyId?: string;
  projectSightPortfolioId?: string;
  projectSightProjectId?: string;
  sentToProjectSightAt?: string;
}
```

In `lib/projectsight/map-daily.ts`:
```typescript
export interface Fog617Capture {
  tradePartnerName?: string;
  submittedBy?: string;
  date?: string;
  locationDescription?: string;
  workerCount?: number;
  totalHours?: number;
  crewBreakdown?: { craft: string; count: number; hoursPerWorker?: number; totalHours?: number }[];
  tierSubcontractors?: TierSubcontractor[];
  tierSubsSummary?: string;
  equipment?: string[];
  notes?: string;
  tradesAndFavors?: string;
  isHpEmployee?: boolean;
  staCompleted?: boolean;
  staFiles?: { fileName: string; filePath: string }[];
}
```

- [ ] **Step 4: Run test to verify it compiles (or reaches failure on narrative check)**

Run: `npm test -- --run lib/projectsight/map-daily.test.ts`
Expected: Passes typecheck, fails on narrative expectation until Task 2.

- [ ] **Step 5: Commit types changes**

```bash
git add types/hpproto.ts lib/projectsight/map-daily.ts
git commit -m "feat(types): add per-craft hours, reporter attribution, and staFiles to daily models"
```

---

### Task 2: ProjectSight Mapping - Reporter Attribution & Multi-Craft DailyWorks

**Files:**
- Modify: `lib/projectsight/map-daily.ts:25-215`
- Test: `lib/projectsight/map-daily.test.ts`

**Interfaces:**
- Consumes: `Fog617Capture` from Task 1.
- Produces: `buildDailyNarrative` with `Reporter:` header, and `mapFog617ToProjectSightBody` with separate `DailyWorks` entries per craft and exact total calculations.

- [ ] **Step 1: Write tests for reporter attribution and multi-craft DailyWorks**

In `lib/projectsight/map-daily.test.ts`:
```typescript
it('outputs separate DailyWorks items for each craft with exact total hours', () => {
  const capture: Fog617Capture = {
    tradePartnerName: 'Titan Iron',
    submittedBy: 'Evan Grimm',
    date: '2026-09-17',
    locationDescription: 'Sector B Column Line 4',
    crewBreakdown: [
      { craft: 'Ironworker Journeyman', count: 4, hoursPerWorker: 8, totalHours: 32 },
      { craft: 'Welder', count: 2, hoursPerWorker: 10, totalHours: 20 },
    ],
    workerCount: 6,
    totalHours: 52,
    staCompleted: true,
  };

  const body = mapFog617ToProjectSightBody(capture);
  expect(body.Description).toContain('Reporter: Evan Grimm');
  expect(body.Description).toContain('Ironworker Journeyman (4) @ 8h = 32h');
  expect(body.Description).toContain('Welder (2) @ 10h = 20h');
  expect(body.TotalWorkersApproved).toBe(6);
  expect(body.TotalWorkApproved).toBe(52);

  const works = body.DailyWorks as Record<string, unknown>[];
  expect(works).toHaveLength(2);
  expect(works[0].Trade).toBe('Ironworker Journeyman');
  expect(works[0].Workers).toBe(4);
  expect(works[0].HoursPerDay).toBe(8);
  expect(works[0].TotalWork).toBe(32);

  expect(works[1].Trade).toBe('Welder');
  expect(works[1].Workers).toBe(2);
  expect(works[1].HoursPerDay).toBe(10);
  expect(works[1].TotalWork).toBe(20);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run lib/projectsight/map-daily.test.ts`
Expected: FAIL with missing reporter text and single `DailyWorks` row.

- [ ] **Step 3: Implement reporter attribution and multi-craft DailyWorks mapping**

In `lib/projectsight/map-daily.ts`:
Update `buildDailyNarrative`:
```typescript
export function buildDailyNarrative(capture: Fog617Capture): string {
  const reporter = capture.submittedBy?.trim();
  const crewLines = (capture.crewBreakdown ?? [])
    .filter((row) => row.craft)
    .map((row) => {
      const h = row.hoursPerWorker ?? 8;
      const tot = row.totalHours ?? (row.count * h);
      return `${row.craft} (${row.count}) @ ${h}h = ${tot}h`;
    });
  const crew = crewLines.length > 0 ? crewLines.join('; ') : '—';
  const tierSubs =
    (capture.tierSubcontractors ?? []).length > 0
      ? (capture.tierSubcontractors ?? [])
          .map((s) => `${s.name} (${s.count} workers${s.trade ? ` · ${s.trade}` : ''})`)
          .join('; ')
      : capture.tierSubsSummary?.trim() || 'None';
  const equipment = (capture.equipment ?? []).filter(Boolean).join(', ');
  const trade = (capture.tradePartnerName || '').trim();

  const lines = [
    reporter ? `Reporter: ${reporter}` : '',
    `Trade partner: ${trade || '—'}`,
    `Location / work: ${capture.locationDescription?.trim() || '—'}`,
    `Headcount: ${capture.workerCount ?? 0}`,
    `Total hours: ${capture.totalHours ?? 0}`,
    `Crew breakdown: ${crew}`,
    `Tier subcontractors: ${tierSubs}`,
    `Equipment: ${equipment || '—'}`,
    `STA completed: ${capture.staCompleted ? 'yes' : 'no'}`,
    capture.tradesAndFavors ? `Trades & favors: ${capture.tradesAndFavors}` : '',
    `Notes: ${capture.notes?.trim() || '—'}`,
  ].filter(Boolean);
  return lines.join('\n');
}
```

In `mapFog617ToProjectSightBody`:
Compute total workers and total hours as exact sums from `crewBreakdown`:
```typescript
  const crew = capture.crewBreakdown ?? [];
  const calculatedWorkerCount = crew.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
  const calculatedTotalHours = crew.reduce(
    (sum, r) => sum + (Number(r.totalHours) ?? ((Number(r.count) || 0) * (Number(r.hoursPerWorker) || 8))),
    0,
  );

  const workerCount = capture.workerCount || calculatedWorkerCount || 1;
  const totalHours = capture.totalHours || calculatedTotalHours || (workerCount * 8);

  // Generate DailyWorks: one per craft row if available, else one summary row
  const dailyWorksItems: Record<string, unknown>[] = [];
  if (crew.length > 0) {
    for (const r of crew) {
      const cCount = Number(r.count) || 0;
      const cHpp = Number(r.hoursPerWorker) || 8.0;
      const cTotal = Number(r.totalHours) || (cCount * cHpp);
      dailyWorksItems.push({
        ...(company ? { CompanyID: company.id } : {}),
        CompanyName: trade || company?.name || 'Trade Partner',
        Company: trade || company?.name || 'Trade Partner',
        Trade: r.craft || trade || 'Trade Partner',
        TradePartner: trade || company?.name || 'Trade Partner',
        WorkDescription: workDescription,
        Description: workDescription,
        WorkPerformed: location || workDescription,
        Workers: cCount,
        WorkerCount: cCount,
        ManpowerQty: cTotal,
        HoursPerDay: cHpp,
        TotalWork: cTotal,
        Status: 'Approved',
        StatusID: 69,
        DetailLevel: 'BasicWithWorkers',
        Location: effectiveLocation,
        LocationDescription: effectiveLocation,
        Notes: notes || '',
      });
    }
  } else {
    dailyWorksItems.push({
      ...(company ? { CompanyID: company.id } : {}),
      CompanyName: trade || company?.name || 'Trade Partner',
      Company: trade || company?.name || 'Trade Partner',
      Trade: trade || company?.name || 'Trade Partner',
      TradePartner: trade || company?.name || 'Trade Partner',
      WorkDescription: workDescription,
      Description: workDescription,
      WorkPerformed: location || workDescription,
      Workers: workerCount,
      WorkerCount: workerCount,
      ManpowerQty: totalHours,
      HoursPerDay: hoursPerWorker,
      TotalWork: totalHours,
      Status: 'Approved',
      StatusID: 69,
      DetailLevel: 'BasicWithWorkers',
      Location: effectiveLocation,
      LocationDescription: effectiveLocation,
      Notes: notes || '',
    });
  }
```
Set `TotalWorkApproved: totalHours`, `TotalWorkersApproved: workerCount`, `DailyWorks: dailyWorksItems`, and `Works: dailyWorksItems`.

- [ ] **Step 4: Run tests to verify all pass**

Run: `npm test -- --run lib/projectsight/map-daily.test.ts`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit mapping changes**

```bash
git add lib/projectsight/map-daily.ts lib/projectsight/map-daily.test.ts
git commit -m "feat(projectsight): add reporter attribution and multi-craft DailyWorks breakdown"
```

---

### Task 3: Multi-File Attachment Dispatch with Prefixes

**Files:**
- Modify: `lib/projectsight/send-daily.ts:15-110`
- Modify: `lib/projectsight/send-intake-daily.ts:8-40`
- Test: `lib/projectsight/send-daily.test.ts`

**Interfaces:**
- Consumes: `SendDailyArgs`, `SendDailyAttachment`.
- Produces: `sendFog617ToProjectSight` accepting attachments tagged with `category` and automatically formatting filenames with `Daily-Capture-${idx}-${name}` and `STA-Form-${idx}-${name}`.

- [ ] **Step 1: Write tests for prefixed attachment uploading**

In `lib/projectsight/send-daily.test.ts`:
```typescript
it('attaches both daily capture files and STA form files with distinct prefixes', async () => {
  const createDailyReport = vi.fn().mockResolvedValue({ id: 'dr-100' });
  const attachDailyReportFile = vi.fn().mockResolvedValue(undefined);

  const files = [
    { fileName: 'fog617-sheet.jpg', fileBytes: Buffer.from('img1'), category: 'daily_capture' as const },
    { fileName: 'signed-sta.jpg', fileBytes: Buffer.from('img2'), category: 'sta_form' as const },
  ];

  const result = await sendFog617ToProjectSight(
    { ...args, files },
    { createDailyReport, attachDailyReportFile },
  );

  expect(result.attached).toBe(true);
  expect(attachDailyReportFile).toHaveBeenCalledTimes(2);
  expect(attachDailyReportFile.mock.calls[0][4]).toBe('Daily-Capture-1-fog617-sheet.jpg');
  expect(attachDailyReportFile.mock.calls[1][4]).toBe('STA-Form-1-signed-sta.jpg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run lib/projectsight/send-daily.test.ts`
Expected: FAIL (missing prefix logic or category support).

- [ ] **Step 3: Implement prefixing in `lib/projectsight/send-daily.ts`**

In `lib/projectsight/send-daily.ts`:
Update `SendDailyAttachment`:
```typescript
export interface SendDailyAttachment {
  fileName: string;
  fileBytes: Buffer;
  mimeType?: string;
  category?: 'daily_capture' | 'sta_form';
}
```

In `sendFog617ToProjectSight`:
```typescript
  let dailyCaptureIndex = 1;
  let staFormIndex = 1;

  for (const f of filesToAttach) {
    let prefixedName = f.fileName;
    if (f.category === 'sta_form') {
      prefixedName = `STA-Form-${staFormIndex++}-${f.fileName.replace(/^STA-Form-\d+-/, '')}`;
    } else if (f.category === 'daily_capture' || filesToAttach.length > 1) {
      prefixedName = `Daily-Capture-${dailyCaptureIndex++}-${f.fileName.replace(/^Daily-Capture-\d+-/, '')}`;
    }

    try {
      await deps.attachDailyReportFile(
        args.token,
        args.portfolioId,
        args.projectId,
        dailyId,
        prefixedName,
        f.fileBytes,
        f.mimeType || 'application/octet-stream',
      );
      attachedCount++;
    } catch (err) {
      lastError =
        err instanceof ProjectSightHttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Attach failed';
    }
  }
```

Update `captureFromDailyReport` in `lib/projectsight/send-intake-daily.ts`:
```typescript
export function captureFromDailyReport(report: DailyReport): Fog617Capture {
  return {
    tradePartnerName: report.tradePartnerName,
    submittedBy: report.submittedBy,
    date: report.date,
    locationDescription: report.locationDescription,
    workerCount: report.workerCount,
    totalHours: report.totalHours,
    crewBreakdown: report.crewBreakdown,
    tierSubcontractors: report.tierSubcontractors,
    tierSubsSummary: report.tierSubsSummary,
    equipment: report.equipment,
    tradesAndFavors: report.tradesAndFavors,
    isHpEmployee: report.isHpEmployee,
    notes: report.notes,
    staCompleted: report.staCompleted,
    staFiles: report.staFiles,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run lib/projectsight/send-daily.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit attachment prefixing changes**

```bash
git add lib/projectsight/send-daily.ts lib/projectsight/send-intake-daily.ts lib/projectsight/send-daily.test.ts
git commit -m "feat(projectsight): prefix daily captures and sta files when uploading attachments"
```

---

### Task 4: Interactive Crew Hours Calculation & Review UI

**Files:**
- Modify: `components/intake/DailyConfirmCard.tsx:160-240, 440-560`
- Test: `lib/crew-hours.test.ts` (create helper test)

**Interfaces:**
- Consumes: `CrewEntry` with `hoursPerWorker` and `totalHours`.
- Produces: Interactive table in `DailyConfirmCard` with auto-computed row hours, auto-summed worker counts and total hours, editable reporter input, and attachment preview trays.

- [ ] **Step 1: Write helper unit test for crew hours computation**

Create `lib/crew-hours.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateCrewTotals } from './crew-hours';

describe('calculateCrewTotals', () => {
  it('accurately computes total worker count and total hours from crew breakdown', () => {
    const crew = [
      { craft: 'Journeyman Electrician', count: 4, hoursPerWorker: 8 },
      { craft: 'Apprentice', count: 2, hoursPerWorker: 4 },
      { craft: 'Foreman', count: 1, hoursPerWorker: 9.5 },
    ];
    const totals = calculateCrewTotals(crew);
    expect(totals.workerCount).toBe(7);
    expect(totals.totalHours).toBe(49.5);
    expect(totals.updatedCrew[0].totalHours).toBe(32);
    expect(totals.updatedCrew[1].totalHours).toBe(8);
    expect(totals.updatedCrew[2].totalHours).toBe(9.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run lib/crew-hours.test.ts`
Expected: FAIL (cannot find module `./crew-hours`).

- [ ] **Step 3: Implement `lib/crew-hours.ts` and integrate in `DailyConfirmCard.tsx`**

Create `lib/crew-hours.ts`:
```typescript
import type { CrewEntry } from '@/types/hpproto';

export function calculateCrewTotals(crew: CrewEntry[]): {
  workerCount: number;
  totalHours: number;
  updatedCrew: CrewEntry[];
} {
  let workerCount = 0;
  let totalHours = 0;
  const updatedCrew = crew.map((row) => {
    const count = Math.max(0, Number(row.count) || 0);
    const hpp = row.hoursPerWorker != null ? Math.max(0, Number(row.hoursPerWorker) || 0) : 8.0;
    const rowTotal = Math.round(count * hpp * 10) / 10;
    workerCount += count;
    totalHours += rowTotal;
    return {
      ...row,
      count,
      hoursPerWorker: hpp,
      totalHours: rowTotal,
    };
  });

  return {
    workerCount,
    totalHours: Math.round(totalHours * 10) / 10,
    updatedCrew,
  };
}
```

In `components/intake/DailyConfirmCard.tsx`:
- Import `calculateCrewTotals`.
- Update `updateCrew`:
```typescript
  const updateCrew = (index: number, field: keyof CrewEntry, value: string | number) => {
    const updated = data.crewBreakdown.map((row, i) =>
      i === index ? { ...row, [field]: field === 'craft' ? String(value) : Number(value) } : row,
    );
    const { workerCount, totalHours, updatedCrew } = calculateCrewTotals(updated);
    onChange({
      ...data,
      crewBreakdown: updatedCrew,
      workerCount,
      totalHours,
    });
  };
```
- In the Crew Breakdown JSX, render columns:
  - `Craft / Role` (flex-1)
  - `Workers` (w-16, number input)
  - `Hrs/Worker` (w-20, number input step 0.5)
  - `Row Total: <count * hpp>h` (text-xs tabular-nums text-muted-foreground)
- In the Report Details section, add the Reporter input:
```tsx
<div>
  <FieldLabel required>Reporter / Author (Foreman / Submitter)</FieldLabel>
  <FieldInput
    value={data.submittedBy || ""}
    onChange={(v) => set("submittedBy", v)}
    placeholder="e.g. Evan Grimm, Lead Foreman"
  />
</div>
```
- Add preview buckets for both `attachedFiles` (Daily Captures) and `staFiles` (STA Photos).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run lib/crew-hours.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit crew calculation and UI updates**

```bash
git add lib/crew-hours.ts lib/crew-hours.test.ts components/intake/DailyConfirmCard.tsx
git commit -m "feat(intake): add interactive per-craft hours calculation and reporter input"
```

---

### Task 5: Dedicated STA Photo Capture Step in Intake Wizard

**Files:**
- Modify: `app/intake/[projectId]/page.tsx:280-700`
- Modify: `app/intake/[projectId]/hp/page.tsx:100-500`

**Interfaces:**
- Consumes: Wizard steps `type Step = 'upload' | 'sta' | 'confirm' | 'success'`, `sourceFiles`, `staFiles`.
- Produces: Clean mobile-friendly step `sta` prompting users to take photos of their STA forms before review.

- [ ] **Step 1: Check existing steps in `app/intake/[projectId]/page.tsx`**

Verify that `type Step = "upload" | "sta" | "confirm" | "success"`.
Add `staFiles` state: `const [staFiles, setStaFiles] = useState<File[]>([]);`.

- [ ] **Step 2: Implement the STA Step UI in `app/intake/[projectId]/page.tsx`**

```tsx
{step === "sta" && (
  <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
    <div className="text-center space-y-2">
      <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
        <ShieldCheck size={28} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Safety Task Analysis (STA) Photos
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Please take a photo or attach your signed daily STA safety briefing form. It will be attached directly to your ProjectSight daily report.
      </p>
    </div>

    {/* Photo Capture / Upload Actions */}
    <div className="flex flex-col sm:flex-row gap-3">
      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer transition text-sm">
        <Camera size={18} />
        <span>Take Photo of STA</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              setStaFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            }
          }}
        />
      </label>

      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer transition text-sm">
        <UploadCloud size={18} />
        <span>Upload File/PDF</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              setStaFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            }
          }}
        />
      </label>
    </div>

    {/* Gallery of captured STAs */}
    {staFiles.length > 0 && (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Captured STA Forms ({staFiles.length})
        </p>
        <div className="grid grid-cols-2 gap-2">
          {staFiles.map((file, i) => (
            <div key={i} className="relative group rounded-xl border border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800">
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setStaFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Navigation */}
    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          setFormData((prev) => ({ ...prev, staCompleted: staFiles.length > 0 }));
          setStep("confirm");
        }}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white transition text-sm"
        style={{ backgroundColor: "#0063a3" }}
      >
        {staFiles.length > 0 ? "Continue to Review" : "Continue"}
      </button>

      {staFiles.length === 0 && (
        <button
          type="button"
          onClick={() => {
            setFormData((prev) => ({ ...prev, staCompleted: false }));
            setStep("confirm");
          }}
          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          Skip STA for now (Flags report as missing STA)
        </button>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Route extract completions to `'sta'` instead of `'confirm'`**

In `handleFilesSelected`, `handleInterviewComplete`, and `handleFreeformSubmitted`:
Change `setStep("confirm")` $\rightarrow$ `setStep("sta")`.
Mirror the step in `app/intake/[projectId]/hp/page.tsx`.

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build`
Expected: Build compiles without errors.

- [ ] **Step 5: Commit STA capture step**

```bash
git add app/intake/[projectId]/page.tsx app/intake/[projectId]/hp/page.tsx
git commit -m "feat(intake): add dedicated Safety Task Analysis (STA) photo capture step"
```

---

### Task 6: Backend Intake Submit & Approve Routes with STA File Support

**Files:**
- Modify: `app/api/intake/submit/route.ts:50-135`
- Modify: `app/api/dailyreports/[dailyId]/approve/route.ts:35-85`

**Interfaces:**
- Consumes: Multipart form with `files` (daily captures) and `staFiles` (STA photos).
- Produces: Daily report record stored with both `rawSourceFiles` and `staFiles`, and forwarded to ProjectSight on approval.

- [ ] **Step 1: Update `app/api/intake/submit/route.ts` to accept `staFiles`**

In `app/api/intake/submit/route.ts`:
```typescript
    const rawStaFiles = [
      ...form.getAll('staFiles'),
      ...form.getAll('staFile'),
    ].filter((f): f is File => f instanceof File);

    let staFilesList: DailyReportAttachment[] = [];
    if (rawStaFiles.length > 0) {
      for (const f of rawStaFiles) {
        const fileBytes = Buffer.from(await f.arrayBuffer());
        const savedPath = saveUpload(id, `STA-${f.name}`, fileBytes);
        staFilesList.push({
          fileName: f.name,
          filePath: savedPath,
          fileSize: f.size,
          mimeType: f.type || 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          category: 'sta_form',
        });
      }
    }
```
Store `staFiles: staFilesList` and set `staCompleted: staFilesList.length > 0 || body.staCompleted === true`.

- [ ] **Step 2: Update `approve` route to send both daily and STA files**

In `app/api/dailyreports/[dailyId]/approve/route.ts`:
```typescript
      const filesToAttach: { fileName: string; fileBytes: Buffer; mimeType?: string; category?: 'daily_capture' | 'sta_form' }[] = [];

      // Daily capture files
      if (existing.rawSourceFiles && existing.rawSourceFiles.length > 0) {
        for (const att of existing.rawSourceFiles) {
          const fileData = readUpload(att.filePath);
          if (fileData) {
            filesToAttach.push({
              fileName: att.fileName,
              fileBytes: fileData,
              mimeType: att.mimeType,
              category: 'daily_capture',
            });
          }
        }
      }

      // STA form files
      if (existing.staFiles && existing.staFiles.length > 0) {
        for (const att of existing.staFiles) {
          const fileData = readUpload(att.filePath);
          if (fileData) {
            filesToAttach.push({
              fileName: att.fileName,
              fileBytes: fileData,
              mimeType: att.mimeType,
              category: 'sta_form',
            });
          }
        }
      }
```
Pass `files: filesToAttach` into `sendFog617ToProjectSight`.

- [ ] **Step 3: Run existing ProjectSight approval tests**

Run: `npm test -- --run lib/projectsight/send-daily.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit submit and approve routes**

```bash
git add app/api/intake/submit/route.ts app/api/dailyreports/[dailyId]/approve/route.ts
git commit -m "feat(api): persist staFiles and attach both daily captures and STAs on approval"
```

---

### Task 7: Bowling Sheet Missing STA Warning Badge & Detail Modal

**Files:**
- Modify: `components/bowling/BowlingTable.tsx:50-80`
- Modify: `components/bowling/DailyDetailModal.tsx:140-180`

**Interfaces:**
- Consumes: `BowlingCellWithReport` with `staCompleted` and `fullReport.staFiles`.
- Produces: Amber `⚠️ STA` badge on cells missing STA, and warning alert banner in detail modal.

- [ ] **Step 1: Update `SubmittedCell` in `components/bowling/BowlingTable.tsx`**

In `components/bowling/BowlingTable.tsx`:
```tsx
function SubmittedCell({
  cell,
  onClick,
}: {
  cell: BowlingCellWithReport;
  onClick: () => void;
}) {
  const hasSta = cell.staCompleted === true || (cell.fullReport?.staFiles && cell.fullReport.staFiles.length > 0);
  const reporter = cell.fullReport?.submittedBy;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 flex flex-col items-center justify-center relative",
        "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70",
        "rounded transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800",
        "p-0.5 text-center leading-none"
      )}
      title={`${cell.tradePartnerName} – ${cell.date}\n${cell.workerCount} workers · ${cell.totalHours}h\n${reporter ? `Reporter: ${reporter}\n` : ''}${hasSta ? 'STA Attached' : '⚠️ Missing STA Form'}`}
    >
      {!hasSta && (
        <span
          className="absolute -top-1 -right-1 px-1 bg-amber-500 text-white rounded text-[7px] font-black shadow-xs tracking-tight"
          title="Missing STA Form"
        >
          STA
        </span>
      )}
      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 leading-none">
        {cell.workerCount ?? 0}w
      </span>
      <span className="text-[8px] text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
        {cell.totalHours ?? 0}h
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Update `DailyDetailModal.tsx` to show reporter contact and STA alert**

In `components/bowling/DailyDetailModal.tsx`:
Add banner above Work Performed when STA is missing:
```tsx
{!cell.staCompleted && (
  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <div className="space-y-1">
      <p className="font-semibold">Missing STA Safety Form</p>
      <p>
        No Safety Task Analysis photos were attached to this daily report.
        {report?.submittedBy && (
          <span className="block mt-0.5 font-medium">
            Original Reporter: {report.submittedBy}
          </span>
        )}
      </p>
    </div>
  </div>
)}
```

- [ ] **Step 3: Run build to verify type check**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 4: Commit bowling table updates**

```bash
git add components/bowling/BowlingTable.tsx components/bowling/DailyDetailModal.tsx
git commit -m "feat(bowling): render amber badge and modal alert for missing STA reports"
```

---

### Task 8: Dashboard Missing STA Follow-Ups Card

**Files:**
- Create: `components/dashboard/MissingStaFollowUps.tsx`
- Modify: `components/dashboard/DashboardShell.tsx`

**Interfaces:**
- Consumes: Project daily reports for the current month.
- Produces: Dedicated Dashboard card displaying all submitted daily reports missing STA, showing trade, date, reporter name, and one-click contact action.

- [ ] **Step 1: Create `components/dashboard/MissingStaFollowUps.tsx`**

```tsx
"use client";

import React from "react";
import { AlertTriangle, Mail, ShieldAlert } from "lucide-react";
import type { DailyReport } from "@/types/hpproto";

interface MissingStaFollowUpsProps {
  reports: DailyReport[];
  month: string;
}

export function MissingStaFollowUps({ reports, month }: MissingStaFollowUpsProps) {
  const missingStas = reports.filter((r) => {
    if (!r.date.startsWith(month)) return false;
    const hasSta = r.staCompleted === true || (r.staFiles && r.staFiles.length > 0);
    return !hasSta;
  });

  if (missingStas.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Missing STA Follow-Ups ({missingStas.length})</h3>
        </div>
        <span className="text-xs text-amber-700/80 dark:text-amber-400 font-medium">
          Requires Safety Form
        </span>
      </div>

      <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
        {missingStas.map((r) => {
          const reporter = r.submittedBy || "Field Submitter";
          const email = r.emailRecipients?.[0];
          return (
            <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200">{r.tradePartnerName}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {r.date} · Reporter: <span className="font-medium text-gray-700 dark:text-gray-300">{reporter}</span>
                </p>
              </div>

              {email ? (
                <a
                  href={`mailto:${email}?subject=Missing%20STA%20Form%20-%20${encodeURIComponent(r.tradePartnerName)}%20(${r.date})&body=Hi%20${encodeURIComponent(reporter)},%0A%0APlease%20provide%20the%20signed%20STA%20safety%20form%20for%20${r.date}.%0A%0AThank%20you.`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition"
                >
                  <Mail size={12} />
                  <span>Contact</span>
                </a>
              ) : (
                <span className="text-muted-foreground italic text-[11px]">No email on file</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Embed `MissingStaFollowUps` into `DashboardShell.tsx`**

In `components/dashboard/DashboardShell.tsx`:
Import `MissingStaFollowUps` and render it directly above `MonthlyGrid` or in the top summary section when `data` is loaded.

- [ ] **Step 3: Run full verification build and tests**

Run:
```bash
npm test -- --run
npm run build
```
Expected: All tests pass and build succeeds cleanly.

- [ ] **Step 4: Commit dashboard widget**

```bash
git add components/dashboard/MissingStaFollowUps.tsx components/dashboard/DashboardShell.tsx
git commit -m "feat(dashboard): add Missing STA Follow-Ups card with reporter contact actions"
```

---

## Plan Self-Review Checklist

- **Spec coverage:** Per-craft hours sum? Yes (Tasks 1, 2, 4). Reporter attribution in body? Yes (Tasks 2, 4). Daily captures attached? Yes (Tasks 3, 6). Dedicated STA capture step for all entry types? Yes (Task 5). Bowling Sheet indicator? Yes (Task 7). Dashboard indicator? Yes (Task 8).
- **Placeholder scan:** No TBDs, TODOs, or vague steps. Complete code provided in all tasks.
- **Type consistency:** `CrewEntry`, `DailyReportAttachment`, `DailyReport`, `Fog617Capture`, and `SendDailyAttachment` interfaces are aligned across all tasks.
