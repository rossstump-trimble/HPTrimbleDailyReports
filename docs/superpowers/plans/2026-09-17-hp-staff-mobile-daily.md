# Hensel Phelps Staff Mobile Daily Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a Trimble ID-protected, mobile-optimized daily report experience for Hensel Phelps staff that captures site walks, trades & favors, safety/delays, and photos without asking for STA forms, and syncs directly into ProjectSight without needing superintendent approval.

**Architecture:** Next.js middleware enforces TID authentication on `/intake/[projectId]/hp`. The mobile client (`app/intake/[projectId]/hp/page.tsx`) auto-populates author identity from `/api/auth/me`, provides a voice-first site walk and smart observation cards tailored for GC field staff, and submits with `isHpEmployee: true`. The backend submission endpoint (`app/api/intake/submit/route.ts`) auto-approves HP staff reports and dispatches them directly to the ProjectSight API.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide icons, ProjectSight REST API.

## Global Constraints

- Never prompt HP staff for Safety Task Analysis (STA) uploads or forms.
- Require Trimble Identity authentication for `/intake/[projectId]/hp`; unauthenticated users redirect to `/login?from=/intake/${projectId}/hp`.
- Auto-approve HP staff reports on submission (`approvalStatus: "approved"`) and dispatch directly to ProjectSight via `sendFog617ToProjectSight`.
- Ensure mobile touch targets are at least 44px with responsive, thumb-friendly card layouts.
- Run `npm test -- --run` and `npm run build` after every major task.

---

### Task 1: Middleware Protection for HP Staff Intake Route

**Files:**
- Modify: `middleware.ts:18-40`
- Test: `lib/middleware-auth.test.ts` (unit test for path matching logic)

**Interfaces:**
- Consumes: `NextRequest`, `isPublicPath(pathname, method)`.
- Produces: Protected `/intake/[projectId]/hp` path while keeping `/intake/[projectId]` public for trade partners.

- [ ] **Step 1: Write unit test for public path classifier**

Create `lib/middleware-auth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { isPublicIntakePath } from './middleware-auth';

describe('isPublicIntakePath', () => {
  it('allows trade partner intake path as public', () => {
    expect(isPublicIntakePath('/intake/1025')).toBe(true);
    expect(isPublicIntakePath('/api/intake/submit')).toBe(true);
    expect(isPublicIntakePath('/api/intake/extract')).toBe(true);
  });

  it('protects HP staff intake path from public access', () => {
    expect(isPublicIntakePath('/intake/1025/hp')).toBe(false);
    expect(isPublicIntakePath('/intake/project-abc/hp')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run lib/middleware-auth.test.ts`
Expected: FAIL (cannot find module `./middleware-auth`).

- [ ] **Step 3: Implement helper and update `middleware.ts`**

Create `lib/middleware-auth.ts`:
```typescript
export function isPublicIntakePath(pathname: string): boolean {
  // HP staff intake requires corporate Trimble Identity authentication
  if (pathname.includes('/hp') || pathname.endsWith('/hp')) {
    return false;
  }
  return (
    pathname === '/login' ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/logout' ||
    pathname.startsWith('/intake') ||
    pathname.startsWith('/api/intake') ||
    pathname.startsWith('/api/bowling') ||
    pathname.startsWith('/api/feedback') ||
    pathname.startsWith('/api/v1/feedback')
  );
}
```

Update `isPublicPath` in `middleware.ts`:
```typescript
import { isPublicIntakePath } from "@/lib/middleware-auth";

function isPublicPath(pathname: string, method: string): boolean {
  if (isPublicIntakePath(pathname)) {
    return true;
  }

  // Read-only project metadata for intake form (e.g. GET /api/projects/1025)
  if (method === "GET" && /^\/api\/projects\/[^/]+$/.test(pathname)) {
    return true;
  }

  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run lib/middleware-auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit middleware changes**

```bash
git add lib/middleware-auth.ts lib/middleware-auth.test.ts middleware.ts
git commit -m "feat(auth): require Trimble Identity authentication for HP staff intake route"
```

---

### Task 2: Direct ProjectSight Auto-Dispatch on HP Staff Submission

**Files:**
- Modify: `app/api/intake/submit/route.ts:130-185`
- Test: `app/api/intake/submit-hp-direct.test.ts`

**Interfaces:**
- Consumes: `body.isHpEmployee`, cookies with Trimble Identity session and destination.
- Produces: Daily report record stored as `approvalStatus: "approved"`, dispatched to ProjectSight API via `sendFog617ToProjectSight`, returning `projectSightDailyId`.

- [ ] **Step 1: Write integration test for HP staff direct dispatch**

Create `app/api/intake/submit-hp-direct.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { slugTradePartnerId } from '@/lib/trade-partner';

describe('HP staff report auto-approval rules', () => {
  it('identifies HP staff submissions as pre-approved', () => {
    const reportData = {
      isHpEmployee: true,
      tradePartnerName: 'Hensel Phelps',
      tradePartnerId: slugTradePartnerId('Hensel Phelps'),
      submittedBy: 'Ross Stump - Superintendent',
    };

    const status = reportData.isHpEmployee ? 'approved' : 'pending';
    expect(status).toBe('approved');
  });
});
```

- [ ] **Step 2: Update `app/api/intake/submit/route.ts`**

In `app/api/intake/submit/route.ts`:
1. Check if `body.isHpEmployee === true`.
2. Set `approvalStatus: body.isHpEmployee ? 'approved' : 'pending'`.
3. If `body.isHpEmployee === true`, read session cookies (`tidAccessTokenFromCookie`, `destinationFromCookieWithFallback`). If authenticated, immediately call `sendFog617ToProjectSight`:
   ```typescript
   if (report.isHpEmployee && token && psPortfolioId && psProjectId) {
     try {
       const psResult = await sendFog617ToProjectSight({
         token,
         portfolioId: psPortfolioId,
         projectId: psProjectId,
         capture: captureFromDailyReport(report),
         files: report.rawSourceFiles?.map((f) => {
           const bytes = readUpload(f.filePath);
           return {
             fileName: f.fileName,
             fileBytes: bytes || Buffer.from(''),
             mimeType: f.mimeType,
             category: 'daily_capture' as const,
           };
         }),
       });
       report.projectSightDailyId = psResult.projectSightDailyId;
       report.sentToProjectSightAt = new Date().toISOString();
     } catch (err) {
       console.warn('[submit] direct PS dispatch error for HP staff:', err);
     }
   }
   ```
4. Return `projectSightDailyId` in the JSON response when available.

- [ ] **Step 3: Run tests to verify**

Run: `npm test -- --run app/api/intake/submit-hp-direct.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit backend auto-dispatch changes**

```bash
git add app/api/intake/submit/route.ts app/api/intake/submit-hp-direct.test.ts
git commit -m "feat(intake): auto-approve and dispatch HP staff daily reports directly to ProjectSight"
```

---

### Task 3: Mobile-First HP Staff Daily Intake UI

**Files:**
- Modify: `app/intake/[projectId]/hp/page.tsx`
- Create: `components/intake/HpObservationCard.tsx`

**Interfaces:**
- Consumes: `/api/auth/me` user data, speech-to-text / AI extraction, file uploads.
- Produces: Mobile-optimized interface with:
  1. Header with Trimble ID user avatar, project name, and quick return to dashboard.
  2. Hero Voice Site Walk recording banner.
  3. Observation Cards:
     - Work & Progress Observed (areas walked, key milestones).
     - Trades & Favors Done (loaned equipment, reciprocal trade assistance).
     - Safety & Quality / Delays (safety hazards, schedule delays, notes).
     - Jobsite Photos (progress and inspection photo uploads).
     - HP Submitter Profile (name, role picker).
  4. Floating bottom submission bar: "Submit HP Daily Report" $\rightarrow$ direct ProjectSight sync.
  5. Success screen confirming immediate filing into ProjectSight.

- [ ] **Step 1: Create `components/intake/HpObservationCard.tsx`**

Implement clean, collapsible/expandable card component with clean touch-friendly borders, badge indicators, and inline speech-to-text support for mobile.

- [ ] **Step 2: Refactor `app/intake/[projectId]/hp/page.tsx`**

- Remove `step === 'sta'` entirely for HP staff.
- Ensure `staCompleted` is set to `true` and never prompted.
- Check user authentication on mount; if not authenticated, redirect to `/login?from=/intake/${projectId}/hp`.
- Prefill submitter name and corporate email from `/api/auth/me`.
- Replace desktop `DailyConfirmCard` with mobile-first observation cards.
- Add sticky bottom submission bar showing submit status.
- On submit success, display success card with ProjectSight ID (e.g. `Filed directly into ProjectSight #...`).

- [ ] **Step 3: Run test suite and build**

Run:
```bash
npm test -- --run
npm run build
```
Expected: All tests pass, build compiles cleanly.

- [ ] **Step 4: Commit mobile HP daily UI**

```bash
git add components/intake/HpObservationCard.tsx "app/intake/[projectId]/hp/page.tsx"
git commit -m "feat(hp-intake): mobile-first HP staff daily intake with hero voice walk and direct sync"
```

---

### Task 4: End-to-End Verification

**Files:**
- Verify: QR code link on `app/(home)/projects/page.tsx`
- Verify: Full test suite and Next.js production build

- [ ] **Step 1: Run full test suite**

Run: `npm test -- --run`
Expected: 46+ test files pass.

- [ ] **Step 2: Run production build check**

Run: `npm run build`
Expected: Next.js build succeeds with 0 errors.

- [ ] **Step 3: Final verification commit**

```bash
git commit --allow-empty -m "chore(hp-intake): verified TID route protection, mobile UX, and direct PS dispatch"
```
