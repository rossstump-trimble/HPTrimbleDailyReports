# ProjectSight Daily Filing: Hours Breakdown, Reporter Attribution, Attachments & STA Tracking

**Date:** 2026-09-17  
**Status:** Approved  
**Project:** Hensel Phelps Daily Intake & ProjectSight Integration (`project-sight-boiler`)  

---

## 1. Problem Statement

When filing daily reports into ProjectSight:
1. **Total Hours Calculation & Worker Breakdown:** The total hours are not being summed accurately across worker crafts. The system must preserve the breakdown of hours per worker type/role (craft, worker count, and hours per worker), with the daily total hours automatically and accurately calculated as the sum of all rows.
2. **Reporter Attribution:** In ProjectSight, the user submitting the report is often a project engineer, superintendent, or operator with Trimble Identity (TID) credentials rather than the field foreman who authored the report. The body and narrative of the ProjectSight daily report must explicitly state who wrote the original report (e.g. `Reporter: Evan Grimm`).
3. **Daily Capture Attachments:** Images or scans of the captured daily report must be uploaded as attachments to the daily report in ProjectSight via the ProjectSight API.
4. **STA Report Capture:** For all entry methods (Speak Freely, Guided Q&A, Photo/File, and Form Entry), there must be a dedicated capture step prompting users to take photos of their signed Safety Task Analysis (STA) forms. These photos do not require OCR; they are uploaded directly as attachments to the daily report in ProjectSight.
5. **Missing STA Indicators:** If a daily report is submitted without STA photos, the Bowling Sheet and Project Dashboard must clearly highlight this deficiency and show who needs to be contacted for follow-up.

---

## 2. Architecture & Data Model

### 2.1 Types (`types/hpproto.ts`)

```typescript
export interface CrewEntry {
  craft: string;
  count: number;
  hoursPerWorker?: number; // Defaults to 8.0 if omitted
  totalHours?: number;     // Computed as count * (hoursPerWorker ?? 8.0)
}

export interface DailyReportAttachment {
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  category?: "daily_capture" | "sta_form"; // Distinguishes daily captures from STA documents
}
```

In `DailyReport`:
- `submittedBy`: Reporter's name and role (e.g., `"Evan Grimm, Foreman"`).
- `crewBreakdown`: Array of `CrewEntry`.
- `workerCount`: Sum of all `CrewEntry.count`.
- `totalHours`: Sum of all `CrewEntry.totalHours`.
- `staCompleted`: Boolean indicating whether STA was verified and attached.
- `rawSourceFiles`: Array of `DailyReportAttachment` tagged as `"daily_capture"`.
- `staFiles`: Array of `DailyReportAttachment` tagged as `"sta_form"`.

---

## 3. Detailed Component & Service Design

### 3.1 Crew Hours Calculation (`components/intake/DailyConfirmCard.tsx`)
- Each row in the Crew Breakdown table exposes:
  - `Craft / Role` (text input)
  - `Worker Count` (number input, min 0)
  - `Hours / Worker` (number input, defaults to 8.0)
  - `Row Total Hours` (computed display: `count * hoursPerWorker`)
- When any count or hours-per-worker value is modified:
  $$\text{Row Total} = \text{count} \times \text{hoursPerWorker}$$
  $$\text{Daily Total Workers} = \sum \text{Row Count}$$
  $$\text{Daily Total Hours} = \sum \text{Row Total}$$
- Both total fields auto-update instantaneously and are persisted to state.

### 3.2 Reporter Attribution & ProjectSight Body Mapping (`lib/projectsight/map-daily.ts`)
- **Top-of-Body Attribution:**
  ```text
  Reporter: Evan Grimm (Foreman)
  Submitted via Field Intake for ProjectSight
  ```
- **Crew Breakdown Narrative:**
  ```text
  Crew Breakdown:
  • Journeyman Electrician: 4 workers @ 8.0 hrs = 32.0 hrs
  • Apprentice Electrician: 2 workers @ 8.0 hrs = 16.0 hrs
  Total Crew: 6 workers · 48.0 total hours
  ```
- **ProjectSight `DailyWorks` Array:**
  Generates an entry for each role in `crewBreakdown`:
  - `Trade`: `entry.craft`
  - `Workers`: `entry.count`
  - `HoursPerDay`: `entry.hoursPerWorker ?? 8.0`
  - `TotalWork`: `entry.totalHours ?? (entry.count * 8.0)`
  - `Company`: `tradePartnerName`
  - `WorkDescription`: Location and summary of work performed
- The root ProjectSight daily record sets:
  - `TotalWorkersApproved`: `workerCount`
  - `TotalWorkApproved`: `totalHours`

### 3.3 Multi-File Attachment Dispatch with Prefixes (`lib/projectsight/send-daily.ts`)
- Both daily capture images and STA images are uploaded via `attachDailyReportFile`.
- File naming conventions:
  - Daily captures: `Daily-Capture-${index + 1}-${originalFileName}`
  - STA forms: `STA-Form-${index + 1}-${originalFileName}`
- In `sendFog617ToProjectSight`, all attachments are processed in sequence. If an individual file attachment encounters an issue, subsequent files are still processed, and results report partial/full attachment success.

### 3.4 Dedicated STA Photo Capture Step (`app/intake/[projectId]/page.tsx` & `hp/page.tsx`)
- **Step Sequence:**
  1. `upload` (Daily Capture via Speak Freely, Guided Q&A, Photo/File, or Form Entry)
  2. `sta` (Dedicated Safety Task Analysis photo capture)
  3. `confirm` (Review & Confirm all extracted data, reporter, hours, and attachments)
  4. `success` (Submission confirmation)
- **STA Capture UI:**
  - Header: *"Safety Task Analysis (STA) Forms"*
  - Prompt: *"Take photos of your signed daily STA safety briefing forms. These will be attached to the daily report in ProjectSight."*
  - Dedicated mobile camera shutter button ("Snap Photo") and file picker ("Upload Photo/PDF").
  - Preview tray showing thumbnails of captured STA photos with delete buttons.
  - "Continue to Review" button (primary) and "Skip for now" link (flags report as missing STA).

### 3.5 Bowling Sheet Indicator (`components/bowling/BowlingTable.tsx` & `DailyDetailModal.tsx`)
- In `BowlingTable`:
  - If a daily report was submitted without STA photos (`staCompleted === false` or `staFiles.length === 0`), the cell renders an amber warning pill: **`⚠️ STA`** next to the workers/hours.
  - Cell tooltip indicates: *"Missing STA Form · Reporter: Evan Grimm"*.
- In `DailyDetailModal`:
  - Shows an amber callout banner:
    > ⚠️ **Missing STA Safety Form**  
    > No STA forms were attached to this daily report.  
    > **Reporter:** Evan Grimm · [Contact Submitter]

### 3.6 Dashboard "Missing STA Follow-Ups" Widget (`components/dashboard/`)
- A dedicated card on the project dashboard:
  - **Title:** "Missing STA Follow-Ups"
  - Lists any submitted daily reports for the current month where STA is missing.
  - Displays: Trade Partner, Report Date, Reporter Name (`submittedBy`), and contact email/phone.
  - Provides a single-click contact action or status update.

---

## 4. Verification & Testing

1. **Unit Tests:**
   - Verify `updateCrew` computes exact total hours and total worker count.
   - Verify `mapFog617ToProjectSightBody` includes `Reporter: ...` in the body/narrative and outputs individual `DailyWorks` rows per craft.
   - Verify attachment prefixing (`Daily-Capture-*`, `STA-Form-*`) in `sendDaily`.
2. **Integration Flow:**
   - Execute an intake flow starting with Speak Freely $\rightarrow$ step into STA capture $\rightarrow$ add 2 STA photos $\rightarrow$ verify both daily and STA files are prepared and sent with correct hours and reporter attribution.
   - Test submitting without STA $\rightarrow$ verify amber badge on Bowling Sheet cell and appearance in Dashboard Missing STA widget.
