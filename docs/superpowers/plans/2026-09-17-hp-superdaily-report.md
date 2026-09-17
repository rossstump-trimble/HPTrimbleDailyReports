# Superdaily Report & Ingestion Disaster-Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an on-instance ingestion disaster-recovery backup layer and an AI-driven Superdaily synthesis page (`/projects/[projectId]/superdaily`) with inter-trade favor extraction, superintendent editing, and vector PDF download.

**Architecture:**
- **Disaster-Recovery Archive (`lib/ingest-backup.ts`):** Automatically copies every ingested daily report (structured JSON + raw attached photos/PDFs/audio) to disk under `data/ingested-dailies/<projectId>/<date>/<dailyId>/` during `/api/intake/submit`.
- **Superdaily Synthesis Engine (`lib/superdaily.ts`):** Aggregates daily reports for any date, synthesizes executive summaries, manpower counts, trade work, and inter-trade favors (equipment loans, crane sharing, access swaps) via Gemini 3.7 Flash with a deterministic regex/rule-based fallback when offline.
- **Interactive UI & Vector PDF Print:** Dedicated page with date picker, metrics cards, favor badges, trade table, inline editing, and `@media print` Letter-size document export.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui & Lucide React, Google Gemini API (`@google/generative-ai`), Vitest.

## Global Constraints

- Root directory: `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`
- Strictly targeted to the **HP Daily Report app** (`project-sight-boiler`), NEVER modifying `asa` or `ape`.
- Do not break existing Daily Intake, Bowling Sheet, Inspections, or Punch List workflows.
- All tests must pass using `npm test` (Vitest).
- Strict TypeScript (no `any`).

---

### Task 1: Superdaily Data Types & Disaster-Recovery Backup Subsystem

**Files:**
- Create: `types/superdaily.ts`
- Create: `lib/ingest-backup.ts`
- Test: `lib/ingest-backup.test.ts`

**Interfaces:**
- Produces: `TradeFavor`, `TradeWorkSummary`, `SuperdailyReport`, `SuperdailySummarizeResponse` in `types/superdaily.ts`.
- Produces: `backupIngestedDaily(report, files, baseDir)`, `listLocalIngestedDailies(projectId, date, baseDir)`, `readIngestedDailyBackup(projectId, date, dailyId, baseDir)` in `lib/ingest-backup.ts`.

- [ ] **Step 1: Write failing test for disaster-recovery backup**

Create `lib/ingest-backup.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  backupIngestedDaily,
  listLocalIngestedDailies,
  readIngestedDailyBackup,
} from './ingest-backup';
import type { DailyReport } from '@/types/hpproto';

const TEST_BACKUP_DIR = path.join(process.cwd(), 'data', 'test-ingested-dailies');

describe('Ingestion Disaster-Recovery Backup', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      fs.rmSync(TEST_BACKUP_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      fs.rmSync(TEST_BACKUP_DIR, { recursive: true, force: true });
    }
  });

  it('backs up a daily report record and raw file attachments to disk', () => {
    const report: DailyReport = {
      id: 'dr-101',
      projectId: '1025',
      tradePartnerId: 'apex-painting',
      tradePartnerName: 'Apex Painting',
      date: '2026-09-17',
      submittedAt: '2026-09-17T14:30:00.000Z',
      locationDescription: 'Building B Level 3',
      workerCount: 6,
      totalHours: 48,
      crewBreakdown: [{ craft: 'Journeyman Painter', count: 6 }],
      equipment: ['Scissor Lift 32ft'],
      notes: 'Borrowed scissor lift from Steel Erector to finish primer coat at high ceilings.',
      staCompleted: true,
      emailRecipients: ['super@example.com'],
    };

    const mockFileBytes = Buffer.from('fake image content');
    const backupPath = backupIngestedDaily(
      report,
      [{ name: 'daily_sheet.jpg', buffer: mockFileBytes }],
      TEST_BACKUP_DIR,
    );

    expect(fs.existsSync(backupPath)).toBe(true);
    expect(fs.existsSync(path.join(backupPath, 'daily-record.json'))).toBe(true);
    expect(fs.existsSync(path.join(backupPath, 'files', 'daily_sheet.jpg'))).toBe(true);

    const savedRecord = JSON.parse(
      fs.readFileSync(path.join(backupPath, 'daily-record.json'), 'utf-8'),
    ) as DailyReport;
    expect(savedRecord.tradePartnerName).toBe('Apex Painting');
    expect(savedRecord.workerCount).toBe(6);

    const listed = listLocalIngestedDailies('1025', '2026-09-17', TEST_BACKUP_DIR);
    expect(listed.length).toBe(1);
    expect(listed[0].id).toBe('dr-101');

    const readBack = readIngestedDailyBackup('1025', '2026-09-17', 'dr-101', TEST_BACKUP_DIR);
    expect(readBack).not.toBeNull();
    expect(readBack?.report.notes).toContain('Borrowed scissor lift');
    expect(readBack?.files.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ingest-backup.test.ts`
Expected: FAIL (missing types and functions)

- [ ] **Step 3: Implement `types/superdaily.ts` and `lib/ingest-backup.ts`**

Create `types/superdaily.ts`:
```typescript
export type TradeFavorType =
  | 'equipment_sharing'
  | 'material_handling'
  | 'access_handover'
  | 'manpower_assist'
  | 'general';

export interface TradeFavor {
  providingTrade: string;
  receivingTrade: string;
  description: string;
  type: TradeFavorType;
}

export interface TradeWorkSummary {
  tradePartnerId: string;
  tradePartnerName: string;
  category?: string;
  workerCount: number;
  totalHours: number;
  locationDescription: string;
  workPerformed: string;
  equipment: string[];
  staCompleted: boolean;
  notes?: string;
}

export interface SuperdailySafety {
  allCompleted: boolean;
  staNotes: string;
  incidentsReported: boolean;
}

export interface SuperdailyReport {
  id: string;
  projectId: string;
  projectName: string;
  date: string; // YYYY-MM-DD
  generatedAt: string;
  executiveSummary: string;
  totalHeadcount: number;
  totalManHours: number;
  activeTradeCount: number;
  tradeSummaries: TradeWorkSummary[];
  interTradeFavors: TradeFavor[];
  delaysAndRoadblocks: string[];
  safetyAndStas: SuperdailySafety;
  weatherSummary?: string;
}

export interface SuperdailySummarizeRequest {
  date: string; // YYYY-MM-DD
}

export interface SuperdailySummarizeResponse {
  success: boolean;
  report?: SuperdailyReport;
  reportsCount: number;
  error?: string;
}
```

Create `lib/ingest-backup.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import type { DailyReport } from '@/types/hpproto';

export function defaultBackupRoot(): string {
  return process.env.HPPROTO_BACKUP_ROOT || path.join(process.cwd(), 'data', 'ingested-dailies');
}

export interface IngestedFileAttachment {
  name: string;
  buffer: Buffer;
}

export interface IngestedBackupBundle {
  report: DailyReport;
  metadata: {
    backedUpAt: string;
    fileCount: number;
  };
  files: string[];
}

export function backupIngestedDaily(
  report: DailyReport,
  files?: IngestedFileAttachment[],
  backupRoot: string = defaultBackupRoot(),
): string {
  const safeProject = (report.projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeDate = (report.date || 'no-date').replace(/[^0-9-]/g, '_');
  const safeDailyId = (report.id || `daily-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');

  const targetDir = path.join(backupRoot, safeProject, safeDate, safeDailyId);
  fs.mkdirSync(targetDir, { recursive: true });

  const recordJson = JSON.stringify(report, null, 2);
  fs.writeFileSync(path.join(targetDir, 'daily-record.json'), recordJson, 'utf-8');

  const filesDir = path.join(targetDir, 'files');
  fs.mkdirSync(filesDir, { recursive: true });

  const savedFiles: string[] = [];
  if (Array.isArray(files) && files.length > 0) {
    for (const f of files) {
      const safeName = path.basename(f.name).replace(/[^a-zA-Z0-9._-]/g, '_');
      fs.writeFileSync(path.join(filesDir, safeName), f.buffer);
      savedFiles.push(safeName);
    }
  }

  const meta = {
    backedUpAt: new Date().toISOString(),
    fileCount: savedFiles.length,
    projectId: report.projectId,
    date: report.date,
    dailyId: report.id,
    tradePartnerName: report.tradePartnerName,
  };
  fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf-8');

  return targetDir;
}

export function listLocalIngestedDailies(
  projectId: string,
  date: string,
  backupRoot: string = defaultBackupRoot(),
): DailyReport[] {
  const safeProject = (projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeDate = (date || 'no-date').replace(/[^0-9-]/g, '_');
  const dir = path.join(backupRoot, safeProject, safeDate);

  if (!fs.existsSync(dir)) return [];

  const subdirs = fs.readdirSync(dir, { withFileTypes: true });
  const reports: DailyReport[] = [];

  for (const d of subdirs) {
    if (!d.isDirectory()) continue;
    const recordFile = path.join(dir, d.name, 'daily-record.json');
    if (fs.existsSync(recordFile)) {
      try {
        const raw = fs.readFileSync(recordFile, 'utf-8');
        reports.push(JSON.parse(raw) as DailyReport);
      } catch {
        // Skip unreadable record
      }
    }
  }

  return reports;
}

export function readIngestedDailyBackup(
  projectId: string,
  date: string,
  dailyId: string,
  backupRoot: string = defaultBackupRoot(),
): IngestedBackupBundle | null {
  const safeProject = (projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeDate = (date || 'no-date').replace(/[^0-9-]/g, '_');
  const safeDailyId = (dailyId || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetDir = path.join(backupRoot, safeProject, safeDate, safeDailyId);

  const recordFile = path.join(targetDir, 'daily-record.json');
  if (!fs.existsSync(recordFile)) return null;

  try {
    const report = JSON.parse(fs.readFileSync(recordFile, 'utf-8')) as DailyReport;
    const filesDir = path.join(targetDir, 'files');
    const files = fs.existsSync(filesDir) ? fs.readdirSync(filesDir) : [];
    const metaFile = path.join(targetDir, 'metadata.json');
    const metadata = fs.existsSync(metaFile)
      ? JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
      : { backedUpAt: new Date().toISOString(), fileCount: files.length };

    return { report, metadata, files };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ingest-backup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler
git add types/superdaily.ts lib/ingest-backup.ts lib/ingest-backup.test.ts
git commit -m "feat(superdaily): add superdaily types and disaster recovery backup subsystem"
```

---

### Task 2: Ingestion Route Hook & Staging Resilience

**Files:**
- Modify: `app/api/intake/submit/route.ts`
- Test: `app/api/intake/submit-backup.test.ts`

**Interfaces:**
- Consumes: `backupIngestedDaily` from `lib/ingest-backup.ts`.
- Hooks `POST /api/intake/submit` so every submitted report is synchronously backed up to disk.

- [ ] **Step 1: Write integration test for submit disaster-recovery hook**

Create `app/api/intake/submit-backup.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './submit/route';
import { listLocalIngestedDailies } from '@/lib/ingest-backup';
import fs from 'fs';
import path from 'path';

const BACKUP_ROOT = path.join(process.cwd(), 'data', 'ingested-dailies');

describe('Intake Submit Backup Hook', () => {
  it('creates an on-disk backup when submitting a daily report', async () => {
    const testDate = `2026-09-${Math.floor(Math.random() * 10) + 10}`;
    const req = new Request('http://localhost:3000/api/intake/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: '1025',
        tradePartnerName: 'Three Star Drywall',
        date: testDate,
        workerCount: 5,
        totalHours: 40,
        notes: 'Drywall framing complete. Handed over corridor to electrical.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const backups = listLocalIngestedDailies('1025', testDate);
    expect(backups.length).toBeGreaterThan(0);
    const saved = backups.find((b) => b.tradePartnerName === 'Three Star Drywall');
    expect(saved).toBeDefined();
    expect(saved?.notes).toContain('Drywall framing complete');
  });
});
```

- [ ] **Step 2: Run test to verify it fails or runs**

Run: `npx vitest run app/api/intake/submit-backup.test.ts`
Expected: FAIL (backup not hooked yet)

- [ ] **Step 3: Modify `app/api/intake/submit/route.ts` to call `backupIngestedDaily`**

In `app/api/intake/submit/route.ts`:
Import `backupIngestedDaily` from `@/lib/ingest-backup`.
Before `upsertDailyReport(report)`, call:
```typescript
try {
  const fileAttachments = [];
  for (const f of files) {
    fileAttachments.push({
      name: f.name,
      buffer: Buffer.from(await f.arrayBuffer()),
    });
  }
  backupIngestedDaily(report, fileAttachments);
} catch (backupErr) {
  console.warn('[submit] disaster recovery backup failed', backupErr);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/intake/submit-backup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler
git add app/api/intake/submit/route.ts app/api/intake/submit-backup.test.ts
git commit -m "feat(intake): hook disaster recovery backup into daily intake submit"
```

---

### Task 3: Superdaily Summarization Engine with Inter-Trade Favor Extraction

**Files:**
- Create: `lib/superdaily.ts`
- Test: `lib/superdaily.test.ts`

**Interfaces:**
- Produces: `synthesizeSuperdaily(projectId, date, reports, projectName)` in `lib/superdaily.ts`.
- Extracts: Headcount, hours, trade summaries, and inter-trade favors via Gemini with deterministic keyword regex fallback.

- [ ] **Step 1: Write tests for Superdaily summarization engine**

Create `lib/superdaily.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  buildSuperdailyPrompt,
  parseSuperdailyResponse,
  synthesizeDeterministicFallback,
  extractInterTradeFavorsFromNotes,
} from './superdaily';
import type { DailyReport } from '@/types/hpproto';

describe('Superdaily Summarization Engine', () => {
  const mockReports: DailyReport[] = [
    {
      id: 'dr-1',
      projectId: '1025',
      tradePartnerId: 'apex-painting',
      tradePartnerName: 'Apex Painting',
      date: '2026-09-17',
      submittedAt: '2026-09-17T16:00:00Z',
      locationDescription: 'Corridor B Level 2',
      workerCount: 4,
      totalHours: 32,
      crewBreakdown: [{ craft: 'Painter', count: 4 }],
      equipment: ['Ladders', 'Sprayer'],
      notes: 'Steel Erector loaned us their 60ft boom lift so we could paint the high structural deck. Finished prime coat on time.',
      staCompleted: true,
      emailRecipients: [],
    },
    {
      id: 'dr-2',
      projectId: '1025',
      tradePartnerId: 'steel-erector',
      tradePartnerName: 'Steel Erector Inc',
      date: '2026-09-17',
      submittedAt: '2026-09-17T16:30:00Z',
      locationDescription: 'Main Atrium Level 2',
      workerCount: 8,
      totalHours: 64,
      crewBreakdown: [{ craft: 'Ironworker', count: 8 }],
      equipment: ['60ft Boom Lift', 'Crane 100T'],
      notes: 'Assisted painting crew with boom lift sharing. Crane hoist used to place 4 structural steel beams at Atrium grid 4-G.',
      staCompleted: true,
      emailRecipients: [],
    },
  ];

  it('builds grounded Gemini prompt with all trade reports', () => {
    const prompt = buildSuperdailyPrompt('Hensel Phelps Demo Project', '2026-09-17', mockReports);
    expect(prompt).toContain('Hensel Phelps Demo Project');
    expect(prompt).toContain('Apex Painting');
    expect(prompt).toContain('Steel Erector Inc');
    expect(prompt).toContain('interTradeFavors');
  });

  it('extracts inter-trade favors deterministically from notes', () => {
    const favors = extractInterTradeFavorsFromNotes(mockReports);
    expect(favors.length).toBeGreaterThan(0);
    const liftFavor = favors.find((f) => f.description.toLowerCase().includes('boom lift'));
    expect(liftFavor).toBeDefined();
    expect(liftFavor?.type).toBe('equipment_sharing');
  });

  it('synthesizes valid fallback report when offline or Gemini is unset', () => {
    const report = synthesizeDeterministicFallback('1025', 'Hensel Phelps Demo', '2026-09-17', mockReports);
    expect(report.totalHeadcount).toBe(12);
    expect(report.totalManHours).toBe(96);
    expect(report.activeTradeCount).toBe(2);
    expect(report.tradeSummaries.length).toBe(2);
    expect(report.interTradeFavors.length).toBeGreaterThan(0);
    expect(report.safetyAndStas.allCompleted).toBe(true);
  });

  it('parses structured JSON Gemini response cleanly', () => {
    const sampleAiJson = JSON.stringify({
      executiveSummary: 'Substantial progress made across Level 2 structural steel and coating operations.',
      interTradeFavors: [
        {
          providingTrade: 'Steel Erector Inc',
          receivingTrade: 'Apex Painting',
          description: 'Loaned 60ft boom lift for overhead deck painting',
          type: 'equipment_sharing',
        },
      ],
      delaysAndRoadblocks: [],
      safetyNotes: 'All trade STAs completed prior to shift start.',
    });

    const parsed = parseSuperdailyResponse(sampleAiJson, '1025', 'Demo Proj', '2026-09-17', mockReports);
    expect(parsed.executiveSummary).toContain('Substantial progress');
    expect(parsed.interTradeFavors.length).toBe(1);
    expect(parsed.interTradeFavors[0].providingTrade).toBe('Steel Erector Inc');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/superdaily.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/superdaily.ts`**

Implement prompt generator, favor regex extractor, deterministic fallback synthesizer, and `synthesizeSuperdaily`:
```typescript
import { geminiGenerate, GEMINI_TEXT_MODEL } from '@/lib/gemini-client';
import type { DailyReport } from '@/types/hpproto';
import type {
  SuperdailyReport,
  TradeFavor,
  TradeFavorType,
  TradeWorkSummary,
} from '@/types/superdaily';

export function buildSuperdailyPrompt(
  projectName: string,
  date: string,
  reports: DailyReport[],
): string {
  const reportsText = reports
    .map(
      (r, i) => `
Trade ${i + 1}: ${r.tradePartnerName}
Location: ${r.locationDescription || 'Not specified'}
Workers: ${r.workerCount} | Hours: ${r.totalHours}
Equipment: ${r.equipment?.join(', ') || 'None'}
STA Completed: ${r.staCompleted ? 'Yes' : 'No'}
Notes: ${r.notes || 'None'}
`,
    )
    .join('\n---');

  return `You are a Lead Project Superintendent for Hensel Phelps.
Synthesize all subcontractor daily reports for project "${projectName}" on date "${date}" into a comprehensive, professional Superdaily master report.

Individual Subcontractor Reports:
${reportsText}

Requirements:
1. Executive Summary: A concise, authoritative overview of the jobsite tempo, major milestones achieved, and areas of high activity.
2. Inter-Trade Favors & Coordination: Scrutinize all subcontractor notes for instances of mutual aid, equipment sharing (e.g. boom lifts, scissor lifts, crane time), shared access, material staging handoffs, or manpower coordination.
3. Delays & Roadblocks: Explicitly call out any delays, material shortages, or weather disruptions noted by trades.
4. Safety & STAs: Summarize safety meeting / STA compliance.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "string",
  "interTradeFavors": [
    {
      "providingTrade": "string",
      "receivingTrade": "string",
      "description": "string",
      "type": "equipment_sharing" | "material_handling" | "access_handover" | "manpower_assist" | "general"
    }
  ],
  "delaysAndRoadblocks": ["string"],
  "safetyNotes": "string"
}`;
}

export function extractInterTradeFavorsFromNotes(reports: DailyReport[]): TradeFavor[] {
  const favors: TradeFavor[] = [];
  const favorRegex = /(loaned|borrowed|shared|assisted|helped|handed over|crane hoist|boom lift|staging)/i;

  for (const r of reports) {
    const notes = r.notes || '';
    if (favorRegex.test(notes)) {
      let type: TradeFavorType = 'general';
      if (/lift|crane|equipment|generator|forklift/i.test(notes)) {
        type = 'equipment_sharing';
      } else if (/staging|laydown|material|unloaded/i.test(notes)) {
        type = 'material_handling';
      } else if (/handover|handed over|access|cleared space/i.test(notes)) {
        type = 'access_handover';
      } else if (/assisted|helped|crew|manpower/i.test(notes)) {
        type = 'manpower_assist';
      }

      // Detect potential trade mentioned in notes
      let otherTrade = 'Subcontractor';
      for (const other of reports) {
        if (other.id !== r.id && notes.toLowerCase().includes(other.tradePartnerName.toLowerCase())) {
          otherTrade = other.tradePartnerName;
          break;
        }
      }

      const isBorrowing = /borrowed|received|got access/i.test(notes);
      favors.push({
        providingTrade: isBorrowing ? otherTrade : r.tradePartnerName,
        receivingTrade: isBorrowing ? r.tradePartnerName : otherTrade,
        description: notes.slice(0, 160),
        type,
      });
    }
  }

  return favors;
}

export function synthesizeDeterministicFallback(
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
): SuperdailyReport {
  let totalHeadcount = 0;
  let totalManHours = 0;
  const delays: string[] = [];
  let allStas = true;

  const tradeSummaries: TradeWorkSummary[] = reports.map((r) => {
    totalHeadcount += r.workerCount || 0;
    totalManHours += r.totalHours || 0;
    if (!r.staCompleted) allStas = false;

    if (r.notes && /delay|waiting|blocked|rain|mud|shortage/i.test(r.notes)) {
      delays.push(`${r.tradePartnerName}: ${r.notes.slice(0, 120)}`);
    }

    return {
      tradePartnerId: r.tradePartnerId,
      tradePartnerName: r.tradePartnerName,
      workerCount: r.workerCount || 0,
      totalHours: r.totalHours || 0,
      locationDescription: r.locationDescription || 'Site general',
      workPerformed: r.notes || 'Routine trade activities reported.',
      equipment: r.equipment || [],
      staCompleted: Boolean(r.staCompleted),
      notes: r.notes,
    };
  });

  const interTradeFavors = extractInterTradeFavorsFromNotes(reports);

  return {
    id: `superdaily-${projectId}-${date}-${Date.now()}`,
    projectId,
    projectName,
    date,
    generatedAt: new Date().toISOString(),
    executiveSummary: `On ${date}, ${reports.length} subcontractor trades reported on site with a total manpower of ${totalHeadcount} workers logging ${totalManHours} man-hours. Operations proceeded smoothly across designated work zones with ${interTradeFavors.length} noted instances of inter-trade equipment sharing and logistics coordination.`,
    totalHeadcount,
    totalManHours,
    activeTradeCount: reports.length,
    tradeSummaries,
    interTradeFavors,
    delaysAndRoadblocks: delays,
    safetyAndStas: {
      allCompleted: allStas,
      staNotes: allStas
        ? 'All on-site subcontractors confirmed completion of morning STAs and safety briefings.'
        : 'One or more trade partners logged incomplete or unconfirmed STA safety checklists.',
      incidentsReported: false,
    },
  };
}

export function parseSuperdailyResponse(
  jsonText: string,
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
): SuperdailyReport {
  const fallback = synthesizeDeterministicFallback(projectId, projectName, date, reports);
  try {
    const clean = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    return {
      ...fallback,
      executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
      interTradeFavors: Array.isArray(parsed.interTradeFavors) && parsed.interTradeFavors.length > 0
        ? parsed.interTradeFavors
        : fallback.interTradeFavors,
      delaysAndRoadblocks: Array.isArray(parsed.delaysAndRoadblocks)
        ? parsed.delaysAndRoadblocks
        : fallback.delaysAndRoadblocks,
      safetyAndStas: {
        ...fallback.safetyAndStas,
        staNotes: parsed.safetyNotes || fallback.safetyAndStas.staNotes,
      },
    };
  } catch {
    return fallback;
  }
}

export async function synthesizeSuperdaily(
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
): Promise<SuperdailyReport> {
  if (reports.length === 0) {
    return synthesizeDeterministicFallback(projectId, projectName, date, []);
  }

  const prompt = buildSuperdailyPrompt(projectName, date, reports);

  try {
    const res = await geminiGenerate({
      model: GEMINI_TEXT_MODEL,
      parts: [{ text: prompt }],
    });

    if (res?.text) {
      return parseSuperdailyResponse(res.text, projectId, projectName, date, reports);
    }
  } catch (err) {
    console.warn('[superdaily] Gemini synthesis failed, falling back to deterministic mode', err);
  }

  return synthesizeDeterministicFallback(projectId, projectName, date, reports);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/superdaily.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler
git add lib/superdaily.ts lib/superdaily.test.ts
git commit -m "feat(superdaily): add Superdaily summarization engine with inter-trade favor extraction"
```

---

### Task 4: Superdaily API Route

**Files:**
- Create: `app/api/projects/[projectId]/superdaily/summarize/route.ts`
- Test: `app/api/projects/[projectId]/superdaily/route.test.ts`

**Interfaces:**
- Produces: `POST /api/projects/[projectId]/superdaily/summarize`
- Accepts: `{ date: string }`
- Returns: `{ success: boolean, report: SuperdailyReport, reportsCount: number }`

- [ ] **Step 1: Write route integration tests**

Create `app/api/projects/[projectId]/superdaily/route.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { POST } from './summarize/route';

describe('Superdaily Summarize API Route', () => {
  it('rejects invalid date formats', async () => {
    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: 'invalid-date' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('summarizes reports for a valid date', async () => {
    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-17' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(data.report.projectId).toBe('1025');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/projects/[projectId]/superdaily/route.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `app/api/projects/[projectId]/superdaily/summarize/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { getProjectById, getStore } from '@/lib/store';
import { synthesizeSuperdaily } from '@/lib/superdaily';
import { cookies } from 'next/headers';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import { SESSION_COOKIE } from '@/lib/local-session';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { listDailyReports } from '@/lib/projectsight/client';
import type { DailyReport } from '@/types/hpproto';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const date = String(body.date || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    const store = getStore();
    const localReports = store.dailyReports.filter(
      (r) => r.projectId.toLowerCase() === projectId.toLowerCase() && r.date === date,
    );

    const mergedReports: DailyReport[] = [...localReports];

    // Attempt live ProjectSight lookup if authenticated
    const jar = cookies();
    const token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
    const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
    const psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
    const psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;

    if (token && psPortfolioId && psProjectId) {
      try {
        const livePs = await listDailyReports(token, psPortfolioId, psProjectId);
        if (Array.isArray(livePs)) {
          for (const raw of livePs) {
            const rDate = String(raw.Date || raw.ReportDate || '').slice(0, 10);
            if (rDate !== date) continue;

            const psId = String(raw.DailyReportID ?? raw.DailyReportId ?? raw.Id ?? '');
            if (mergedReports.some((r) => r.projectSightDailyId === psId)) continue;

            const works = Array.isArray(raw.DailyWorks) ? (raw.DailyWorks as Record<string, unknown>[]) : [];
            const tradeName = works[0]?.Trade ?? works[0]?.Company ?? 'ProjectSight Trade';
            mergedReports.push({
              id: `ps-${psId}`,
              projectId,
              tradePartnerId: String(tradeName).toLowerCase().replace(/\s+/g, '-'),
              tradePartnerName: String(tradeName),
              date,
              submittedAt: new Date().toISOString(),
              locationDescription: String(works[0]?.LocationDescription ?? 'Site General'),
              workerCount: Number(raw.TotalWorkersApproved ?? raw.TotalWorkersUnapproved ?? 1) || 1,
              totalHours: Number(raw.TotalWorkApproved ?? raw.TotalWorkUnapproved ?? 8) || 8,
              crewBreakdown: [],
              equipment: [],
              notes: String(raw.Notes ?? raw.GeneralNotes ?? works[0]?.Description ?? ''),
              staCompleted: true,
              emailRecipients: [],
              projectSightDailyId: psId,
            });
          }
        }
      } catch {
        // Fallback cleanly to local store
      }
    }

    const superdaily = await synthesizeSuperdaily(projectId, project.name, date, mergedReports);

    return NextResponse.json({
      success: true,
      report: superdaily,
      reportsCount: mergedReports.length,
    });
  } catch (err) {
    console.error('[superdaily/summarize] failed', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate superdaily' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/projects/[projectId]/superdaily/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler
git add app/api/projects/[projectId]/superdaily/ app/api/projects/[projectId]/superdaily/route.test.ts
git commit -m "feat(api): add Superdaily summarize route"
```

---

### Task 5: Navigation Tab & Bowling Matrix Quick Link

**Files:**
- Modify: `lib/projectsight/navigationData.ts`
- Modify: `lib/projectsight/navigationData.test.ts`
- Modify: `app/(home)/projects/[projectId]/bowling/page.tsx`

**Interfaces:**
- Produces: `superdaily` entry in `getNavigationItemsForProject`.
- Adds: "Superdaily" header button in `BowlingPage`.

- [ ] **Step 1: Update navigation tests**

In `lib/projectsight/navigationData.test.ts`, verify the `superdaily` item is present.

- [ ] **Step 2: Update `lib/projectsight/navigationData.ts`**

Add `Sparkles` icon and `superdaily` menu item at order 21:
```typescript
{
  id: "superdaily",
  name: "Superdaily",
  icon: Sparkles,
  path: `/projects/${projectId}/superdaily`,
  order: 21,
},
```

- [ ] **Step 3: Add Superdaily shortcut in `app/(home)/projects/[projectId]/bowling/page.tsx`**

Add a button in the Bowling page toolbar next to working days / export:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => router.push(`/projects/${projectId}/superdaily`)}
  className="gap-1.5 border-amber-300 bg-amber-50/50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
>
  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  Superdaily
</Button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/projectsight/navigationData.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler
git add lib/projectsight/navigationData.ts lib/projectsight/navigationData.test.ts app/(home)/projects/[projectId]/bowling/page.tsx
git commit -m "feat(navigation): add Superdaily tab and bowling matrix shortcut"
```

---

### Task 6: Superdaily Print Component & Interactive Page

**Files:**
- Create: `components/superdaily/SuperdailyPrintDocument.tsx`
- Create: `app/(home)/projects/[projectId]/superdaily/page.tsx`
- Test: `app/(home)/projects/[projectId]/superdaily/page.test.tsx`

**Interfaces:**
- Produces: `<SuperdailyPrintDocument report={report} />` with `@media print` CSS.
- Produces: Full interactive page at `/projects/[projectId]/superdaily`.

- [ ] **Step 1: Write test for Superdaily page component**

Create `app/(home)/projects/[projectId]/superdaily/page.test.tsx`:
```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuperdailyPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: '1025' }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('SuperdailyPage', () => {
  it('renders Superdaily header and controls', () => {
    render(<SuperdailyPage />);
    expect(screen.getByText(/Superdaily Report/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /generate superdaily/i })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/(home)/projects/[projectId]/superdaily/page.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `components/superdaily/SuperdailyPrintDocument.tsx`**

Build clean letterhead print template with Trimble / Hensel Phelps logo header, metric counters, inter-trade favor list, trade breakdown table, and signature/approval lines.

- [ ] **Step 4: Implement `app/(home)/projects/[projectId]/superdaily/page.tsx`**

Features:
- Date input defaulting to today (ISO string).
- Status summary pills (Active Trades, Total Workers, Total Man-Hours, STA status).
- "Generate Superdaily" button with loading state.
- "Edit Report" toggle allowing live editing of the executive summary and trade notes.
- "Download PDF" button triggering `window.print()`.
- Interactive cards for **Inter-Trade Coordination & Favors** with badges (`Steel Erector ➔ Apex Painting`).
- Responsive trade breakdown table.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run app/(home)/projects/[projectId]/superdaily/page.test.tsx`
Expected: PASS

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: All test suites PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler
git add components/superdaily/ app/(home)/projects/[projectId]/superdaily/
git commit -m "feat(ui): add Superdaily interactive review page and vector print document"
```
