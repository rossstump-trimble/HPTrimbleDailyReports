# Superdaily Enhancements Design Specification

**Date:** 2026-09-17  
**Status:** Approved  
**Topic:** Superdaily Weather Integration, Favor Suppression, Missing Bowling Sheet Trades, Inline Overview Editing, Verbose Trade Work, and Export Curation Deletions  
**Location:** `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler`

---

## 1. Overview & Business Objectives

The Hensel Phelps Superdaily Master Report synthesizes individual subcontractor daily reports into an authoritative jobsite briefing. This enhancement brings 6 critical capabilities:

1. **Weather Integration**: Automatically fetch and display structured weather observations (temperature, high/low, sky conditions, wind velocity, humidity, precipitation) using `lib/weather-service.ts`.
2. **Suppression of Inter-Trade Favors**: Completely remove the "Inter-Trade Coordination & Favors" card and section from both the web UI and the printable vector document.
3. **Bowling Sheet Missing Trades Callout**: Cross-reference the project's active bowling sheet trade partners against submitted daily reports for the target date to flag trades that have not filed a daily.
4. **Inline Editable Executive Overview**: Provide an intuitive inline click-to-edit experience for the superintendent with immediate Save and Cancel controls.
5. **Verbose Individual Trade Work Narratives**: Expand each subcontractor entry to provide comprehensive, detailed narratives of specific work executed, systems installed, elevations/grids, and equipment deployed.
6. **Pre-Export Section & Trade Deletion**: Allow superintendents to soft-delete individual trade contractor cards or entire sections (Weather, Overview, Missing Trades, Delays, Safety) to tailor the final briefing before vector PDF generation, accompanied by an undo/restore bar.

---

## 2. Architecture & Data Contracts

### 2.1. Type Definitions (`types/superdaily.ts`)

```typescript
export interface SuperdailyWeather {
  temp: number;
  tempMax?: number;
  tempMin?: number;
  conditions: string;
  humidity: number;
  windVelocity: number;
  rainfall: number;
  snowfall: number;
  weatherNotes: string;
}

export interface MissingTradePartner {
  tradePartnerId: string;
  tradePartnerName: string;
  category?: string;
}

export interface TradeWorkSummary {
  tradePartnerId: string;
  tradePartnerName: string;
  category?: string;
  workerCount: number;
  totalHours: number;
  locationDescription: string;
  workPerformed: string; // Verbose, multi-sentence technical narrative
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
  weather?: SuperdailyWeather;
  executiveSummary: string;
  totalHeadcount: number;
  totalManHours: number;
  activeTradeCount: number;
  expectedTradeCount: number;
  missingTrades: MissingTradePartner[];
  tradeSummaries: TradeWorkSummary[];
  delaysAndRoadblocks: string[];
  safetyAndStas: SuperdailySafety;
}
```

*Note: `TradeFavor` and `interTradeFavors` are removed from the active data contract.*

---

## 3. Backend Synthesis & Detection

### 3.1. Route Handler (`app/api/projects/[projectId]/superdaily/summarize/route.ts`)
1. **Weather Fetching**:
   - Calls `fetchWeatherForDate(date, project.lat, project.lon, project.name)`.
   - Attaches normalized weather properties to the synthesized report.
2. **Bowling Sheet Missing Trade Detection**:
   - Reads `project.tradePartners` excluding `project.excludedTradePartnerIds`.
   - Compares with `mergedReports` trade names and IDs.
   - Any trade partner expected on the project without a submitted daily for that date is marked in `missingTrades`.
3. **Report Generation**:
   - Calls updated `synthesizeSuperdaily` passing project name, date, merged reports, weather, and missing trades.

### 3.2. Synthesis Engine (`lib/superdaily.ts`)
1. **Gemini 3.7 Flash Prompting**:
   - Strips all favor/equipment loan extraction prompts.
   - Instructs the model to generate **verbose, highly detailed technical narratives** for each subcontractor's work description (gridlines, scopes, materials placed, progress rate).
   - Generates an executive overview and delay breakdown.
2. **Deterministic Fallback**:
   - If AI is unreachable, deterministically compiles full raw notes, equipment lists, and worker statistics without truncating descriptions.

---

## 4. User Interface & Curation Workflow

### 4.1. Screen Layout (`app/(home)/projects/[projectId]/superdaily/page.tsx`)
- **Top Bar**: Date picker, Generate/Refresh button, Restore Items button (if items deleted), and Download PDF button.
- **Weather Card**:
  - Displays high/low temperature, wind speed, humidity, precipitation, and conditions badge.
  - Trash icon button to remove Weather from export.
- **Executive Overview Card**:
  - Inline editing state: Clicking "Edit Overview" switches the paragraph to an auto-focusing textarea with "Save" and "Cancel" buttons.
  - Remove Section icon button.
- **Missing Trades Warning Banner**:
  - Displayed if `missingTrades.length > 0`.
  - Amber/red warning styling listing each delinquent trade partner and category.
  - Remove Section icon button.
- **Expanded Trade Contractor Cards**:
  - Replaces the dense compact table with individual detailed cards.
  - Card Header: Subcontractor name, trade category, crew count, total hours, STA badge, and a red **Delete Card** icon button.
  - Card Body: Bold location/area header followed by the expanded, multi-paragraph narrative of work executed.
  - Card Footer: Badges for equipment in use and any specific roadblock notes.
- **Delays & Roadblocks Card**:
  - Lists material/weather/crew impediments with Remove Section control.
- **Safety & STAs Card**:
  - Displays STA briefing compliance notes with Remove Section control.
- **Undo / Restore Banner**:
  - Sticky at bottom of screen when any items are deleted: *"X items hidden from export — [Restore All]"*.

### 4.2. Vector Print Document (`components/superdaily/SuperdailyPrintDocument.tsx`)
- Renders only in `@media print`.
- Incorporates:
  - Header with Hensel Phelps branding, Project Name, and Date.
  - Weather Summary strip (if not removed).
  - High-level KPIs (Active Trades, Total Headcount, Total Hours, STA Status).
  - Executive Overview (if not removed).
  - Missing Bowling Sheet Trades Callout (if not removed).
  - Verbose Trade Work Breakdown sections (respecting trade card deletions).
  - Delays & Safety sections (if not removed).
- Completely excludes inter-trade favors.
- Designed with CSS page break rules (`break-inside-avoid`) for crisp multi-page vector PDF generation.

---

## 5. Testing & Verification

1. **Unit Tests**:
   - `lib/superdaily.test.ts`: Verify missing trades identification, weather payload attachment, and verbose work narrative handling without favor extraction.
   - `lib/weather-service.test.ts`: Verify weather normalization for past, present, and future dates.
2. **Component Tests**:
   - `SuperdailyPage.test.tsx`: Test inline overview editing (save/cancel), trade deletion, section deletion, and restore functionality.
   - `SuperdailyPrintDocument.test.tsx`: Test that print document respects deleted items and omits inter-trade favors.
