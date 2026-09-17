# Multi-Image Checklist OCR with Mandatory Pre-Association Design Spec

**Date:** 2026-09-17  
**Status:** Approved  
**Location:** `HP_Demo_Day/_ref/project-sight-boiler`

---

## 1. Executive Summary & User Problem

Inspectors in the field often fill out paper inspection checklists that span 2 or 3 physical pages (e.g., Pre-Placement Concrete Inspection sheets with 100+ items). Currently, the system only allows uploading a single image file at a time, and the upload modal does not enforce selecting which ProjectSight checklist record the scan belongs to prior to uploading or capturing.

This enhancement introduces:
1. **Mandatory Pre-Association**: Users must either click "Scan Sheet(s)" directly on an existing checklist card or select a target checklist from a dropdown before capturing/uploading photos.
2. **Multi-Page Upload**: Users can select or capture multiple page images (e.g. Page 1, Page 2, Page 3), review thumbnails, reorder or remove pages, and submit all pages together.
3. **Continuous Multi-Page Multimodal OCR**: The backend passes all page image buffers as sequential `inlineData` parts to Gemini in a single prompt grounded in the target checklist's known items, transcribing items sequentially across all pages.
4. **Multi-Page Verification Drawer**: The left preview pane supports switching between uploaded pages (Page 1, Page 2, etc.) while editing and verifying checklist results on the right, committing back to ProjectSight seamlessly.

---

## 2. Requirements & Global Constraints

1. **Pre-Association Requirement**:
   - The user must associate the upload with an existing ProjectSight checklist before file selection/capture.
   - If opened from the header "Scan Checklist" button, the target checklist dropdown is required before the camera/upload buttons are enabled.
   - If opened from a checklist card ("Scan Sheet(s)"), the target checklist is pre-selected and locked.
2. **Multi-Image Support**:
   - File input allows selecting multiple files (`accept="image/*" multiple`).
   - Camera input allows snapping and appending photos one by one or in batch.
   - Thumbnails with page badges ("Page 1", "Page 2", ...) and remove buttons (`X`) are displayed before submitting.
3. **Backend Multi-Image Handling**:
   - Endpoint: `POST /api/inspections/[projectId]/extract`
   - Accepts `targetChecklistId` (string) and `files` (array of `File` objects) or multiple `file` form fields.
   - Returns `{ success: true, data: InspectionExtractionResult, previewUrls: string[] }`.
4. **Multimodal OCR Prompt & Model**:
   - `extractInspectionSheet` in `lib/inspection-ocr.ts` accepts `images: Array<{ buffer: Buffer; mimeType: string; filename: string }>` alongside target checklist items.
   - All images are attached as sequential parts in a single `geminiGenerate` call.
   - Preserves sequential `itemNumber` across pages.
5. **Verification & Commit**:
   - `InspectionVerifyDrawer` accepts `previewUrls: string[]` and displays page switcher buttons (`Page 1`, `Page 2`, ...).
   - Commit sends `sheetImageBase64` or multiple sheets, attaching them to the ProjectSight checklist.

---

## 3. Data Contracts & Interfaces

### 3.1. API Contract: `POST /api/inspections/[projectId]/extract`

**Request:** `multipart/form-data`
- `targetChecklistId`: string (required)
- `files`: File[] (1 to 10 image files)

**Response:**
```json
{
  "success": true,
  "data": {
    "checklistNumber": "CK-0042",
    "checklistGuid": "1025-ck-1",
    "title": "Pre-Placement Concrete Inspection",
    "inspectorName": "John Doe",
    "date": "2026-09-17",
    "overallConfidence": 0.94,
    "rawVisionNotes": "Transcribed 3 sequential pages",
    "items": [
      {
        "itemNumber": 1,
        "prompt": "Rebar placement verified",
        "result": "Pass",
        "comment": "",
        "confidence": 0.95,
        "needsReview": false
      }
    ]
  },
  "previewUrls": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ]
}
```

### 3.2. Verification Drawer Props Update
```typescript
interface InspectionVerifyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  extraction: InspectionExtractionResult | null;
  previewUrls: string[]; // changed from single previewUrl to array
  inspections: InspectionRecord[];
  targetInspectionId?: string; // pre-associated checklist
  onCommitSuccess: (committed: InspectionRecord) => void;
}
```

---

## 4. UI & Component Architecture

1. `InspectionGrid.tsx`:
   - Add a "Scan Sheet(s)" action button to each card row which opens `InspectionScanModal` with `initialChecklistId={inspection.id}`.
2. `InspectionScanModal.tsx`:
   - Checklist selector dropdown at top: `<select>` showing available project checklists.
   - State `selectedChecklistId: string`.
   - File dropzone/picker disabled with helper text "Please select a checklist first" until selected.
   - State `selectedFiles: File[]`.
   - Page thumbnail list showing thumbnail preview, page number tag, and delete button.
   - Action buttons: "Add Another Page" and "Transcribe {N} Pages".
3. `InspectionVerifyDrawer.tsx`:
   - State `activePageIndex: number` (default 0).
   - Top preview bar with pills: `Page 1 | Page 2 | Page 3`.
   - Displays image for `previewUrls[activePageIndex]`.
   - Target checklist selector locked/preselected to the chosen checklist.

---

## 5. Testing Plan

1. **Unit Tests**:
   - `lib/inspection-ocr.test.ts`: test `extractInspectionSheet` with multi-image buffer array and verify multi-page prompt generation and response parsing.
   - `app/api/inspections/routes.test.ts`: test `/api/inspections/[projectId]/extract` with multiple files and targetChecklistId.
2. **Build & Typecheck**:
   - Verify `npm run build` succeeds cleanly in `_ref/project-sight-boiler`.
   - Verify `npm run test` passes (all 45+ suites).
3. **Deployment**:
   - Run `deploy/sync-boiler.sh` to update GCP production VM.
