# Superdaily Report & Ingestion Disaster-Recovery Design

**Date:** 2026-09-17  
**Status:** Approved  
**Target Repository / App:** `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler` (HP Daily Report App)

---

## 1. Executive Summary

The HP Daily Report application currently collects subcontractor daily field logs through photo scan OCR, browser voice interviews, and structured forms, feeding them into ProjectSight and a monthly bowling matrix.

This design introduces two critical enterprise capabilities:
1. **On-Instance Ingestion Disaster-Recovery Storage**: Whenever any daily report is ingested (whether through scan OCR, speech-to-text, or web form submission), an immutable local backup is archived to disk under `data/ingested-dailies/<projectId>/<date>/<dailyId>/`. Both the complete structured daily report JSON and all raw source attachments (scans, audio, or uploads) are saved to ensure zero data loss under network drops or upstream API failures.
2. **Superdaily Daily Synthesis & PDF Generation**: A dedicated project page (`/projects/[projectId]/superdaily`) and Bowling Sheet integration that synthesizes all individual subcontractor daily logs for a given date into a unified "Superdaily" master report. The synthesis highlights what happened on site, individual trade breakdowns, crew headcounts, and inter-trade coordination/favors (e.g. shared equipment, material staging swaps, access trades). The superintendent can review and edit the generated report, then download it as an executive-ready vector PDF document.

---

## 2. Architecture & Subsystems

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HP Daily Report Application                     │
└────────────────────────────────────────────────────────────────────────┘
          │ (1) Daily Intake (Photo OCR / Voice / Form)
          ▼
┌─────────────────────────────────┐
│     API: /api/intake/submit     │
└─────────────────────────────────┘
          │ (2) Pre-commit disaster recovery hook
          ▼
┌─────────────────────────────────┐
│       lib/ingest-backup.ts      │ ──► Writes to disk:
│                                 │     data/ingested-dailies/<proj>/<date>/<id>/
└─────────────────────────────────┘       ├── daily-record.json
          │                               ├── metadata.json
          ▼                               └── files/<original_files>
┌─────────────────────────────────┐
│      Local Store & PS Sync      │
│  (hpproto-db.json / TID API)    │
└─────────────────────────────────┘

          │
          │ (3) User accesses Superdaily Tab or Bowling Date Link
          ▼
┌──────────────────────────────────────────────┐
│  Page: /projects/[projectId]/superdaily      │
└──────────────────────────────────────────────┘
          │ (4) Click "Generate Superdaily"
          ▼
┌──────────────────────────────────────────────┐
│  API: /api/projects/[id]/superdaily/summarize│
└──────────────────────────────────────────────┘
          │
          ├──► Collect all dailies for <projectId> & <date>
          │    (Store + live ProjectSight reports)
          ▼
┌──────────────────────────────────────────────┐
│             lib/superdaily.ts                │
│                                              │
│  ├── Multimodal Gemini 3.7 Flash Synthesis   │
│  │   (Prompted for executive overview, trade │
│  │    breakdowns, inter-trade favors)        │
│  │                                           │
│  └── Deterministic Fallback Aggregator       │
│      (Offline / missing API key mode)        │
└──────────────────────────────────────────────┘
          │ (5) Returns SuperdailyReport JSON
          ▼
┌──────────────────────────────────────────────┐
│        Interactive Superdaily UI View        │
│  - Executive Overview Card                   │
│  - Inter-Trade Coordination & Favors Cards   │
│  - Trade Headcount & Work Breakdown Table    │
│  - Roadblocks, Discrepancies & Safety Status │
│  - Inline Editing Mode                       │
└──────────────────────────────────────────────┘
          │ (6) Click "Download PDF"
          ▼
┌──────────────────────────────────────────────┐
│       Vector PDF Output (@media print)       │
│  - Clean Letter size, Hensel Phelps styling  │
│  - Page-break avoidance on tables & cards    │
│  - Zero UI chrome, high-res typography       │
└──────────────────────────────────────────────┘
```

---

## 3. Detailed Data Models

### 3.1. Superdaily Data Contract (`types/superdaily.ts`)

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

---

## 4. Ingestion Disaster-Recovery Subsystem (`lib/ingest-backup.ts`)

### 4.1. Storage Layout
Backups reside in `process.env.HPPROTO_BACKUP_ROOT || path.join(process.cwd(), 'data', 'ingested-dailies')`:
```
data/ingested-dailies/
  └── <projectId>/
        └── <date>/
              └── <dailyId>/
                    ├── daily-record.json   # Full DailyReport object
                    ├── metadata.json       # Ingestion source, client IP, timestamp
                    └── files/              # Cloned raw uploads/photos/audio
                          ├── sheet_scan.jpg
                          └── site_note.pdf
```

### 4.2. Ingestion Hook in `/api/intake/submit`
Before storing into `hpproto-db.json` and sending to ProjectSight:
1. `backupIngestedDaily(report: DailyReport, files?: { name: string; buffer: Buffer }[])` is called.
2. If `files` are not directly passed in memory but exist in `uploadRoot()`, they are copied into the backup bundle.
3. Errors in the backup routine are logged cleanly without blocking primary intake, but writes are synchronized with atomic directory file creation.

### 4.3. Staging Persistence in `/api/intake/extract`
During OCR extraction, uploaded files are stored in `data/uploads/staging/` with timestamped hashes, ensuring unconfirmed sessions are never lost if the browser reloads.

---

## 5. Superdaily Summarization Engine (`lib/superdaily.ts`)

### 5.1. Daily Aggregation
1. Fetches all reports for `projectId` matching `date` from `getStore().dailyReports`.
2. If authenticated with ProjectSight, merges live ProjectSight reports for the same date.
3. If no reports exist for that date, returns `reportsCount: 0` with a user-friendly message.

### 5.2. Gemini 3.7 Flash Prompting & Inter-Trade Favors Extraction
The prompt provides all trade submissions for the date with their notes, equipment, and locations, instructing Gemini:
- **Tone**: Professional Hensel Phelps superintendent daily executive log.
- **Inter-Trade Coordination & Favors**: Explicitly search notes for references where one subcontractor provided assistance, loaned equipment (e.g. scissor lift, crane, hoist time), swapped staging areas, or coordinated critical path handovers with another trade.
- **Trade Summaries**: Clean, consolidated trade breakdown with headcount, hours, work areas, and installations.
- **Safety**: STA compliance across all active subs.

### 5.3. Deterministic Fallback Mode
When `GEMINI_API_KEY` is unavailable or if network calls to Google fail:
- Mathematically sums `totalHeadcount` and `totalManHours`.
- Constructs `tradeSummaries` directly from `DailyReport` entries.
- Employs rule-based regex parsing on `notes` for keywords (`favor`, `borrow`, `loan`, `share`, `shared`, `crane`, `lift`, `hoist`, `helped`, `coordinated with`) to populate `interTradeFavors`.
- Produces a valid `SuperdailyReport` without throwing errors.

---

## 6. Frontend Pages & Components

### 6.1. Navigation Integration (`lib/projectsight/navigationData.ts`)
Add tab:
```typescript
{
  id: "superdaily",
  name: "Superdaily",
  icon: Sparkles,
  path: `/projects/${projectId}/superdaily`,
  order: 21,
}
```

### 6.2. Dedicated Superdaily Page (`app/(home)/projects/[projectId]/superdaily/page.tsx`)
1. **Date Selection**: Pick any calendar date; auto-detects dates with submitted daily logs.
2. **Action Bar**:
   - `Generate Superdaily` (triggers `/api/projects/[projectId]/superdaily/summarize`).
   - `Edit Report` (toggle inline editing for executive summary, trade summaries, and notes).
   - `Download PDF` (calls `window.print()`).
3. **Card Sections**:
   - **Metrics Bar**: Total Workers on Site, Total Hours, Active Trades, Safety STA status.
   - **Executive Summary Card**: High-level narrative of site operations.
   - **Inter-Trade Favors & Coordination Card**: Clean badges showing providing trade -> receiving trade and favor details.
   - **Trade Breakdown Table**: Subcontractor table with headcount, hours, location, work performed, and STA badge.
   - **Roadblocks & Delays**: Flagged constraints and issues.

### 6.3. Bowling Sheet Integration (`app/(home)/projects/[projectId]/bowling/page.tsx`)
- Add a "View Superdaily" link/button in the Bowling table date column header and inside the day detail modal to quickly jump from the bowling matrix to that day's Superdaily.

### 6.4. Vector PDF Printing (`components/superdaily/SuperdailyPrintDocument.tsx`)
- Customized `@media print` CSS:
  - Header: Trimble / Hensel Phelps logo, Project Name, Project Code, Date, Generated Timestamp.
  - Page size: Standard US Letter (8.5" x 11") portrait.
  - Page break controls: `break-inside: avoid` on cards and table rows.
  - Hides web navigation, buttons, and sidebars in print mode.

---

## 7. Testing Strategy

1. **Disaster Recovery Backup Unit Tests (`lib/ingest-backup.test.ts`)**:
   - Verify backup folder creation under `data/ingested-dailies/<proj>/<date>/<id>/`.
   - Verify serialization of `daily-record.json` and preservation of uploaded binary attachments.
   - Verify listing and recovery functions.
2. **Superdaily Engine Unit Tests (`lib/superdaily.test.ts`)**:
   - Test prompt construction with mock daily reports.
   - Test deterministic fallback when Gemini is offline (verify mathematical aggregations, favor keyword extraction).
   - Test JSON parsing and validation against `SuperdailyReport`.
3. **API Integration Tests (`app/api/projects/[projectId]/superdaily/route.test.ts`)**:
   - Test `POST /api/projects/[projectId]/superdaily/summarize` with empty date, valid date, and no reports.
4. **UI Component Tests**:
   - Verify Superdaily page rendering, date changing, report display, and edit mode toggle.
   - Verify Navigation Data includes Superdaily.
