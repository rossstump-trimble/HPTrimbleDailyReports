# HP Daily Report App — ProjectSight Inspections Checklist OCR & Field Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt the ProjectSight inspection checklist OCR and field sync feature from the scheduling app into the HP Trimble Daily Report app (`https://hp-trimble-lab.com`), including paper sheet camera capture/upload, grounded Gemini 3.7 Vision extraction, side-by-side verification drawer, ProjectSight push, and daily report cross-sync.

**Architecture:** Next.js 14 App Router + TypeScript application. Stores inspection records in `data/hpproto-db.json` via `lib/store.ts`. Extends `lib/projectsight/client.ts` to query and update ProjectSight Checklist assignments (TableType 189). Uses `lib/inspection-ocr.ts` powered by `lib/gemini-client.ts` (supporting Vertex AI ADC on GCP or `GEMINI_API_KEY`) for multimodal vision extraction grounded in project checklists. Exposes API routes under `/api/projects/[projectId]/inspections/` and UI components under `components/inspections/` integrated into project navigation and `/intake/[projectId]`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI, Lucide React, Vitest, Google Gemini 3.7 Vision API, ProjectSight US1 REST APIs.

## Global Constraints

- Never use `any` type in TypeScript — use explicit interfaces.
- Mobile touch targets must have minimum 44px hit areas (`min-h-[44px]`).
- All file inputs must separate camera capture (`capture="environment"`) from file picker.
- Tests must be deterministic and never call live external APIs without fixtures or mocks.
- Cleanly revert only inspection commits in `agentic-scheduling-app` and `agentic-planning-engine` without touching punch-list work.

---

### Task 1: Revert Inspection Commits in Scheduling App & Planning Engine

**Files:**
- Modify: `/Users/rstump/agentic-scheduling-app` (git revert inspection commits)
- Modify: `/Users/rstump/agentic-planning-engine` (git revert inspection commits)

**Interfaces:**
- Consumes: Existing git commits in `agentic-scheduling-app` and `agentic-planning-engine`
- Produces: Clean git status on `agentic-scheduling-app` and `agentic-planning-engine` preserving all other features (like punch list)

- [ ] **Step 1: Check git log on agentic-scheduling-app to identify inspection commits**

Run in `/Users/rstump/agentic-scheduling-app`:
```bash
git log --oneline -n 10
```
Expected commits to revert:
- `66d32845 fix(inspections): update help copy and image format labels in scan modal`
- `7f4a43b3 fix(inspections): touch targets, separate camera input, and beta feedback SHA`
- `cee472a2 fix(inspections): touch targets, separate camera input, and beta feedback SHA`
- `38cd43ae feat(inspections): implement scan modal, side-by-side verification drawer, and Inspections tab`
- `3075d3bd feat(inspections): implement InspectionGrid, status badge, and detail drawer`
- `f0cd2688 feat(navigation): add inspections tab and routes to project shell`
- `0d81b45a feat(inspections): add inspection API functions, interfaces, and TanStack hooks`

- [ ] **Step 2: Revert inspection commits in agentic-scheduling-app**

Run in `/Users/rstump/agentic-scheduling-app`:
```bash
git revert --no-edit 0d81b45a..66d32845
```
Or cherry-pick/revert the exact range, and verify `npm run build` and `npm run test` pass.

- [ ] **Step 3: Check git log on agentic-planning-engine to identify inspection commits**

Run in `/Users/rstump/agentic-planning-engine`:
```bash
git log --oneline -n 12
```
Expected commits to revert:
- `73ae633 fix(inspections): move logger initialization below module imports (PEP 8 E402)`
- `52d6626 fix(inspections): secure header auth for vision API and report ps_synced status`
- `97340d7 feat(api): add inspections list, sync, OCR extract, and commit routes`
- `ee940df fix(inspections): ensure deterministic fixture test and clean unused imports`
- `afe1346 feat(inspections): implement two-stage inspection sheet OCR and vision service`
*(Note: Do not touch punch-list commits: `33def54`, `7078f38`, `f148c29`, `f6f4932`, `ee01062`, `671b780`)*

- [ ] **Step 4: Revert inspection commits in agentic-planning-engine**

Run in `/Users/rstump/agentic-planning-engine`:
```bash
git revert --no-edit 73ae633 52d6626 97340d7 ee940df afe1346
```
Run `pytest` to verify all remaining tests pass.

- [ ] **Step 5: Verify builds and tests in both scheduling repositories**

Run:
```bash
cd /Users/rstump/agentic-scheduling-app/frontend && npm run build
cd /Users/rstump/agentic-planning-engine && pytest
```
Expected: All build checks and pytest tests pass cleanly.

---

### Task 2: Data Models & Storage in HP Daily Report App

**Files:**
- Modify: `types/hpproto.ts`
- Modify: `lib/store.ts`
- Test: `lib/store.test.ts`

**Interfaces:**
- Consumes: Existing `StoreData`, `Project` interfaces
- Produces: `InspectionRecord`, `InspectionChecklistItem`, `ExtractedInspectionItem`, `InspectionExtractionResult`, `getInspectionsForProject`, `saveInspectionRecord`, `updateInspectionRecord`

- [ ] **Step 1: Write failing unit test in `lib/store.test.ts`**

Add tests to `lib/store.test.ts`:
```typescript
import {
  getInspectionsForProject,
  saveInspectionRecord,
  updateInspectionRecord,
} from './store';
import type { InspectionRecord } from '@/types/hpproto';

describe('inspection store methods', () => {
  it('saves and retrieves inspection records for a project', () => {
    const record: InspectionRecord = {
      id: 'insp-1',
      projectId: '1025',
      psRecordId: 'ps-rec-1',
      number: 'CK-0042',
      title: 'Pre-Pour Concrete Inspection',
      status: 'open',
      items: [
        {
          id: 'item-1',
          itemNumber: 1,
          prompt: 'Rebar placement verified',
          result: 'Pass',
        },
      ],
      source: 'upload',
      createdAt: '2026-09-17T12:00:00.000Z',
      updatedAt: '2026-09-17T12:00:00.000Z',
    };

    saveInspectionRecord(record);
    const list = getInspectionsForProject('1025');
    expect(list.some((r) => r.id === 'insp-1')).toBe(true);

    const updated = updateInspectionRecord('insp-1', { status: 'approved' });
    expect(updated?.status).toBe('approved');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test lib/store.test.ts`
Expected: FAIL due to missing types and functions.

- [ ] **Step 3: Update `types/hpproto.ts` and `lib/store.ts`**

In `types/hpproto.ts`, add:
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
Update `StoreData` in `types/hpproto.ts`:
```typescript
export interface StoreData {
  projects: Project[];
  dailyReports: DailyReport[];
  inspections?: InspectionRecord[];
}
```

In `lib/store.ts`, implement:
- `getInspectionsForProject(projectId: string, filePath?: string): InspectionRecord[]`
- `getInspectionById(inspectionId: string, filePath?: string): InspectionRecord | null`
- `saveInspectionRecord(record: InspectionRecord, filePath?: string): InspectionRecord`
- `updateInspectionRecord(inspectionId: string, updates: Partial<InspectionRecord>, filePath?: string): InspectionRecord | null`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test lib/store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add types/hpproto.ts lib/store.ts lib/store.test.ts
git commit -m "feat(inspections): add inspection models and store operations"
```

---

### Task 3: ProjectSight Client Extension for Checklists

**Files:**
- Modify: `lib/projectsight/client.ts`
- Test: `lib/projectsight/client-checklists.test.ts`

**Interfaces:**
- Consumes: `projectSightHeaders`, `projectSightBaseUrl`, `psFetch` from `lib/projectsight/client.ts`
- Produces: `listChecklists`, `getChecklist`, `updateChecklistItems`, `uploadChecklistAttachment`

- [ ] **Step 1: Write failing unit test in `lib/projectsight/client-checklists.test.ts`**

Create `lib/projectsight/client-checklists.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listChecklists,
  getChecklist,
  updateChecklistItems,
  uploadChecklistAttachment,
} from './client';

describe('ProjectSight checklist client methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listChecklists parses ProjectSight checklist records', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          Items: [
            {
              ChecklistId: 'ck-1',
              ChecklistNumber: 'CK-0042',
              Title: 'Pre-Pour Concrete Inspection',
              WorkflowState: 'Open',
              Location: 'Building A, Floor 2',
            },
          ],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const checklists = await listChecklists('fake-token', 'port-1', 'proj-1');
    expect(checklists.length).toBe(1);
    expect(checklists[0].number).toBe('CK-0042');
    expect(checklists[0].title).toBe('Pre-Pour Concrete Inspection');
  });

  it('updateChecklistItems formats payload correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ Success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await updateChecklistItems(
      'fake-token',
      'port-1',
      'proj-1',
      'ck-1',
      [{ id: 'item-1', itemNumber: 1, prompt: 'Rebar', result: 'Pass', comment: 'Looks good' }],
      'Approved',
    );
    expect(res).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test lib/projectsight/client-checklists.test.ts`
Expected: FAIL due to missing functions.

- [ ] **Step 3: Implement checklist methods in `lib/projectsight/client.ts`**

Add exported functions to `lib/projectsight/client.ts`:
```typescript
export interface ProjectSightChecklistRef {
  id: string;
  number: string;
  title: string;
  workflowState: string;
  location?: string;
  items?: {
    id: string;
    itemNumber: number;
    prompt: string;
    result?: string;
    comment?: string;
  }[];
}

export async function listChecklists(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<ProjectSightChecklistRef[]> {
  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists/list`;
  const payload = await psFetch(url, {
    method: 'POST',
    headers: projectSightHeaders(accessToken),
    body: JSON.stringify({}),
  });
  return items(payload).map((item) => ({
    id: String(caseGet(item, ['ChecklistId', 'ChecklistGuid', 'Id', 'id']) || ''),
    number: String(caseGet(item, ['ChecklistNumber', 'Number', 'number']) || ''),
    title: String(caseGet(item, ['Title', 'Name', 'title']) || 'Untitled Checklist'),
    workflowState: String(caseGet(item, ['WorkflowState', 'Status', 'status']) || 'Open'),
    location: (caseGet(item, ['Location', 'location']) as string) || undefined,
  })).filter((ck) => ck.id);
}

export async function getChecklist(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  checklistId: string,
): Promise<Record<string, unknown>> {
  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists/${checklistId}`;
  const payload = await psFetch(url, {
    method: 'GET',
    headers: projectSightHeaders(accessToken),
  });
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}

export async function updateChecklistItems(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  checklistId: string,
  itemsList: { id?: string; itemNumber: number; prompt?: string; result: string; comment?: string }[],
  workflowState?: string,
): Promise<Record<string, unknown>> {
  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists/${checklistId}`;
  const body: Record<string, unknown> = {
    ChecklistItems: itemsList.map((it) => ({
      ChecklistItemId: it.id,
      ItemNumber: it.itemNumber,
      Response: it.result,
      Comments: it.comment || '',
    })),
  };
  if (workflowState) {
    body.WorkflowState = workflowState;
  }
  const payload = await psFetch(url, {
    method: 'PUT',
    headers: projectSightHeaders(accessToken),
    body: JSON.stringify(body),
  });
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}

export async function uploadChecklistAttachment(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  checklistId: string,
  filename: string,
  buffer: Buffer,
  contentType: string = 'image/jpeg',
): Promise<Record<string, unknown>> {
  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists/${checklistId}/attachments`;
  const boundary = `----PSFormBoundary${Date.now()}`;
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const payloadBuffer = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    buffer,
    Buffer.from(footer, 'utf-8'),
  ]);

  const headers = {
    ...projectSightHeaders(accessToken),
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  };

  const payload = await psFetch(url, {
    method: 'POST',
    headers,
    body: payloadBuffer,
  });
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test lib/projectsight/client-checklists.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/projectsight/client.ts lib/projectsight/client-checklists.test.ts
git commit -m "feat(projectsight): add checklist query, update, and attachment upload methods"
```

---

### Task 4: Grounded Multimodal Vision Service for Inspection Sheets

**Files:**
- Create: `lib/inspection-ocr.ts`
- Test: `lib/inspection-ocr.test.ts`

**Interfaces:**
- Consumes: `geminiGenerate` from `lib/gemini-client.ts`, `InspectionRecord`, `InspectionExtractionResult`
- Produces: `extractInspectionSheet(imageBuffer: Buffer, mimeType: string, filename: string, knownChecklists?: InspectionRecord[])`

- [ ] **Step 1: Write failing unit test in `lib/inspection-ocr.test.ts`**

Create `lib/inspection-ocr.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractInspectionSheet } from './inspection-ocr';
import type { InspectionRecord } from '@/types/hpproto';

describe('extractInspectionSheet', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns fixture extraction when in fixture or fallback mode', async () => {
    const known: InspectionRecord[] = [
      {
        id: 'fix-1',
        projectId: '1025',
        psRecordId: 'ps-fix-1',
        number: 'CK-0042',
        title: 'Pre-Pour Concrete Inspection',
        status: 'open',
        items: [
          { id: 'it-1', itemNumber: 1, prompt: 'Rebar placement verified', result: 'Unchecked' },
          { id: 'it-2', itemNumber: 2, prompt: 'Forms clean of debris', result: 'Unchecked' },
        ],
        source: 'upload',
        createdAt: '2026-09-17T00:00:00.000Z',
        updatedAt: '2026-09-17T00:00:00.000Z',
      },
    ];

    const dummyBuf = Buffer.from('test-image-bytes');
    const result = await extractInspectionSheet(dummyBuf, 'image/jpeg', 'sheet.jpg', known, true);

    expect(result.checklistNumber).toBe('CK-0042');
    expect(result.items.length).toBe(2);
    expect(result.items[0].result).toBe('Pass');
    expect(result.overallConfidence).toBeGreaterThan(0.8);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test lib/inspection-ocr.test.ts`
Expected: FAIL due to missing module `lib/inspection-ocr.ts`.

- [ ] **Step 3: Implement `lib/inspection-ocr.ts`**

Create `lib/inspection-ocr.ts`:
- Include `formatGroundingContext` to format checklist definitions.
- Implement Gemini Vision calling using `geminiGenerate` with inline base64 image data.
- Add structured JSON output parsing for `InspectionExtractionResult`.
- Provide robust fallback / fixture mode if Gemini call returns empty or error.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test lib/inspection-ocr.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/inspection-ocr.ts lib/inspection-ocr.test.ts
git commit -m "feat(inspections): implement grounded multimodal inspection sheet extractor"
```

---

### Task 5: Next.js API Routes for Inspections

**Files:**
- Create: `app/api/projects/[projectId]/inspections/route.ts`
- Create: `app/api/projects/[projectId]/inspections/extract/route.ts`
- Create: `app/api/projects/[projectId]/inspections/[inspectionId]/commit/route.ts`
- Test: `app/api/projects/[projectId]/inspections/inspections-routes.test.ts`

**Interfaces:**
- Consumes: `lib/store.ts`, `lib/projectsight/client.ts`, `lib/inspection-ocr.ts`
- Produces:
  - `GET /api/projects/[projectId]/inspections`: list inspection records
  - `POST /api/projects/[projectId]/inspections`: force sync from ProjectSight
  - `POST /api/projects/[projectId]/inspections/extract`: OCR extraction from uploaded image
  - `POST /api/projects/[projectId]/inspections/[inspectionId]/commit`: update record, push to ProjectSight, cross-sync to daily report

- [ ] **Step 1: Write integration test for the inspection routes**

Create `app/api/projects/[projectId]/inspections/inspections-routes.test.ts` testing route handlers and daily report cross-sync.

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test app/api/projects/[projectId]/inspections/inspections-routes.test.ts`
Expected: FAIL due to missing routes.

- [ ] **Step 3: Implement route handlers**

1. `app/api/projects/[projectId]/inspections/route.ts`:
   - `GET`: Returns `getInspectionsForProject(projectId)`. If empty, queries ProjectSight via `listChecklists` if token available, seed defaults if offline.
   - `POST`: Forces re-sync from ProjectSight.
2. `app/api/projects/[projectId]/inspections/extract/route.ts`:
   - Accepts `multipart/form-data`.
   - Calls `extractInspectionSheet`.
   - Returns extracted result with temporary base64/data URI for verification preview.
3. `app/api/projects/[projectId]/inspections/[inspectionId]/commit/route.ts`:
   - Updates inspection in store.
   - If ProjectSight token available, calls `updateChecklistItems` and `uploadChecklistAttachment`.
   - Cross-syncs an entry into the daily report or bowling notes for today's date.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test app/api/projects/[projectId]/inspections/inspections-routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add app/api/projects/\[projectId\]/inspections/
git commit -m "feat(api): add inspections list, extract, and commit API routes"
```

---

### Task 6: Inspection UI Components (Register, Scan Modal, Verification Drawer)

**Files:**
- Create: `components/inspections/InspectionStatusBadge.tsx`
- Create: `components/inspections/InspectionGrid.tsx`
- Create: `components/inspections/InspectionDetailSheet.tsx`
- Create: `components/inspections/InspectionScanModal.tsx`
- Create: `components/inspections/InspectionVerifyDrawer.tsx`
- Test: `components/inspections/InspectionComponents.test.tsx`

**Interfaces:**
- Consumes: `InspectionRecord`, `InspectionChecklistItem`, `InspectionExtractionResult`
- Produces: UI components matching Trimble Modus style with 44px mobile touch targets and side-by-side verification

- [ ] **Step 1: Write component unit tests**

Create `components/inspections/InspectionComponents.test.tsx` verifying:
- `InspectionStatusBadge` renders colors according to status (`open`, `in_review`, `approved`, `closed`).
- `InspectionGrid` renders records and handles click events.
- `InspectionVerifyDrawer` renders extracted items, allows toggling `Pass`/`Fail`/`N/A`, and triggers commit callback.

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test components/inspections/InspectionComponents.test.tsx`
Expected: FAIL due to missing components.

- [ ] **Step 3: Implement components**

1. `InspectionStatusBadge.tsx`: Modus-styled badge.
2. `InspectionGrid.tsx`: Clean tabular view with Record #, Title, Items Progress, Status, Date.
3. `InspectionDetailSheet.tsx`: Side drawer showing full checklist line items and current results.
4. `InspectionScanModal.tsx`: File upload dropzone + distinct Camera capture button (`capture="environment"`), min-h-[44px] touch targets.
5. `InspectionVerifyDrawer.tsx`: Split side-by-side view (scanned physical image on left/top, interactive form on right with Pass/Fail/N/A toggle pills, comment inputs, needsReview highlight, and Confirm & Push button).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test components/inspections/InspectionComponents.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add components/inspections/
git commit -m "feat(ui): implement inspection register, scan modal, and verification drawer"
```

---

### Task 7: Navigation & Pages Integration (Inspections Page & Daily Intake Link)

**Files:**
- Modify: `lib/projectsight/navigationData.ts`
- Create: `app/(home)/projects/[projectId]/inspections/page.tsx`
- Modify: `app/intake/[projectId]/page.tsx`
- Test: `lib/projectsight/navigationData.test.ts`

**Interfaces:**
- Consumes: `components/inspections/*`, `getNavigationItemsForProject`
- Produces:
  - Navigation item for "Inspections" at `/projects/[projectId]/inspections`
  - Complete Inspections page under the Home layout
  - Quick-scan banner/modal launcher inside `/intake/[projectId]`

- [ ] **Step 1: Update navigation unit test in `lib/projectsight/navigationData.test.ts`**

Add check that `getNavigationItemsForProject` includes `inspections` with path `/projects/${projectId}/inspections`.

- [ ] **Step 2: Run navigation test to verify failure**

Run: `npm run test lib/projectsight/navigationData.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement navigation and page**

1. In `lib/projectsight/navigationData.ts`, add:
```typescript
{
  id: "inspections",
  name: "Inspections",
  icon: ClipboardCheck,
  path: `/projects/${projectId}/inspections`,
  order: 24,
}
```
2. Create `app/(home)/projects/[projectId]/inspections/page.tsx`:
   - Fetches `/api/projects/[projectId]/inspections`.
   - Mounts `InspectionGrid`, detail sheet, scan modal, and verify drawer.
   - Provides "Sync ProjectSight" and "Scan Inspection Sheet" header buttons.
3. In `app/intake/[projectId]/page.tsx`:
   - Add an "Inspection Checklist Quick Scan" button or card in the capture header so foremen doing daily intake can open the scan modal directly without leaving the intake flow.

- [ ] **Step 4: Run navigation test to verify it passes**

Run: `npm run test lib/projectsight/navigationData.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/projectsight/navigationData.ts app/\(home\)/projects/\[projectId\]/inspections/ app/intake/\[projectId\]/
git commit -m "feat(navigation): add Inspections tab to project menu and quick-scan to daily intake"
```

---

### Task 8: Production Build & Remote Deployment to GCP VM

**Files:**
- Test/Build: Local build via `npm run build`
- Deploy: `deploy/sync-boiler.sh`

**Interfaces:**
- Consumes: Verified local code in `CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`
- Produces: Live deployment at `https://hp-trimble-lab.com` on GCP VM `hp-demo-day`

- [ ] **Step 1: Run full test suite in HP Daily Report app**

Run in `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`:
```bash
npm run test
```
Expected: All tests pass.

- [ ] **Step 2: Run production Next.js build check**

Run in `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`:
```bash
npm run build
```
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Execute deployment script to GCP VM**

Run in `/Users/rstump/CompliantScheduling/HP_Demo_Day/deploy`:
```bash
./sync-boiler.sh
```
Expected: rsync completes, remote npm install & build execute, `project-sight-boiler.service` restarts cleanly.

- [ ] **Step 4: Verify live application**

Check `https://hp-trimble-lab.com/projects/1025/inspections` and `https://hp-trimble-lab.com/intake/1025` to confirm live operation.

- [ ] **Step 5: Final git commit and status check**

Verify git clean state and log in `CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`.
