# HP Daily Report App: Grounded Punch List OCR & ProjectSight Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end punch list digitization and ProjectSight sync workflow inside the HP Daily Report app (`HP_Demo_Day/_ref/project-sight-boiler`), enabling secure site teams to photograph handwritten punch sheets, strip EXIF data client-side, extract items with grounded Gemini vision, verify side-by-side, and commit changes back to ProjectSight.

**Architecture:**
- **Dedicated Tab:** Added to `lib/projectsight/navigationData.ts` as `/projects/[projectId]/punch-list`, completely independent from the Daily Intake, Bowling Sheet, and Review Queue.
- **Multimodal Grounded OCR:** Next.js route `/api/punch/[projectId]/extract` calls Gemini 3.7 / Flash (`lib/punch-ocr.ts`), injecting project-specific context (known trade partners and existing open punch items) to accurately discern handwritten defect logs ("create") and back-punch resolution notes ("resolve").
- **Secure-Site EXIF Stripping:** Client-side HTML Canvas rasterization strips GPS/camera metadata before upload.
- **Side-by-Side Verification:** Modal/drawer UI displaying the original sheet image alongside editable extracted rows with confidence flagging.
- **Resilient ProjectSight Sync:** Directly pushes to ProjectSight REST API (`/${portfolioId}/${projectId}/punchitems`) when authenticated, with automatic local store (`hpproto-db.json`) fallback for offline/local demo mode.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui & Lucide React, Google Gemini API (`@google/generative-ai`), Vitest.

## Global Constraints

- Root directory: `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`
- Strictly targeted to the **HP Daily Report app** (`project-sight-boiler`), NEVER modifying `asa` or `ape`.
- Do not break the existing Daily Report, Bowling Sheet, or Review Queue workflows.
- All tests must pass using `npm test` (Vitest).
- Strict TypeScript (no `any`).

---

### Task 1: Punch List Types & Local Store Persistence

**Files:**
- Create: `types/punch.ts`
- Modify: `lib/store.ts`
- Test: `lib/store-punch.test.ts`

**Interfaces:**
- Produces: `PunchItem`, `ExtractedPunchItem`, `PunchExtractResponse`, `PunchCommitRequest`, `PunchCommitResult` in `types/punch.ts`.
- Produces: `getPunchItems(projectId, dbPath)`, `upsertPunchItem(projectId, item, dbPath)`, `batchCommitPunchItems(projectId, items, dbPath)` in `lib/store.ts`.

- [ ] **Step 1: Write the failing test for punch store functions**

Create `lib/store-punch.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getPunchItems, upsertPunchItem, batchCommitPunchItems } from './store';
import type { PunchItem } from '@/types/punch';

const TEST_DB = path.join(process.cwd(), 'data', 'test-punch-db.json');

describe('HPproto Punch List Local Store', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });
  afterEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('stores and retrieves punch items for a project', () => {
    const item: PunchItem = {
      id: 'punch-1',
      projectId: '1025',
      itemNumber: 'P-101',
      description: 'Missing drywall tape at corner bead',
      status: 'open',
      tradeName: 'Three Star Drywall',
      locationDescription: 'Level 2 Room 204',
      importance: 'high',
      reportedDate: '2026-09-17',
    };

    upsertPunchItem('1025', item, TEST_DB);
    const items = getPunchItems('1025', TEST_DB);
    expect(items.length).toBe(1);
    expect(items[0].description).toBe('Missing drywall tape at corner bead');
  });

  it('batches new items and resolution updates', () => {
    const item1: PunchItem = {
      id: 'p-1',
      projectId: '1025',
      itemNumber: 'P-01',
      description: 'Touch up paint',
      status: 'open',
      tradeName: 'Apex Painting',
      locationDescription: 'Corridor A',
      importance: 'normal',
    };
    upsertPunchItem('1025', item1, TEST_DB);

    const result = batchCommitPunchItems(
      '1025',
      [
        {
          action: 'resolve',
          targetItemId: 'p-1',
          notes: 'Signed off by inspector on site',
        },
        {
          action: 'create',
          item: {
            description: 'Caulk baseboards',
            tradeName: 'Apex Painting',
            locationDescription: 'Corridor B',
            importance: 'low',
            status: 'open',
          },
        },
      ],
      TEST_DB,
    );

    expect(result.createdCount).toBe(1);
    expect(result.updatedCount).toBe(1);

    const all = getPunchItems('1025', TEST_DB);
    expect(all.length).toBe(2);
    const updated = all.find((p) => p.id === 'p-1');
    expect(updated?.status).toBe('resolved');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test lib/store-punch.test.ts`
Expected: FAIL (missing exports/types)

- [ ] **Step 3: Implement `types/punch.ts` and update `lib/store.ts`**

Create `types/punch.ts`:
```typescript
export type PunchStatus = 'open' | 'resolved' | 'closed' | 'reopened';
export type PunchImportance = 'low' | 'normal' | 'high' | 'urgent';
export type PunchAction = 'create' | 'resolve' | 'reinspect';

export interface PunchItem {
  id: string;
  projectId: string;
  itemNumber?: string;
  description: string;
  status: PunchStatus;
  tradeName: string;
  locationDescription: string;
  importance: PunchImportance;
  reportedDate?: string;
  dueDate?: string;
  confidence?: number;
  sourceScanUrl?: string;
  psPunchId?: string;
  resolutionNotes?: string;
}

export interface ExtractedPunchItem {
  tempId: string;
  action: PunchAction;
  targetItemNumber?: string;
  targetItemId?: string;
  description: string;
  tradeName: string;
  locationDescription: string;
  status: PunchStatus;
  importance: PunchImportance;
  confidence: number;
  notes?: string;
}

export interface PunchExtractResponse {
  success: boolean;
  sheetType: 'new_defects' | 'back_punch' | 'mixed';
  items: ExtractedPunchItem[];
  rawText?: string;
  error?: string;
}

export interface PunchCommitActionItem {
  action: PunchAction;
  targetItemId?: string;
  targetItemNumber?: string;
  item?: Partial<PunchItem>;
  notes?: string;
}

export interface PunchCommitRequest {
  items: PunchCommitActionItem[];
}

export interface PunchCommitResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  items: PunchItem[];
  errors: string[];
}
```

Update `lib/store.ts` to add `punchItems?: PunchItem[]` in `StoreData` and export `getPunchItems`, `upsertPunchItem`, `batchCommitPunchItems`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test lib/store-punch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/punch.ts lib/store.ts lib/store-punch.test.ts
git commit -m "feat(punch): add punch list types and local store persistence"
```

---

### Task 2: ProjectSight Client Punch List CRUD Operations

**Files:**
- Modify: `lib/projectsight/client.ts`
- Test: `lib/projectsight/client-punch.test.ts`

**Interfaces:**
- Produces: `createPunchItem`, `updatePunchItem`, `normalizePunchItem` in `lib/projectsight/client.ts`.

- [ ] **Step 1: Write failing test for ProjectSight punch item operations**

Create `lib/projectsight/client-punch.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizePunchItem,
  createPunchItem,
  updatePunchItem,
} from './client';

describe('ProjectSight Punch Item API Client', () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = origFetch;
  });

  it('normalizes raw ProjectSight punch item payloads', () => {
    const raw = {
      PunchItemId: 'ps-p-1',
      ItemNumber: '0042',
      Description: 'Fix door latch',
      Status: 'Open',
      Importance: 'High',
      Location: { Description: 'Room 101' },
      AssignedToCompany: { Name: 'Apex Painting' },
      DateCreated: '2026-09-17T12:00:00Z',
    };

    const normalized = normalizePunchItem(raw, '1025');
    expect(normalized.id).toBe('ps-p-1');
    expect(normalized.itemNumber).toBe('0042');
    expect(normalized.description).toBe('Fix door latch');
    expect(normalized.status).toBe('open');
    expect(normalized.importance).toBe('high');
    expect(normalized.tradeName).toBe('Apex Painting');
    expect(normalized.locationDescription).toBe('Room 101');
  });

  it('creates punch item via POST', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ PunchItemId: 'ps-new-1', Number: '0099' }),
    });

    const res = await createPunchItem('token-123', 'port-1', 'proj-1', {
      Description: 'Touch up paint',
      Status: 'Open',
    });

    expect(res.id).toBe('ps-new-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/port-1/proj-1/punchitems'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates punch item status via PATCH/PUT', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ PunchItemId: 'ps-new-1', Status: 'Resolved' }),
    });

    const res = await updatePunchItem('token-123', 'port-1', 'proj-1', 'ps-new-1', {
      Status: 'Resolved',
    });

    expect(res.id).toBe('ps-new-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test lib/projectsight/client-punch.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `normalizePunchItem`, `createPunchItem`, and `updatePunchItem` in `lib/projectsight/client.ts`**

Add to `lib/projectsight/client.ts`:
```typescript
import type { PunchItem, PunchStatus, PunchImportance } from '@/types/punch';

export function normalizePunchItem(raw: Record<string, unknown>, projectId: string): PunchItem {
  const id = String(caseGet(raw, ['PunchItemId', 'PunchItemID', 'Id', 'id', 'KeyID']) || '');
  const itemNumber = String(caseGet(raw, ['ItemNumber', 'Number', 'ItemNo']) || '');
  const description = String(caseGet(raw, ['Description', 'Subject', 'Title', 'Notes']) || 'No description');
  const rawStatus = String(caseGet(raw, ['Status', 'State', 'WorkflowState']) || 'Open').toLowerCase();
  
  let status: PunchStatus = 'open';
  if (rawStatus.includes('resolv')) status = 'resolved';
  else if (rawStatus.includes('close')) status = 'closed';
  else if (rawStatus.includes('reopen')) status = 'reopened';

  const rawImportance = String(caseGet(raw, ['Importance', 'Priority']) || 'Normal').toLowerCase();
  let importance: PunchImportance = 'normal';
  if (rawImportance.includes('low')) importance = 'low';
  else if (rawImportance.includes('urgent')) importance = 'urgent';
  else if (rawImportance.includes('high')) importance = 'high';

  let locationDescription = '';
  const loc = raw.Location;
  if (loc && typeof loc === 'object') {
    locationDescription = String((loc as Record<string, unknown>).Description || (loc as Record<string, unknown>).Name || '');
  } else if (typeof raw.LocationDescription === 'string') {
    locationDescription = raw.LocationDescription;
  }

  let tradeName = '';
  const assigned = raw.AssignedToCompany ?? raw.Company ?? raw.AssignedTo;
  if (assigned && typeof assigned === 'object') {
    tradeName = String((assigned as Record<string, unknown>).Name || '');
  } else if (typeof assigned === 'string') {
    tradeName = assigned;
  }

  return {
    id,
    projectId,
    itemNumber: itemNumber || undefined,
    description,
    status,
    tradeName: tradeName || 'Unassigned',
    locationDescription,
    importance,
    reportedDate: typeof raw.DateCreated === 'string' ? raw.DateCreated.slice(0, 10) : undefined,
    psPunchId: id,
  };
}

export async function createPunchItem(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  body: Record<string, unknown>,
): Promise<{ id: string; payload: unknown }> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/punchitems`,
    {
      method: 'POST',
      headers: projectSightHeaders(accessToken),
      body: JSON.stringify(body),
    },
  );
  const id = String(caseGet(payload as Record<string, unknown>, ['PunchItemId', 'PunchItemID', 'Id', 'id']) || '');
  return { id, payload };
}

export async function updatePunchItem(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  punchItemId: string,
  body: Record<string, unknown>,
): Promise<{ id: string; payload: unknown }> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/punchitems/${punchItemId}`,
    {
      method: 'PUT',
      headers: projectSightHeaders(accessToken),
      body: JSON.stringify(body),
    },
  );
  const id = String(caseGet(payload as Record<string, unknown>, ['PunchItemId', 'PunchItemID', 'Id', 'id']) || punchItemId);
  return { id, payload };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test lib/projectsight/client-punch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/projectsight/client.ts lib/projectsight/client-punch.test.ts
git commit -m "feat(projectsight): add punch list CRUD methods and normalizer"
```

---

### Task 3: Grounded Multimodal Punch List OCR Extractor

**Files:**
- Create: `lib/punch-ocr.ts`
- Test: `lib/punch-ocr.test.ts`

**Interfaces:**
- Produces: `extractPunchSheetFromBuffer(buffer, mimeType, groundingContext)` in `lib/punch-ocr.ts`.

- [ ] **Step 1: Write the failing test for punch OCR extraction**

Create `lib/punch-ocr.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { buildPunchExtractionPrompt, parsePunchOcrResponse, extractPunchSheetFromBuffer } from './punch-ocr';

describe('Punch List Multimodal OCR Service', () => {
  it('builds grounded prompt with known trades and open punch items', () => {
    const prompt = buildPunchExtractionPrompt({
      knownTrades: ['Three Star Drywall', 'Apex Painting'],
      openItems: [
        { id: 'p-1', itemNumber: 'P-101', description: 'Drywall crack', tradeName: 'Three Star Drywall' },
      ],
    });

    expect(prompt).toContain('Three Star Drywall');
    expect(prompt).toContain('Apex Painting');
    expect(prompt).toContain('P-101');
    expect(prompt).toContain('Drywall crack');
    expect(prompt).toContain('"action": "create" | "resolve"');
  });

  it('parses valid JSON response with create and resolve items', () => {
    const jsonStr = JSON.stringify({
      sheetType: 'mixed',
      items: [
        {
          action: 'resolve',
          targetItemNumber: 'P-101',
          description: 'Drywall crack patched and sanded',
          tradeName: 'Three Star Drywall',
          locationDescription: 'Room 204',
          status: 'resolved',
          importance: 'high',
          confidence: 0.95,
        },
        {
          action: 'create',
          description: 'Touch up trim paint',
          tradeName: 'Apex Painting',
          locationDescription: 'Corridor B',
          status: 'open',
          importance: 'low',
          confidence: 0.88,
        },
      ],
    });

    const parsed = parsePunchOcrResponse(jsonStr);
    expect(parsed.items.length).toBe(2);
    expect(parsed.items[0].action).toBe('resolve');
    expect(parsed.items[0].targetItemNumber).toBe('P-101');
    expect(parsed.items[1].action).toBe('create');
  });

  it('handles malformed JSON with safe fallback', () => {
    const parsed = parsePunchOcrResponse('invalid json text');
    expect(parsed.items).toEqual([]);
    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test lib/punch-ocr.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/punch-ocr.ts`**

Implement `lib/punch-ocr.ts` leveraging `geminiGenerate` from `@/lib/gemini-client`:
- Formulate prompt requiring JSON with `action: 'create' | 'resolve'`, `targetItemNumber`, `description`, `tradeName`, `locationDescription`, `importance`, `confidence`.
- Match against `groundingContext.knownTrades` and `groundingContext.openItems`.
- Clean markdown fences and parse safely.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test lib/punch-ocr.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/punch-ocr.ts lib/punch-ocr.test.ts
git commit -m "feat(punch): add grounded multimodal punch list OCR extractor"
```

---

### Task 4: Punch List API Routes

**Files:**
- Create: `app/api/punch/[projectId]/items/route.ts`
- Create: `app/api/punch/[projectId]/extract/route.ts`
- Create: `app/api/punch/[projectId]/commit/route.ts`
- Test: `app/api/punch/routes.test.ts`

**Interfaces:**
- Produces: `GET /api/punch/[projectId]/items`
- Produces: `POST /api/punch/[projectId]/extract`
- Produces: `POST /api/punch/[projectId]/commit`

- [ ] **Step 1: Write integration tests for API routes**

Create `app/api/punch/routes.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET as getItems } from './[projectId]/items/route';
import { POST as commitItems } from './[projectId]/commit/route';
import fs from 'fs';
import path from 'path';

describe('Punch List API Endpoints', () => {
  it('returns items from local store when ProjectSight is not connected', async () => {
    const req = new Request('http://localhost:3000/api/punch/1025/items');
    const res = await getItems(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('commits items and saves to store', async () => {
    const req = new Request('http://localhost:3000/api/punch/1025/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            action: 'create',
            item: {
              description: 'Loose outlet cover',
              tradeName: 'Electrical Sub',
              locationDescription: 'Breakroom',
              importance: 'normal',
              status: 'open',
            },
          },
        ],
      }),
    });
    const res = await commitItems(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.createdCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test app/api/punch/routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement API routes**

1. `app/api/punch/[projectId]/items/route.ts`:
   - Checks cookies for ProjectSight TID token and destination.
   - If present, fetches live punch items from `listPunchItems()`.
   - Fallback to `getPunchItems(projectId)`.
2. `app/api/punch/[projectId]/extract/route.ts`:
   - Accepts multipart form data with file.
   - Collects grounding context (known trade partners from `getProjectById` and open punch items).
   - Calls `extractPunchSheetFromBuffer()`.
3. `app/api/punch/[projectId]/commit/route.ts`:
   - Receives confirmed items list.
   - Pushes creates/updates to ProjectSight API if authenticated, and saves to local store.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test app/api/punch/routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/punch/ app/api/punch/routes.test.ts
git commit -m "feat(api): add punch list items, extract, and commit API routes"
```

---

### Task 5: Interactive Verification Modal with EXIF Stripping

**Files:**
- Create: `components/punch/PunchScanModal.tsx`
- Test: `components/punch/PunchScanModal.test.tsx`

**Interfaces:**
- Produces: `<PunchScanModal projectId={projectId} open={open} onOpenChange={setOpen} onCommitted={refresh} />`

- [ ] **Step 1: Write test for EXIF sanitization and modal initial state**

Create `components/punch/PunchScanModal.test.tsx`:
```typescript
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PunchScanModal, sanitizeImageForSecureSite } from './PunchScanModal';

describe('PunchScanModal Component', () => {
  it('renders upload dialog with secure site notice', () => {
    render(<PunchScanModal projectId="1025" open={true} onOpenChange={() => {}} />);
    expect(screen.getByText(/Scan Punch Sheet/i)).toBeDefined();
    expect(screen.getByText(/EXIF metadata stripped/i)).toBeDefined();
  });

  it('sanitizes image via canvas to discard EXIF', async () => {
    // Canvas mock verification
    const blob = new Blob(['fake image content'], { type: 'image/jpeg' });
    const file = new File([blob], 'site_photo.jpg', { type: 'image/jpeg' });
    const sanitized = await sanitizeImageForSecureSite(file);
    expect(sanitized.name).toContain('sanitized_');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test components/punch/PunchScanModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `PunchScanModal.tsx`**

Build:
- `sanitizeImageForSecureSite(file: File): Promise<File>` using HTML Canvas rasterization (`drawImage` -> `toBlob('image/jpeg', 0.92)`).
- Drag-and-drop / file input with `capture="environment"`.
- Loading spinner while OCR runs.
- Review view: side-by-side on desktop, stacked on mobile.
  - Left: Image preview with zoom/pan.
  - Right: List of extracted defect items, with badge for Action (`New Defect` vs `Resolving Item #...`), confidence score highlight (< 75% in yellow), editable inputs (trade, location, description, importance).
- "Commit to ProjectSight" button with status summary.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test components/punch/PunchScanModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/punch/PunchScanModal.tsx components/punch/PunchScanModal.test.tsx
git commit -m "feat(punch): add PunchScanModal with EXIF sanitization and side-by-side review"
```

---

### Task 6: Dedicated Tab Navigation & Punch List Page

**Files:**
- Modify: `lib/projectsight/navigationData.ts`
- Create: `app/(home)/projects/[projectId]/punch-list/page.tsx`
- Test: `app/(home)/projects/[projectId]/punch-list/page.test.tsx`

**Interfaces:**
- Produces: Navigation item in `getNavigationItemsForProject`.
- Produces: Page `/projects/[projectId]/punch-list`.

- [ ] **Step 1: Write test for navigation item and punch list page**

Create `app/(home)/projects/[projectId]/punch-list/page.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { getNavigationItemsForProject } from '@/lib/projectsight/navigationData';

describe('Punch List Navigation & Page Integration', () => {
  it('includes Punch List in project navigation items', () => {
    const items = getNavigationItemsForProject('1025');
    const punchTab = items.find((item) => item.id === 'punch-list');
    expect(punchTab).toBeDefined();
    expect(punchTab?.path).toBe('/projects/1025/punch-list');
    expect(punchTab?.name).toBe('Punch List');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test app/(home)/projects/[projectId]/punch-list/page.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement navigation item and page component**

1. Update `lib/projectsight/navigationData.ts`:
   Add `{ id: "punch-list", name: "Punch List", icon: ListTodo, path: '/projects/${projectId}/punch-list', order: 21 }`.
2. Create `app/(home)/projects/[projectId]/punch-list/page.tsx`:
   - Page header with project switcher / title.
   - Status metrics (Total items, Open, Resolved, High Priority).
   - Filter bar: Search by description/location, filter by Trade Partner, filter by Status.
   - Data table of punch items matching ProjectSight Modus style.
   - Primary action button: `Scan Punch Sheet` which triggers `PunchScanModal`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test app/(home)/projects/[projectId]/punch-list/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/projectsight/navigationData.ts app/(home)/projects/[projectId]/punch-list/ app/(home)/projects/[projectId]/punch-list/page.test.tsx
git commit -m "feat(punch): add Punch List navigation tab and dedicated page"
```
