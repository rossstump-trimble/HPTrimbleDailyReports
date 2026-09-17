# Design Specification: Hensel Phelps Staff Mobile Daily Experience

## Problem Statement
When Hensel Phelps superintendents, project engineers, and field staff scan the HP Staff QR code on site, the current intake page:
1. Is publicly accessible instead of requiring corporate Trimble Identity (TID) authentication.
2. Re-uses the desktop/trade-partner intake card (`DailyConfirmCard`) which is cumbersome on mobile devices and inappropriate for GC field supervision.
3. Inappropriately prompts HP staff for Safety Task Analysis (STA) uploads (which are required for subcontractor trade partners, not HP supervisory staff).
4. Needs a fast, native mobile experience centered on site walk observations, trades & favors, safety/delays, and jobsite photos.

---

## Architecture & Requirements

### 1. Trimble ID Authentication Protection (`middleware.ts`)
- **Route Exclusion:** `/intake/[projectId]/hp` and `/api/intake/hp` (if applicable) are explicitly excluded from public intake routes in Next.js middleware.
- **Redirect Flow:** If an unauthenticated user navigates to or scans `/intake/[projectId]/hp`, the middleware redirects to `/login?from=/intake/${projectId}/hp`.
- **Identity Auto-Prefill:** On page mount, `/api/auth/me` is called. The authenticated staff user's name, email, and preferred role are automatically loaded into the daily report author fields without manual typing.

### 2. HP Staff-Specific Scope (No STA)
- **Omit STA Prompt:** HP staff daily intake will **never** ask for STA photos or forms.
- **Default Compliance:** HP staff entries automatically have `staCompleted: true` (or omitted as non-subcontractor craft) and will not generate missing-STA alerts on bowling sheets or dashboards.

### 3. Direct ProjectSight Dispatch (No Approval Required)
- **Immediate Auto-Approval:** HP staff daily reports bypass the pending approval queue entirely (`approvalStatus: "approved"`).
- **Direct Dispatch to PS API:** Upon submission via `/api/intake/submit`, if `isHpEmployee === true`, the system dispatches the daily report and attached photos directly to ProjectSight via `sendFog617ToProjectSight`.
- **Immediate Sync Status:** The record is stamped with `projectSightDailyId` and `sentToProjectSightAt` immediately, and the success screen indicates it was filed straight into ProjectSight.

### 4. Mobile-First UX Architecture (`app/intake/[projectId]/hp/page.tsx`)
- **Thumb-Friendly Touch Targets:** 44px+ touch targets, sticky bottom action bar, clean rounded cards.
- **Hero Voice Site Walk:**
  - One-tap voice dictation button prominently positioned at the top.
  - Staff can walk the jobsite and speak freely: e.g., *"Walked Level 3, drywall hanging is 80% complete. Loaned scissors lift to ALC for ceiling grid staging. South stairwell needs trash cleanup before Friday inspection."*
  - AI extraction parses the transcript into structured fields with immediate editable card feedback.
- **Smart Observation Cards:**
  1. **Work & Progress Observed:** Areas walked, milestones completed, active trade partner progress.
  2. **Trades & Favors:** Reciprocal favors, loaned equipment, staging assistance provided to subcontractors.
  3. **Safety & Quality Observations / Delays:** Schedule impacts, safety hazards, clean-up requirements.
  4. **Site Photos:** Quick camera attachment button for progress and issue documentation.
  5. **Staff Submitter Info:** Auto-populated from Trimble ID with quick role switcher (Superintendent, Project Engineer, Field Engineer, Safety Manager).
- **Direct Submission:**
  - Floating/sticky bottom bar with one-tap "Submit HP Daily Report".
  - Clean success screen with immediate confirmation and one-tap return to project dashboard.

---

## Verification & Testing
- Middleware test: Unauthenticated requests to `/intake/[id]/hp` receive 307 redirect to `/login`. Authenticated sessions proceed.
- Vitest suite & build: `npm test -- --run` and `npm run build` compile cleanly without errors.
