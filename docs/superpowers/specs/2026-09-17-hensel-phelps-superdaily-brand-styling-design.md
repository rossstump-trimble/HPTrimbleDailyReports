# Hensel Phelps Superdaily Brand Guidelines Styling & PDF Export Design Spec

## 1. Overview & Objective
This specification establishes the official **Hensel Phelps Brand Guidelines** visual identity across the **Superdaily Master Report** application and its downloadable/printable PDF export document.

The goal is to transform the existing generic/slate export layout into an executive-grade, field-ready Hensel Phelps report adhering strictly to official colors, typography, horizontal logo assets, and high-DPI print styles for Trimble ProjectSight jobsite teams.

---

## 2. Brand Identity Tokens & Color System

The styling is governed by the official Hensel Phelps Brand Guidelines:

| Token Name | HEX Code | RGB | Pantone | Primary Usage in Superdaily |
| :--- | :--- | :--- | :--- | :--- |
| **Hensel Phelps Red** | `#A6192E` | `166, 25, 46` | Pantone 187 | Primary header brand horizon, active trade metric accents, primary PDF download CTA, critical roadblocks/delays banner. |
| **Wheatland Yellow** | `#F2A900` | `242, 169, 0` | Pantone 130 | Secondary brand horizon stripe, missing trade partner callout banner, restore actions, warning badges. |
| **Charcoal Gray** | `#333333` | `51, 51, 51` | — | Primary typography, headers, section labels, dark border accents. |
| **Light Gray** | `#D0D3D4` | `208, 211, 212` | Pantone 427 | Card borders, table grid lines, subtle divider borders, sign-off line rules. |
| **Pure White** | `#FFFFFF` | `255, 255, 255` | — | Background for printable sheet, card fills, high-contrast text on red buttons. |

---

## 3. Typography Architecture: Roboto
- **Font Family**: Google `Roboto` (`Roboto:wght@400;500;700;900`).
- **Font Stack**:
  ```css
  font-family: var(--font-roboto), Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  ```
- **Weights & Scales**:
  - `900 / Black / Heavy`: Main title, brand wordmarks.
  - `700 / Bold`: Section headers, metric values, trade partner titles, table headers.
  - `500 / Medium`: Metadata labels, badges, worker count/hours tags.
  - `400 / Regular`: Work descriptions, executive summary body, weather narrative.

---

## 4. Brand Asset Management
- **Source Logo**: `/Users/rstump/Downloads/Hensel Phelps Logo PNGs/HP_Logo_Hori_PBM_Std.png`
  - Features the official horizontal Hensel Phelps logo mark with the registered slogan: *"Plan. Build. Manage."*
  - Resolution: 800 × 221 px PNG with transparent background.
- **Destination Path**:
  `/Users/rstump/CompliantScheduling/HP_Demo_Day/_ref/project-sight-boiler/public/images/hp-logo-std.png`
- **Embedding & Print Reliability**:
  - In addition to standard static file serving, `SuperdailyPrintDocument` supports both image asset rendering and inline high-resolution presentation to ensure immediate rendering during `window.print()` / PDF export without network latency.

---

## 5. Component Specifications

### 5.1. Printable PDF Document (`SuperdailyPrintDocument.tsx`)
The printable view (`.superdaily-print-only`) is optimized for standard **Letter portrait (8.5" x 11")**:

1. **Header Block**:
   - **Left**: Hensel Phelps official logo with tagline (`HP_Logo_Hori_PBM_Std.png`), rendered at high DPI (`width: 175px`, `height: auto`).
   - **Right**: Right-aligned report header:
     - Report Date (`font-bold text-sm text-[#333333]`)
     - Project Name (`font-bold text-base text-[#333333]`)
     - Project ID & Generated timestamp (`text-[10px] text-slate-500`)
   - **Dual Brand Horizon Accent**:
     - Solid `3px` top line: `#A6192E` (Hensel Phelps Red)
     - Solid `2px` bottom line: `#F2A900` (Wheatland Yellow)
2. **Site Weather Strip**:
   - Clean `#D0D3D4` border with `#FAFAFA` neutral fill.
   - Temperature highlight badge in `#F2A900` / `#FFFBEB` with Charcoal text.
3. **High-Level Metric Strip**:
   - 4-grid container with `#D0D3D4` borders.
   - Values in bold `#333333` Charcoal; active trade numbers accented in `#A6192E` Hensel Phelps Red.
   - STA Safety status in clear green (`#15803D`) when all complete, or `#A6192E` warning when partial.
4. **Executive Summary**:
   - Section header in Charcoal `#333333` with a `2.5px` Hensel Phelps Red left-accent bar.
   - Clean, readable line height (`leading-relaxed`) in Roboto body text.
5. **Missing Submissions Callout (Trades on Bowling Sheet)**:
   - Warning container bordered in `1.5px` **Wheatland Yellow (`#F2A900`)** with a light cream background (`#FFFDF5`).
   - Pills with `#D0D3D4` borders displaying missing trade partner names.
6. **Trade Contractor Work Breakdown**:
   - Section header accented with Hensel Phelps Red indicator.
   - Each contractor card bordered with `#D0D3D4`.
   - Trade Partner name in `#333333` bold, craft badge in subtle `#D0D3D4` tone.
   - Location & work descriptions cleanly formatted with `break-inside: avoid;`.
7. **Reported Delays & Roadblocks**:
   - Bordered in `#A6192E` with light red background tint for urgent visibility.
8. **Superintendent Sign-Off**:
   - Clean 2-column signature and verification block with `#D0D3D4` rule lines.

### 5.2. On-Screen Superdaily Page (`page.tsx`)
1. **Header & Badges**:
   - Title: **"Superdaily Master Report"**
   - Brand Badge: Hensel Phelps Red subtle fill (`bg-[#A6192E]/10 text-[#A6192E] border-[#A6192E]/20`).
2. **Action Buttons**:
   - **"Download PDF"**: Primary action styled with `#A6192E` (`bg-[#A6192E] hover:bg-[#8B1425] text-white`).
   - **"Restore" Soft-Deleted Items**: Wheatland Yellow theme (`border-[#F2A900] text-[#B87E00] hover:bg-[#FFFDF5]`).
   - **"Edit Overview"**: Charcoal theme (`text-[#333333] hover:text-[#A6192E]`).
3. **Interactive Cards**:
   - Weather, Overview, Missing Trades, and Trade Breakdown cards styled with Charcoal `#333333` text, Light Gray `#D0D3D4` borders, and HP brand accents.
4. **Print Stylesheet (`@media print`)**:
   - Enforces `-webkit-print-color-adjust: exact; print-color-adjust: exact;`.
   - Sets `@page { size: letter portrait; margin: 0.4in; }`.
   - Applies `break-inside: avoid;` to all summary cards, trade rows, and sign-off blocks.

---

## 6. Error Handling & Edge Cases
- **Missing or Slow Logo Image**:
  - The `<img>` tag includes an `alt="Hensel Phelps"` fallback and inline SVG/text fallback to ensure text renders even if external image loading fails in headless PDF renderers.
- **Large Trade Counts**:
  - Multiple trades cleanly paginate across page breaks without cutting through a contractor's work description.
- **Long Executive Summaries**:
  - Automatically wraps cleanly without horizontal overflow.

---

## 7. Testing & Verification Plan

### 7.1. Automated Unit & Component Tests
- `SuperdailyPrintDocument.test.tsx`:
  - Assert logo renders with `/images/hp-logo-std.png` source.
  - Assert Hensel Phelps Red (`#A6192E`) and Wheatland Yellow (`#F2A900`) hex styles are applied to the header horizon bar.
  - Assert Charcoal (`#333333`) and Light Gray (`#D0D3D4`) classes/styles are properly assigned.
  - Verify section hiding and trade hiding filters function correctly.

### 7.2. Production Build & Print Verification
- Run `npm run build` or `npx vitest run` in `project-sight-boiler`.
- Verify print rendering in browser print preview (`window.print()`).
