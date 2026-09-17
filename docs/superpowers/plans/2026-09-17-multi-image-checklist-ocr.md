# Multi-Image Checklist OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable multi-image checklist scanning with mandatory pre-association to a ProjectSight checklist, continuous multi-page multimodal OCR via Gemini, and multi-page side-by-side verification.

**Architecture:** Next.js 14 App Router + TypeScript. `extractInspectionSheet` in `lib/inspection-ocr.ts` is extended to accept multiple image buffers passed as sequential `inlineData` parts in Gemini. `/api/inspections/[projectId]/extract` receives `targetChecklistId` and multiple image files. `InspectionScanModal` enforces selecting a target checklist before capture and allows staging multiple page thumbnails before submitting. `InspectionVerifyDrawer` adds a multi-page switcher to verify items against each scanned physical page.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide icons, Vitest, Google Gemini Multimodal API.

## Global Constraints

- Pre-association is mandatory: a checklist must be selected before file selection or camera capture.
- Multi-image extraction must pass all pages in sequential order into a single Gemini prompt to maintain continuous line-item numbering.
- Backward compatibility: single-image uploads must continue to work seamlessly.
- Tests must pass via `vitest run` and `npm run build` must succeed before final deployment.

---

### Task 1: Extend `lib/inspection-ocr.ts` for Multi-Image Sequential Transcription

**Files:**
- Modify: `lib/inspection-ocr.ts`
- Modify: `lib/inspection-ocr.test.ts`

**Interfaces:**
- Consumes: `InspectionRecord`, `GeminiPart`, `geminiGenerate`
- Produces: `extractInspectionSheet(images: Array<{ buffer: Buffer; mimeType: string; filename: string }> | { buffer: Buffer; mimeType: string; filename: string }, knownChecklists?: InspectionRecord[], forceFixture?: boolean): Promise<InspectionExtractionResult>`

- [ ] **Step 1: Write the failing test for multi-image input in `lib/inspection-ocr.test.ts`**

```typescript
it('extractInspectionSheet supports multiple sequential page images', async () => {
  const images = [
    { buffer: Buffer.from('page1-fake-data'), mimeType: 'image/jpeg', filename: 'page1.jpg' },
    { buffer: Buffer.from('page2-fake-data'), mimeType: 'image/jpeg', filename: 'page2.jpg' },
  ];
  const result = await extractInspectionSheet(images, undefined, true);
  expect(result.items.length).toBeGreaterThan(0);
  expect(result.title).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run lib/inspection-ocr.test.ts`
Expected: FAIL (type or argument mismatch)

- [ ] **Step 3: Implement multi-image support in `lib/inspection-ocr.ts`**

Update `extractInspectionSheet` signature and body to handle both a single image argument or an array of image descriptors `{ buffer: Buffer; mimeType: string; filename: string }[]`. If multiple images are provided:
- Build prompt noting that the checklist spans multiple sequential pages.
- Add text prompt part first, then an `inlineData` part for each image buffer in sequence.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run lib/inspection-ocr.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/inspection-ocr.ts lib/inspection-ocr.test.ts
git commit -m "feat(ocr): support multi-page sequential images in extractInspectionSheet"
```

---

### Task 2: Update `/api/inspections/[projectId]/extract/route.ts` for Multiple Files and Target Checklist

**Files:**
- Modify: `app/api/inspections/[projectId]/extract/route.ts`
- Modify: `app/api/inspections/routes.test.ts`

**Interfaces:**
- Consumes: `extractInspectionSheet`, `getInspectionsForProject`
- Produces: `{ success: true, data: InspectionExtractionResult, previewUrls: string[] }`

- [ ] **Step 1: Write the failing test for multi-file API extraction in `app/api/inspections/routes.test.ts`**

Update test in `app/api/inspections/routes.test.ts` to POST a `FormData` containing `targetChecklistId` and two files (`files`), verifying `previewUrls` returns an array of data URIs matching both files.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run app/api/inspections/routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `app/api/inspections/[projectId]/extract/route.ts`**

- Extract `targetChecklistId = formData.get('targetChecklistId')`
- Collect files via `[...formData.getAll('files'), ...formData.getAll('file')].filter(f => f instanceof File)`
- Validate at least 1 file and no file > 20 MB
- If `targetChecklistId` is provided, filter or sort `knownChecklists` so the targeted checklist is prioritized in the prompt
- Convert all files to buffers and call `extractInspectionSheet(imageDescriptors, targetedChecklists)`
- Generate `previewUrls = files.map(f => ...)`
- Return `{ success: true, data: extraction, previewUrls, previewUrl: previewUrls[0] }`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run app/api/inspections/routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add app/api/inspections/[projectId]/extract/route.ts app/api/inspections/routes.test.ts
git commit -m "feat(api): handle multi-file extraction with targetChecklistId"
```

---

### Task 3: Update `InspectionScanModal.tsx` for Mandatory Pre-Association & Multi-Page Thumbnails

**Files:**
- Modify: `components/inspections/InspectionScanModal.tsx`
- Test: `components/inspections/InspectionComponents.test.tsx`

**Interfaces:**
- Props:
  ```typescript
  interface InspectionScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    inspections: InspectionRecord[];
    initialChecklistId?: string;
    onScanComplete: (result: InspectionExtractionResult, previewUrls: string[], targetChecklistId: string) => void;
  }
  ```

- [ ] **Step 1: Write test for pre-association and multi-page staging in `components/inspections/InspectionComponents.test.tsx`**

Verify that:
- When `initialChecklistId` is not provided, file upload inputs are disabled until a checklist is selected in the dropdown.
- Selecting files displays "Page 1", "Page 2" badges.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run components/inspections/InspectionComponents.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement multi-page staging and required checklist selection in `InspectionScanModal.tsx`**

- State: `selectedChecklistId`, initialized from `initialChecklistId || ''`.
- State: `stagedFiles: File[]`.
- Display a Target Checklist `<select>` dropdown with option list from `inspections`.
- Disable file input and camera buttons until `selectedChecklistId` is chosen.
- File inputs accept multiple files (`multiple`). When selected, append to `stagedFiles`.
- Show thumbnails of all staged pages with "Page 1", "Page 2", ... badges, delete buttons, and count.
- Add primary button: `Transcribe {stagedFiles.length} Pages` which posts to `/api/inspections/${projectId}/extract` with all files and `targetChecklistId`.
- On success, invokes `onScanComplete(json.data, json.previewUrls || [json.previewUrl], selectedChecklistId)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npx vitest run components/inspections/InspectionComponents.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add components/inspections/InspectionScanModal.tsx components/inspections/InspectionComponents.test.tsx
git commit -m "feat(ui): add mandatory checklist selection and multi-page upload to scan modal"
```

---

### Task 4: Update `InspectionVerifyDrawer.tsx` for Multi-Page Navigation and Locked Association

**Files:**
- Modify: `components/inspections/InspectionVerifyDrawer.tsx`
- Modify: `components/inspections/InspectionGrid.tsx`
- Modify: `app/(home)/projects/[projectId]/inspections/page.tsx`

**Interfaces:**
- `InspectionVerifyDrawerProps` accepts `previewUrls: string[]` and `targetChecklistId?: string`.
- `InspectionGrid` adds a "Scan Sheet(s)" button on each checklist card to directly launch scan for that record.

- [ ] **Step 1: Update `InspectionVerifyDrawer.tsx` to handle `previewUrls: string[]`**

- Add state `activePageIndex: number` (default 0).
- Render page switcher tabs when `previewUrls.length > 1`: `Page 1`, `Page 2`, `Page 3`.
- Display image for `previewUrls[activePageIndex]`.
- Lock the target checklist selector to `targetChecklistId`.
- In `handleCommit`, attach all sheet images or include primary sheet.

- [ ] **Step 2: Update `InspectionGrid.tsx` and `page.tsx`**

- In `InspectionGrid.tsx`, add a "Scan" button on each checklist card passing that checklist's ID to open the scan modal directly.
- In `page.tsx`, wire `selectedTargetChecklistId`, passing it from grid click or modal selection into `InspectionVerifyDrawer`.

- [ ] **Step 3: Run full vitest test suite**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npm run test`
Expected: PASS (all tests green)

- [ ] **Step 4: Run production build check**

Run: `cd /Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler && npm run build`
Expected: PASS (build succeeds with 0 errors)

- [ ] **Step 5: Commit changes**

```bash
git add components/inspections/InspectionVerifyDrawer.tsx components/inspections/InspectionGrid.tsx app/(home)/projects/[projectId]/inspections/page.tsx
git commit -m "feat(ui): multi-page preview switcher in verify drawer and direct card scan trigger"
```

---

### Task 5: Production Deployment Verification

**Files:**
- Run: `deploy/sync-boiler.sh`

- [ ] **Step 1: Execute `sync-boiler.sh`**

Deploy the updated Next.js app to GCP production VM (`34.10.16.167`).

- [ ] **Step 2: Verify live deployment health**

Query `https://hp-trimble-lab.com/projects/1025/checklists` and verify `HTTP 200`.
