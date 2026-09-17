# HP Daily Report App — ProjectSight Inspections Checklist OCR & Field Sync Design

**Date**: 2026-09-17  
**Repository**: `HPTrimbleDailyReports` (`CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`)  
**Deployment Target**: `https://hp-trimble-lab.com` (GCP VM `hp-demo-day`, `34.10.16.167`)  

---

## 1. Overview & Context

Field personnel on job sites fill out printed paper inspection sheets and checklists by hand. Manually transcribing these completed inspection records back into ProjectSight and daily reports creates delay, duplicate work, and data entry errors.

This feature adapts the inspection checklist digitization solution into the **HP Trimble Daily Reports application**:
1. **Camera / Scan Upload**: Foremen capture a photo or upload a scan of a completed physical checklist form directly from mobile or desktop.
2. **Grounded Multimodal OCR**: Gemini 3.7 Vision matches the physical sheet against active ProjectSight checklists for the project, transcribing checkboxes (`Pass`, `Fail`, `N/A`) and handwritten field notes.
3. **Side-by-Side Verification**: A split verification drawer allows site staff to compare the digital extracted items directly against the scanned paper image, adjust any values, and resolve flagged items.
4. **ProjectSight Push & Daily Report Sync**: Confirmed checklist items push directly to ProjectSight REST APIs, attach the scanned image, and append a record to the project's daily report in the bowling matrix.
5. **Entry Points**: A dedicated "Inspections" tab in the main project navigation plus a quick-scan action directly within the Daily Intake flow.

---

## 2. Architecture & Data Flow

```
[Field Paper Sheet]
        │
   (Photo / Scan)
        │
        ▼
[Next.js App / Client]
        │
        ├── 1. POST /api/projects/[projectId]/inspections/extract (Multipart)
        │           │
        │           ▼
        │    [Grounded Vision Extractor] (lib/inspection-ocr.ts)
        │           ├── Gemini 3.7 Vision via Vertex ADC / API Key
        │           └── Grounded by known checklists
        │
        ├── 2. Verification Drawer UI (Side-by-Side Review)
        │           │
        │           ▼
        └── 3. POST /api/projects/[projectId]/inspections/[id]/commit
                    │
                    ├── Updates data/hpproto-db.json (lib/store.ts)
                    ├── Pushes to ProjectSight API (lib/projectsight/client.ts)
                    └── Appends Inspection Summary to Daily Report
```

---

## 3. Data Models (`types/hpproto.ts`)

```typescript
export type InspectionItemResult = "Pass" | "Fail" | "N/A" | "Unchecked";

export interface InspectionChecklistItem {
  id: string;
  itemNumber: number;
  prompt: string;
  result: InspectionItemResult;
  comment?: string;
  confidence?: number;
  needsReview?: boolean;
}

export interface InspectionRecord {
  id: string;
  projectId: string;
  psRecordId?: string;
  number: string;
  title: string;
  location?: string;
  inspectorName?: string;
  date?: string;
  status: "open" | "in_review" | "approved" | "closed";
  items: InspectionChecklistItem[];
  sheetImageUrl?: string;
  source: "projectsight" | "upload";
  psSynced?: boolean;
  psSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedInspectionItem {
  itemNumber: number;
  prompt: string;
  result: InspectionItemResult;
  comment?: string;
  confidence: number;
  needsReview: boolean;
}

export interface InspectionExtractionResult {
  checklistNumber?: string;
  checklistGuid?: string;
  title?: string;
  inspectorName?: string;
  date?: string;
  items: ExtractedInspectionItem[];
  overallConfidence: number;
  rawVisionNotes?: string;
}
```

---

## 4. Backend Components

### 4.1. ProjectSight Client Extension (`lib/projectsight/client.ts`)
Add methods supporting ProjectSight Checklists (Assignment TableType 189):
* `listChecklists(accessToken, portfolioId, projectId)`: Fetches active project checklists.
* `getChecklist(accessToken, portfolioId, projectId, checklistId)`: Retrieves full checklist details and item definitions.
* `updateChecklistItems(accessToken, portfolioId, projectId, checklistId, items, workflowState?)`: Updates item states and notes on ProjectSight.
* `uploadChecklistAttachment(accessToken, portfolioId, projectId, checklistId, filename, buffer, mimeType)`: Uploads physical sheet scan as an official attachment.

### 4.2. Grounded Vision Service (`lib/inspection-ocr.ts`)
* Uses `geminiGenerate` from `lib/gemini-client.ts`, leveraging Vertex AI ADC on GCP or `GEMINI_API_KEY` in development.
* Injects active project checklists as grounding context so checkboxes map accurately to specific line items.
* Detects ambiguous marks or low-confidence text and flags items with `needsReview: true`.
* Deterministic fixture mode for tests and offline demo environments (`CK-0042 Pre-Pour Concrete Inspection`).

### 4.3. API Routes
* `GET /api/projects/[projectId]/inspections`: Returns stored inspection records; syncs from ProjectSight if empty and authenticated.
* `POST /api/projects/[projectId]/inspections`: Explicitly triggers sync from ProjectSight.
* `POST /api/projects/[projectId]/inspections/extract`: Receives image upload, executes vision extraction, returns structured items with confidence.
* `POST /api/projects/[projectId]/inspections/[inspectionId]/commit`: Saves verified checklist, updates ProjectSight, uploads attachment, and cross-syncs summary note to the daily report.

---

## 5. Frontend UI & Integration

### 5.1. Navigation (`lib/projectsight/navigationData.ts`)
* Register "Inspections" item (`/projects/${projectId}/inspections`) with `ClipboardCheck` icon.

### 5.2. Inspections Page (`app/(home)/projects/[projectId]/inspections/page.tsx`)
* Header actions: "Sync ProjectSight" and "Scan Inspection Sheet".
* Inspection Register table: displays Record Number, Title, Location, Items Completion (e.g. "6/6 Passed"), Status Badge, and Date.
* Row click opens detail sheet.

### 5.3. Scanning & Side-by-Side Verification
* `components/inspections/InspectionScanModal.tsx`:
  - Camera capture (`capture="environment"`) and photo/PDF upload.
  - Sized for mobile touch targets (minimum 44px).
* `components/inspections/InspectionVerifyDrawer.tsx`:
  - Split view: zoomable image preview of scanned sheet on the left/top, interactive digital form on the right.
  - Buttons for `Pass`, `Fail`, and `N/A` for every item.
  - Highlights `needsReview` items with clear warning indicators.
  - "Confirm & Push to ProjectSight" action.

### 5.4. Daily Intake Integration (`app/intake/[projectId]/page.tsx`)
* Banner / quick-action card in the intake header allowing field workers to jump directly to scanning an inspection sheet.

---

## 6. Deployment & Cleanup Protocol

1. **Scheduling App & Planning Engine Cleanup**:
   - Revert the inspection-specific commits from `agentic-scheduling-app` and `agentic-planning-engine` without touching punch-list or other unrelated work.
2. **Local Validation in HP Daily Report App**:
   - Run unit tests: `npm run test`
   - Run production build: `npm run build`
3. **Remote Deployment**:
   - Run `./sync-boiler.sh` from `/Users/rstump/CompliantScheduling/HP_Demo_Day/deploy` to sync files to GCP VM `hp-demo-day` and restart `project-sight-boiler.service`.
   - Verify live endpoints and UI at `https://hp-trimble-lab.com`.
