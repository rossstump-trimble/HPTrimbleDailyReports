# Hensel Phelps & Trimble Field Operations Prototype

Modern jobsite daily reporting, checklist inspection digitization, punch list processing, and superintendent Superdaily review prototype built for Hensel Phelps and Trimble.

Target deployment: [hp-trimble-lab.com](https://hp-trimble-lab.com)

---

## Overview

1. **Frictionless Trade Daily Intake (`/intake/[projectId]`)**:
   - Mobile-first, zero-friction trade contractor daily entry initiated via jobsite QR code.
   - Multimodal capture: freeform voice recording (speech-to-text via Whisper / Gemini), structured FOG617 audio interview questions, photo uploads with automated trade and labor extraction.
   - Trade partner selection with autocomplete, craft worker counts, and hours breakdown.

2. **Hensel Phelps Staff Mobile Daily (`/intake/[projectId]/hp`)**:
   - Streamlined intake path specifically tailored for Hensel Phelps staff, with auto-dispatch into review.

3. **Master Bowling Sheet (`/projects/[projectId]/bowling`)**:
   - Matrix of tracked trade contractors across calendar days, indicating intake status, missing dailies, and missing STA flags.

4. **Superdaily Review & Master Export (`/projects/[projectId]/superdaily`)**:
   - Consolidated superintendent view synthesizing daily subcontractor reports into a high-level site narrative.
   - Inline review, weather data integration, and branded export conforming to official Hensel Phelps brand standards (Pantone 187 Red `#A6192E`, Wheatland Yellow `#F2A900`, Charcoal Gray `#333333`, and Roboto typography).

5. **Digitization & Inspection Processing**:
   - Multi-image checklist OCR and punch list photo scanning.
   - Direct synchronization to Trimble ProjectSight APIs as the official System of Record.

---

## Architecture & Security Documentation

Detailed enterprise specs and architecture docs live in `docs/`:

- [ARCHITECTURE_AND_SECURITY.md](./docs/ARCHITECTURE_AND_SECURITY.md) — Architectural overview, data privacy, TAAI integration, and tenant isolation brief.
- [Hensel Phelps Security Brief (.docx)](./docs/Hensel_Phelps_Field_Operations_Architecture_and_Security.docx)
- [Architecture & Security Diagrams (.drawio)](./docs/architecture-and-security.drawio)
- [LOCAL-DEV.md](./LOCAL-DEV.md) — Local developer guide for running without Trimble Identity.

---

## Local Development

### 1. Prerequisites
- Node.js 20+
- npm

### 2. Environment Setup
```bash
cp .env.local.example .env.local
npm install
```

`AUTH_MODE=local` is set by default in `.env.local`, allowing you to run and test locally without requiring Trimble Identity (TID) credentials or VPN access.

### 3. Run Dev Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```

---

## Key Routes

| Route | Purpose |
| :--- | :--- |
| `/projects` | Project overview register & jobsite QR code generator |
| `/projects/[projectId]/bowling` | Subcontractor Bowling Sheet matrix |
| `/projects/[projectId]/dashboard` | Monthly activity & analytics grid |
| `/projects/[projectId]/superdaily` | Executive Superdaily synthesis & print export |
| `/projects/[projectId]/companies` | Tracked trade partner management |
| `/projects/[projectId]/inspections` | Inspection register & multi-page checklist OCR |
| `/projects/[projectId]/punch-list` | Punch list digitization & camera scan |
| `/intake/[projectId]` | Public mobile QR trade daily intake |
| `/intake/[projectId]/hp` | Hensel Phelps staff mobile daily intake |
