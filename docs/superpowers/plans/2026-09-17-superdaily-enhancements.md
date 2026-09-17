# Superdaily Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate weather observations, eliminate inter-trade favors, detect missing bowling sheet trades, enable inline executive overview editing, expand individual trade work narratives, and support soft-deleting trades/sections before vector PDF export.

**Architecture:** Update `types/superdaily.ts` data contract; update backend route to pull weather from `lib/weather-service.ts` and compare bowling sheet partners against submitted dailies; refine Gemini synthesis in `lib/superdaily.ts` for verbose trade descriptions and zero favors; enhance `SuperdailyPage.tsx` with inline editing and soft-deletion controls; sync exclusions with `SuperdailyPrintDocument.tsx`.

**Tech Stack:** Next.js 14 App Router, TypeScript, React, Tailwind CSS, Lucide Icons, Vitest.

---

### Task 1: Update Data Contracts & Interfaces

**Files:**
- Modify: `types/superdaily.ts`

- [ ] **Step 1: Write updated interfaces in `types/superdaily.ts`**
  - Add `SuperdailyWeather` interface.
  - Add `MissingTradePartner` interface.
  - Remove `TradeFavor` and `TradeFavorType` from `SuperdailyReport`.
  - Add `weather?: SuperdailyWeather`, `missingTrades: MissingTradePartner[]`, `expectedTradeCount: number` to `SuperdailyReport`.

- [ ] **Step 2: Verify TypeScript types build cleanly**
  Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**
  ```bash
  git add types/superdaily.ts
  git commit -m "feat(superdaily): update types with weather, missing trades, and remove trade favors"
  ```

---

### Task 2: Backend Route & Synthesis Updates (Weather, Missing Trades, Verbose Narratives)

**Files:**
- Modify: `lib/superdaily.ts`
- Modify: `lib/superdaily.test.ts`
- Modify: `app/api/projects/[projectId]/superdaily/summarize/route.ts`
- Modify: `app/api/projects/[projectId]/superdaily/route.test.ts`

- [ ] **Step 1: Update unit tests in `lib/superdaily.test.ts`**
  - Add tests verifying prompt excludes favors and requests verbose trade work descriptions.
  - Add tests verifying deterministic fallback sets weather, missing trades, and preserves complete narrative text.

- [ ] **Step 2: Update `lib/superdaily.ts` implementation**
  - Remove `extractInterTradeFavorsFromNotes`.
  - Update prompt in `buildSuperdailyPrompt` to require multi-sentence, deep technical work descriptions per trade.
  - Update `synthesizeDeterministicFallback` and `parseSuperdailyResponse` to populate `weather` and `missingTrades`.

- [ ] **Step 3: Update `app/api/projects/[projectId]/superdaily/summarize/route.ts`**
  - Call `fetchWeatherForDate(date, project.lat, project.lon, project.name)` from `lib/weather-service.ts`.
  - Detect missing trades by comparing `project.tradePartners` (minus `excludedTradePartnerIds`) against `mergedReports`.
  - Pass weather and missing trades to `synthesizeSuperdaily`.

- [ ] **Step 4: Run backend tests**
  Run: `npm test lib/superdaily.test.ts app/api/projects/[projectId]/superdaily/route.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add lib/superdaily.ts lib/superdaily.test.ts app/api/projects/[projectId]/superdaily/summarize/route.ts app/api/projects/[projectId]/superdaily/route.test.ts
  git commit -m "feat(superdaily): integrate weather, missing trade partner detection, and verbose work synthesis"
  ```

---

### Task 3: Printable Document (`SuperdailyPrintDocument.tsx`) Synchronization

**Files:**
- Modify: `components/superdaily/SuperdailyPrintDocument.tsx`

- [ ] **Step 1: Update `SuperdailyPrintDocument.tsx`**
  - Accept optional `hiddenSectionKeys?: string[]` and `hiddenTradeIds?: string[]`.
  - Add weather strip under project header.
  - Add Missing Bowling Sheet Trades callout if present and not hidden.
  - Render verbose trade narratives for each trade.
  - Remove all Inter-Trade Favors JSX.
  - Apply clean CSS page-break rules.

- [ ] **Step 2: Commit**
  ```bash
  git add components/superdaily/SuperdailyPrintDocument.tsx
  git commit -m "feat(superdaily): update vector print document with weather, missing trades, and section filtering"
  ```

---

### Task 4: Interactive Superdaily Page (Inline Edit, Rich Trade Cards, Soft-Delete)

**Files:**
- Modify: `app/(home)/projects/[projectId]/superdaily/page.tsx`
- Modify: `app/(home)/projects/[projectId]/superdaily/page.test.tsx`

- [ ] **Step 1: Write component tests in `page.test.tsx`**
  - Verify inline editing toggles with Save/Cancel.
  - Verify removing a trade card removes it from view and increases hidden items count.
  - Verify removing a section (e.g. weather or missing trades) hides it.
  - Verify "Restore All" unhides deleted elements.

- [ ] **Step 2: Implement UI in `SuperdailyPage.tsx`**
  - Add `hiddenSections` set and `hiddenTradeIds` set in state.
  - Implement Weather card with high/low, humidity, wind, and "Remove" button.
  - Implement Missing Trades banner with delinquent contractor tags and "Dismiss/Remove" button.
  - Implement inline click-to-edit for Executive Overview with auto-focus textarea, Save, and Cancel buttons.
  - Implement rich expanded Trade Contractor Cards with crew details, equipment badges, verbose work narrative, and Trash button.
  - Implement floating bottom undo banner: *"X items hidden from export — [Restore All]"*.
  - Pass hidden IDs down to `SuperdailyPrintDocument`.

- [ ] **Step 3: Run Vitest and build checks**
  Run: `npm test app/(home)/projects/[projectId]/superdaily/page.test.tsx`
  Run: `npm run build`

- [ ] **Step 4: Commit**
  ```bash
  git add app/(home)/projects/[projectId]/superdaily/page.tsx app/(home)/projects/[projectId]/superdaily/page.test.tsx
  git commit -m "feat(superdaily): implement inline overview editing, verbose trade cards, and pre-export curation deletions"
  ```
