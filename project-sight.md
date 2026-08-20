# ProjectSight Web Prototype — Project Documentation

> **Last updated:** July 13, 2026 (mobile dark mode rollout completed across all modules)

---

## Table of Contents

1. [Purpose & Overview](#purpose--overview)
2. [Tech Stack](#tech-stack)
3. [Environment Variables](#environment-variables)
4. [Project Structure](#project-structure)
5. [Pages & Routes](#pages--routes)
6. [Mobile Prototype](#mobile-prototype)
7. [Navigation Structure](#navigation-structure)
8. [Key Components](#key-components)
9. [AI & Assistant System](#ai--assistant-system)
10. [State Management & Contexts](#state-management--contexts)
11. [Database (Supabase)](#database-supabase)
12. [API Routes](#api-routes)
13. [Third-Party Integrations](#third-party-integrations)
13. [Styling System](#styling-system)
14. [Help & Support System](#help--support-system)
15. [Data Models](#data-models)
16. [Build, Dev & Deployment](#build-dev--deployment)

---

## Purpose & Overview

**ProjectSight** is a web prototype for Trimble's next-generation construction project management platform. It demonstrates the future of the ProjectSight product as a modern, browser-based application.

The prototype is used for **user testing, design exploration, and stakeholder demonstrations**. It covers the full lifecycle of construction project management — from schedules and drawings to field data, RFIs, financials, and progress tracking — with real-time collaboration, AI assistance, and 3D model viewing.

**Product Owner / Lead:** Julian Oczkowski  
**Product:** Trimble ProjectSight  
**Target Users:** General Contractors, Project Managers, Field Superintendents, Owners

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS, CSS Modules, SASS |
| UI Primitives | Radix UI (full suite), shadcn/ui |
| Icons | Lucide React, React Icons |
| State Management | Zustand, React Context API |
| Forms | React Hook Form + Zod validation |
| Database | Supabase (PostgreSQL) |
| Auth / Sessions | Supabase SSR |
| Real-time Collab | Liveblocks |
| AI Chat | Google Gemini 2.0 Flash (via OpenAI-compatible API) |
| Live AI Streaming | Google Multimodal Live API (audio/video) |
| 3D Rendering | Three.js |
| Charts | Recharts, D3, Vega / Vega-Lite |
| Maps | Google Maps JavaScript API (`@googlemaps/js-api-loader`) |
| Scheduling | react-frappe-gantt, react-big-calendar, CPM engine (custom) |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Flow Diagrams | @xyflow/react (React Flow) |
| PDF Viewing | react-pdf, pdfjs-dist |
| QR Scanning | jsqr |
| Email | Resend |
| Analytics | PostHog, Microsoft Clarity, ContentSquare Tag SDK, Web Vitals |
| Testing | Vitest, Playwright, React Testing Library |
| Git Hooks | Husky |
| Notifications | Sonner (toasts), Radix Toast |
| Deployment | AWS Amplify (see `amplify.yml`) |

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=        # Client-side (Live API streaming)
GEMINI_API_KEY=                    # Server-side (API route chat)

# Liveblocks
LIVEBLOCKS_SECRET_KEY=

# App environment (set to "fedramp" to enable native Help menu)
NEXT_PUBLIC_APP_ENV=
```

---

## Project Structure

```
project-sight/
├── app/                         # Next.js App Router pages & layouts
│   ├── layout.tsx               # Root layout (providers, fonts, theme)
│   ├── globals.css
│   ├── Room.tsx                 # Liveblocks room setup
│   ├── (home)/                  # Route group — uses main ProjectSight navigation shell
│   │   ├── layout.tsx
│   │   ├── page.tsx             # → My Projects page
│   │   ├── dashboard/page.tsx   # → Project Dashboard
│   │   ├── field-data/page.tsx  # → Field Management
│   │   ├── photos/page.tsx      # → Photos
│   │   └── schedule/page.tsx    # → Schedule (home view)
│   ├── 2dviewer/                # 2D drawing viewer
│   ├── 3dviewer/                # 3D model viewer
│   ├── cde-search/              # CDE (Common Data Environment) Search
│   ├── contact-support/         # Contact Support page
│   ├── detached-viewport/       # Detached 3D viewport window
│   ├── maintenance-windows/     # Scheduled maintenance info page
│   ├── progress-tracking/       # Progress Tracking module
│   ├── rfis/                    # RFIs (Requests for Information)
│   ├── schedule/                # Schedule module (Gantt, Lookahead, etc.)
│   ├── search/                  # Global search results
│   └── api/
│       ├── chat/route.ts        # AI chat API (Gemini via OpenAI SDK)
│       └── liveblocks-auth.ts   # Liveblocks session auth
├── components/
│   ├── ui/                      # shadcn/ui base components
│   ├── projectsight/            # Main app-shell components
│   ├── 2d-viewer/               # 2D viewer toolbar, viewport
│   ├── 3d-viewer/               # 3D viewer toolbars, panels, dialogs
│   ├── schedule/                # Schedule-specific components
│   ├── lookahead/               # Lookahead scheduling components
│   ├── analytics/               # Weekly review dialog
│   ├── omni/                    # Omni search / QR scanner
│   ├── labs/                    # Experimental feature badges
│   ├── icons/                   # Custom icon components
│   └── utils/                   # Screen capture utilities
├── contexts/                    # React Context providers
│   ├── AssistantContext.tsx
│   ├── CollaboratorContext.tsx
│   ├── LiveAPIContext.tsx
│   └── ProjectContext.tsx
├── lib/
│   ├── projectsight/
│   │   ├── navigationData.ts    # Nav menu items + helper functions
│   │   ├── myProjectsData.ts    # Mock project/portfolio data
│   │   └── helpConfig.ts        # Help link URLs + FedRAMP config
│   ├── supabase.ts
│   ├── types.ts
│   ├── cpmEngine.ts             # Critical Path Method calculation engine
│   ├── team-service.ts
│   ├── csv-utils.ts
│   ├── multimodal-live-client.ts
│   ├── audio-recorder.ts
│   ├── audio-streamer.ts
│   └── audioworklet-registry.ts
├── hooks/                       # Custom React hooks
├── integrations/                # Third-party integration wrappers
├── types/                       # Global TypeScript type definitions
├── utils/                       # Standalone utility functions
├── config/                      # App configuration files
├── data/                        # Static/mock data files
└── public/                      # Static assets (images, fonts, etc.)
```

---

## Pages & Routes

### Home Group — `/` (route group `(home)`)

All pages in this group share the main ProjectSight navigation shell (`ProjectSightNavigation`, `ProjectSightHeaderHome`).

| Route | Component | Description |
|---|---|---|
| `/` | `MyProjectsPage` | Project & portfolio listing with sidebar |
| `/dashboard` | `PSDashboard` | Project dashboard with charts (bar, pie, line), customizable widget layout via drag-and-drop, activity feed, and notifications |
| `/field-data` | `PSFieldData` | Field Management — tree view and grid of field data items and drawings |
| `/photos` | `PSPhotos` | Photos module — photo grid and tree view |
| `/schedule` (home) | Redirects to full Schedule | Entry point |

### Standalone Routes

| Route | Component | Description |
|---|---|---|
| `/schedule` | `Schedule.tsx`, `Lookahead.tsx`, `LookaheadReport.tsx`, `ScheduleCalendarView.tsx`, `ScheduleListView.tsx` | Full-featured schedule module with Gantt chart, Lookahead, Calendar view, List view, CPM analysis, import/export |
| `/rfis` | `RFIsPage` | RFI management — grid/list views, Ball-in-court grouping, status/assignment filters, right-side panel |
| `/progress-tracking` | `ProgressTrackingPage` | Progress tracking module — 5 tabs: Dashboard, Tracking Items, Field Work, Property Sets, Templates; integrates with Trimble Connect TFLX files and model Property Sets |
| `/2dviewer` | `2DVieweport` + `2DHeader` + `2DToolBar` | 2D drawing viewer with toolbar |
| `/3dviewer` | `ThreeDViewerClient` / `ThreeModelViewer` | 3D model viewer (Three.js) with geospatial & Google Maps viewport, side panel, multiple toolbars, issue dialogs |
| `/detached-viewport` | `DetachedViewport` | Pop-out 3D viewport for dual-screen setups |
| `/cde-search` | CDE Search page | Search within a Common Data Environment |
| `/search` | Global Search | Application-wide search results with network graph visualization |
| `/maintenance-windows` | `MaintenanceWindowsPage` | Displays upcoming/past scheduled maintenance windows (Scheduled, In-Progress, Completed) with impact levels |
| `/contact-support` | Contact Support page | Support form + links to Support Center, Community, Phone, and Email channels |

---

## Mobile Prototype

A browser-based mobile app prototype lives under the `/mobile` route group (`app/(mobile)/`). It is completely independent from the main web shell and renders inside a centered 390px phone-frame simulation for rapid prototyping.

### Routes

| Route | Component | Description |
|---|---|---|
| `/mobile` | — | Redirects to `/mobile/signin` |
| `/mobile/signin` | `SignInScreen` | Trimble ID sign-in placeholder (no real auth); navigates to `/mobile/projects` on submit |
| `/mobile/projects` | `ProjectsScreen` | My Projects list grouped by Downloaded / account number; Open button navigates into a project |
| `/mobile/projects/[id]` | `ProjectHomeScreen` | Project home — shortcuts row, team members, project details, recent drawings, 360° capture |
| `/mobile/projects/[id]/drawings` | `DrawingsScreen` | Drawings grid with collapsible discipline sections and 2-column thumbnail layout |
| `/mobile/projects/[id]/punch-items` | `PunchItemsScreen` | Punch list with status badges, meta chips, and a FAB (+) |

### File Structure

```
app/mobile/
├── layout.tsx               # Phone-frame shell (max-w-[390px] centered card)
├── page.tsx                 # Redirect → /mobile/signin
├── signin/page.tsx
├── projects/page.tsx
└── projects/[id]/
    ├── page.tsx
    ├── drawings/page.tsx
    └── punch-items/page.tsx

components/mobile/
├── MobileHeader.tsx         # Shared teal/navy top bar with hamburger, bell, search icons
├── MobileNavDrawer.tsx      # Slide-out left nav (Project Menu + Records sections)
├── SignInScreen.tsx         # Sign-in UI matching Trimble Identity layout
├── ProjectsScreen.tsx       # My projects grouped list
├── ProjectHomeScreen.tsx    # Project home with shortcuts, team, drawings, 360° capture
├── DrawingsScreen.tsx       # Collapsible discipline sections + 2-column grid
└── PunchItemsScreen.tsx     # Punch item cards with status badge + meta chips

lib/mobile/
└── mockData.ts              # All mock data: projects, team members, drawings, punch items
```

### Key Design Notes

- Header color: `#1b3a5c` (Trimble ProjectSight navy) — fixed brand color, unaffected by theme
- Status badge colors: `#d97706` (amber) for OPEN / PENDING REINSPECTION; `#6b7280` for CLOSED / VOID
- Phone frame: `bg-gray-300` page, `max-w-[390px] min-h-[844px] bg-white mx-auto shadow-2xl` container
- No new router libraries — all navigation via `next/navigation` (`useRouter`, `Link`)
- No new npm dependencies required

### Dark Mode

The mobile prototype shares the app-wide `next-themes` `ThemeProvider` (class strategy, `ps-theme` localStorage key) mounted in the root `app/layout.tsx`, so the `dark` class on `<html>` applies inside the phone frame too. Since the mobile screens use plain Tailwind utility classes (not the CSS-variable tokens used by the main web shell), dark mode is implemented with explicit `dark:` variants per element rather than semantic tokens.

- **Toggle:** Settings → Display → "Dark mode" switch (`components/mobile/SettingsScreen.tsx`) calls `useTheme().setTheme("dark" | "light")`.
- **Palette convention:** page background `bg-gray-50/100` → `dark:bg-gray-950`; card/surface `bg-white` → `dark:bg-gray-900`; chips/pills `bg-gray-100/200` → `dark:bg-gray-800`; borders `border-gray-100/200` → `dark:border-gray-800`; primary text `text-gray-800/900` → `dark:text-gray-100`; secondary text `text-gray-600/700` → `dark:text-gray-300`; muted text `text-gray-400/500` → `dark:text-gray-500`; links/accents `text-blue-500/600` → `dark:text-blue-400`. Navy headers (`#1b3a5c`) and the native-style camera screen stay unchanged in dark mode.
- **Coverage — full rollout complete.** Every screen and overlay under `components/mobile/` (and `components/mobile/subforms/`) has been converted to the `dark:` convention above: submittals/records module (`RecordsScreen`, `RecordCard`, `RecordsFilterPanel`, `RecordsSortModal`, `RecordsBatchEditForm`, `NotificationsPanel`, `SubmittalFormScreen`, `SubmittalPackageFormScreen`, `subforms/CommentsScreen`, `subforms/AttachmentsSheet`), project & team surfaces (`ProjectHomeScreen`, `ProjectsScreen`, `TeamMembersScreen`, `MyProfileScreen`), Settings and all its sub-screens (`SettingsScreen`), the generic record form and its pickers (`RecordFormScreen`, `subforms/FieldPickerScreen`, `subforms/LocationPickerScreen`, `subforms/ContactListScreen`, `subforms/DescriptionEditorScreen`, `subforms/DatePickerScreen`), standalone specialized forms (`DailyReportFormScreen`, `ChecklistFormScreen`), the Drawings module (`DrawingsScreen`, `DrawingViewerScreen`, `DrawingToolbar`, `DrawingShareSheet`, `DrawingRevisionPanel`, `DrawingMoreMenu`, `DrawingFilterPanel`, `AnnotationRecordCard`, `AddRecordMenu`), the Specifications module (`SpecificationsScreen`, `SpecViewerScreen`), and remaining resource/mock screens (`TrimbleConnectScreen`, `IdeaPortalScreen`, `HelpScreen`, `MockPhotoPickerScreen`).
- **Intentionally light-only / native-chrome exceptions:** `SignInScreen` stays light regardless of theme (pre-authentication screen). `MockCameraScreen`'s native-style camera viewfinder chrome stays fixed. The PDF/drawing canvas surfaces themselves (`DrawingViewerScreen`'s page background, `SpecViewerScreen`'s page background/nav bar, loading spinners over the canvas) stay a fixed light gray to represent physical paper/document pages — only the surrounding app chrome (headers, overlays, sheets, filter/revision panels) around those canvases follows dark mode. Small white toggle-switch knobs stay white in both themes (native switch convention).

### Mock Data (lib/mobile/mockData.ts)

| Data | Count | Notes |
|---|---|---|
| Projects | 4 | 2 downloaded (Acme South / Westminster, Pacific NW / ARS-WSU), 2 available |
| Team members | 9 | Initials + deterministic avatar colors |
| Drawings | 20 architectural + 874 (no discipline) | 4 architectural drawings have floor-plan SVG thumbnails |
| Punch items | 14 | Statuses: OPEN, PENDING REINSPECTION, CLOSED |

---

## Navigation Structure

Navigation is defined in `lib/projectsight/navigationData.ts` and rendered by `ProjectSightNavigation`. Menu items support submenus and custom ordering.

### Top-Level Items

| Order | Item | Path | Notes |
|---|---|---|---|
| 10 | Home | `/dashboard` | |
| 20 | Drawings | `#` | Not yet active |
| 25 | Documents | `/trimble-connect` | Conditionally shown |
| 30 | Specifications | `#` | Not yet active |
| 35 | Schedule | `/schedule` | |
| 40 | Photos | `/photos` | |
| 50 | Field Management | `/field-data` | |
| 55 | Progress Tracking | `/progress-tracking` | |
| 60 | Records ▶ | `#` | Has submenu |
| 70 | Financials ▶ | `#` | Has submenu |
| 90 | Files ▶ | `#` | Has submenu |

### Records Submenu
Drawing Sets, RFIs (`/rfis`), Submittals, Daily Reports, Punch Items, Action Items, Checklists, Field Work Directives, Issues, Meeting Minutes, Notices to Comply, Safety Notices, Specification Sets, Submittal Packages, Transmittals

### Financials Submenu
Budget, Contracts, Purchase Orders, Potential Change Orders, Subcontract Change Orders, Applications For Payment, Change Order Requests, Contract Invoices, Cost Forecasts, General Invoices, Prime Contract Change Orders

### Files Submenu
Library, Models (`/3dviewer`, opens in new tab)

### Navigation Configuration Modes

`getNavigationByConfig(showUpdatedNavigation, showIntegrations)` controls which items appear:

- **Default:** Shows `Files`, hides `Documents` and `Integrations`
- **Updated Navigation:** Shows `Documents`, hides `Files`
- **Integrations Enabled:** Shows `Documents`, hides both `Files` and `Documents` (integrations replaces both)

---

## Key Components

### App Shell & Layout

| Component | Purpose |
|---|---|
| `AppShell` | Top-level wrapper; dynamically adjusts main content width when the AI Assistant panel is open (400px or 600px expanded) |
| `RoomWrapper` | Wraps content in a Liveblocks room for real-time collaboration |
| `LiveAPIWrapper` | Wraps the app with the Google Multimodal Live API context (enabled only when `NEXT_PUBLIC_GEMINI_API_KEY` is set) |
| `ThemeProvider` | next-themes provider for light/dark/system theme |
| `ModusProviders` | Trimble Modus design system web component providers |
| `AssistantProvider` | Context for AI assistant open/closed state and messages |
| `ClientLayoutWrapper` | Client-side layout wrapper |

### ProjectSight Navigation Shell

| Component | Purpose |
|---|---|
| `ProjectSightHeaderHome` | Top navigation header — logo, menu toggle, Omni Search, App Launcher, Help menu, User popover, theme toggle, AI assistant button |
| `ProjectSightNavigation` | Left sidebar navigation with collapsible menu items |
| `ProjectSwitcher` | Dropdown to switch between projects |
| `MyProjectsSidebar` | Sidebar listing projects and portfolios |
| `MyProjectsPage` | Full projects listing page |

### AI Assistant

| Component | Purpose |
|---|---|
| `AssistantPanel` | Sliding right-side panel housing the full AI chat UI |
| `Assistant` | Core chat component — message list, send input, screenshot capture, voice input, markdown rendering, message feedback |
| `AssistantButton` | Toggle button to open/close the assistant panel |
| `CollaboratorAssistant` | Collaborative AI assistant variant (shared with collaborators via Liveblocks) |

### 3D Viewer

| Component | Purpose |
|---|---|
| `ThreeModelViewer` | Three.js 3D scene renderer |
| `ThreeDViewerClient` | Client-side 3D viewer wrapper |
| `GeospatialViewport` | Geospatial scene viewport |
| `GoogleMapViewport` | Google Maps integration viewport |
| `DetachedViewport` | Pop-out viewport window |
| `SidePanel` | Data panel attached to the 3D viewer |
| `HorizontalDataTablePane` | Bottom data table pane |
| `ViewportDataDialog` | Dialog to view data associated with selected 3D objects |
| `ConstructionIssueDialog` | Dialog to create/view construction issues on 3D model |
| `PanoramaViewer` | 360° panorama image viewer |
| `MiniMap` | Mini map overlay |
| `LoadingScreen` | 3D loading state |
| Various Toolbars | `HorizontalToolbar`, `VerticalToolbar`, `LeftVerticalToolbar`, `MayaFloatingToolbar`, `SelectionToolbar`, `3DViewerTopToolbar` |

### Schedule Components

| Component | Purpose |
|---|---|
| `Schedule.tsx` | Main schedule view with Gantt chart (`react-frappe-gantt`) |
| `Lookahead.tsx` | Lookahead schedule view |
| `LookaheadReport.tsx` | Printable lookahead report |
| `ScheduleCalendarView.tsx` | Calendar view (`react-big-calendar`) |
| `ScheduleListView.tsx` | List view of schedule activities |
| `ScheduleToolbar` | Schedule toolbar with controls |
| `ScheduleFilterPanel` | Filter panel for activities |
| `ActivityDetailDialog` | Detail dialog for a schedule activity |
| `ImportExportDialog` | Import/export schedule data |
| `RecoveryDialog` | Schedule recovery analysis dialog |
| `ResourceHistogram` | Resource usage histogram chart |
| `TrimbleSchedulingDialog` | Trimble scheduling integration dialog |
| `cpmEngine.ts` | Critical Path Method (CPM) calculation engine — computes ES, EF, LS, LF, TF, FF, and critical path for activity networks with FS/SS/FF/SF dependency types |

### Utility Components

| Component | Purpose |
|---|---|
| `OmniSearch` | Global omni-search with filters and QR scanner |
| `QrCodeScanner` | QR code scanning via camera (jsqr) |
| `DataTable` | Reusable data table component |
| `SearchNetworkGraph` | D3-based network graph for search results |
| `MapComponentProjectSettings` | Map view for project settings |
| `UserPopover` / `UserProfilePopover` | User profile and account popovers |
| `HelpPopover` | Help information popover |
| `Share` | Project sharing controls |
| `Avatar` | User avatar component |
| `AppLauncher` | Trimble product launcher (similar to app drawer) |
| `PageWrapper` | Standard page wrapper with padding/layout |
| `NoProjectSelected` | Empty state when no project is selected |
| `UserTestingDialog` | User testing feedback/consent dialog |
| `WeeklyReviewDialog` | Analytics weekly review dialog |
| `screenCapture` / `ScreenCaptureOverlay` | Screenshot capture + annotation overlay |

---

## AI & Assistant System

### Chat Assistant (Text)

- **API Route:** `POST /api/chat`
- **Model:** `gemini-2.0-flash` via Google's OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/`)
- **Streaming:** Yes — Server-Sent Events (SSE) with `ReadableStream`
- **Multimodal:** Supports image attachments (base64 `data:image/jpeg` URLs) alongside text
- **Temperature:** 0.7, **Max tokens:** 4096
- **Authentication:** Server-side `GEMINI_API_KEY` environment variable

### Live Multimodal API (Audio/Video)

- **Provider:** Google Multimodal Live API
- **Library:** Custom `multimodal-live-client.ts` + `LiveAPIContext`
- **Capabilities:** Real-time audio streaming, webcam video streaming, screen sharing
- **Audio Processing:** Web Audio API worklets (`audio-processing.ts`, `vol-meter.ts`)
- **Activation:** Only initialized when `NEXT_PUBLIC_GEMINI_API_KEY` is set; entire `LiveAPIWrapper` is conditionally rendered

### Assistant Context Features

- Open/close and expand/collapse the panel
- Center/dock positioning
- Message history (with timestamps and IDs)
- Mode switching: `"chat"` | `"collaborator"`
- Context-aware example questions that change based on the current page route
- Screenshot capture + annotation for visual context in prompts
- Voice input via browser Web Speech API
- Message feedback (thumbs up/down), copy to clipboard
- Screenshot storage to Supabase (or local in-memory fallback for POC)

---

## State Management & Contexts

| Context | State |
|---|---|
| `AssistantContext` | Assistant open/expanded/centered, messages, loading state, mode (`chat`/`collaborator`), example questions |
| `ProjectContext` | Currently selected project |
| `CollaboratorContext` | Collaborative session state |
| `LiveAPIContext` | Google Multimodal Live API connection state |

**Zustand** is used for additional global state (store logger utility in `lib/store-logger.ts`).

---

## Database (Supabase)

Supabase is used as the primary backend-as-a-service.

### Connection

```ts
// lib/supabase.ts
createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

The client is `null`-safe — if env vars are absent, the client is `null` and all DB calls gracefully skip (useful for POC/demo without a backend).

### Data Stored

| Data | Table / Mechanism |
|---|---|
| Folder permissions | `folder_permissions` table (see `FolderPermission` type) |
| User permissions | `entity_type` — `user`, `group`, or `default` |
| Screenshot captures | Supabase Storage bucket (or in-memory fallback) |
| Prompt captures | Supabase Storage bucket (or in-memory fallback) |

### Key Types

```ts
// lib/types.ts
FolderPermissionDB   // Full DB row with user/group metadata
SelectedEntity       // UI selection state for permission management
User                 // { id, name, email, avatar? }
Group                // { id, name, description, classification }

// lib/supabase.ts
FolderPermission     // Simplified DB row for folder access control
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/chat` | `POST` | Streams AI chat responses from Gemini 2.0 Flash. Accepts `{ messages, imageData? }`. Returns SSE stream. |
| `/api/liveblocks-auth` | `POST` | Authenticates a Liveblocks session. Returns a signed token for real-time collaboration. Assigns a random user name and avatar from a preset list. |

---

## Third-Party Integrations

| Integration | Usage |
|---|---|
| **Trimble Connect** | Document storage, model files, TFLX layout survey files, Property Sets sync for Progress Tracking |
| **Google Maps** | Geospatial viewport in 3D viewer, project location map in settings |
| **Google Gemini** | AI chat assistant (text), Multimodal Live API (audio/video streaming) |
| **Liveblocks** | Real-time collaboration — shared cursors, collaborative sessions |
| **Supabase** | Database (PostgreSQL), file storage |
| **Resend** | Transactional email sending |
| **PostHog** | Product analytics and session recording |
| **Microsoft Clarity** | Session heatmaps and recordings |
| **ContentSquare** | User behavior analytics Tag SDK |
| **Trimble Modus** | Trimble's design system (`@trimble-oss/moduswebcomponents-react`) — shared Trimble UI components |
| **Trimble Connect Font** | Icon font loaded from `resources.connect.trimble.com` |
| **AWS Amplify** | CI/CD pipeline and hosting (`amplify.yml`) |

---

## Styling System

- **Tailwind CSS** is the primary styling approach (utility-first)
- **CSS Modules** used for component-scoped styles (`Avatar.module.css`, `index.module.css`)
- **SASS** available for complex stylesheets
- **shadcn/ui** component library with `components.json` configuration
- **Dark/Light theme** via `next-themes` — theme persisted in `localStorage`, applied via a `beforeInteractive` script to prevent flash
- **Trimble Modus design tokens** integrated via `ModusProviders`
- **Fonts:** Open Sans (Google Fonts) for the main typeface; Trimble Connect icon font loaded via CDN
- **Tailwind plugins:** `tailwindcss-animate`, `tailwind-scrollbar`, `@tailwindcss/typography`
- **Custom CSS variables** for semantic colors (background, foreground, border, etc.) that adapt to theme

---

## Help & Support System

Configured in `lib/projectsight/helpConfig.ts`.

### Commercial Environment

Gainsight widget handles help natively (no custom component needed).

### FedRAMP Environment

When `NEXT_PUBLIC_APP_ENV=fedramp`, the `NativeHelpMenu` component is rendered in the header instead of the Gainsight widget.

### Help Links

| Link | URL |
|---|---|
| The Network (Community) | `community.trimble.com/home` |
| Training | `trimblelearn.docebosaas.com` |
| Release Notes | `help.trimble.com/projectsight` |
| System Requirements | `help.trimble.com/projectsight` |
| Product Ideas | `trimble-projectsight.ideas.aha.io` |
| License Assignments | `help.trimble.com/projectsight` |
| API Documentation | `developer.trimble.com/projectsight` |
| Blog | `blog.trimble.com/construction` |
| Video Library | YouTube playlist |
| FAQs | `help.trimble.com/projectsight` |

### Contextual Help

`getOnlineHelpUrl(pathname)` maps the current page route to the matching documentation page on `help.trimble.com/projectsight`. Supported routes: `dashboard`, `drawings`, `documents`, `trimble-connect`, `schedule`, `photos`, `field-data`, `progress-tracking`, `rfis`, `budget`, `search`, `maintenance-windows`, `contact-support`.

---

## Data Models

### RFI

```ts
interface RFI {
  id: number;
  number: string;          // e.g. "001 - 100 Links"
  description: string;
  importance: "High" | "Normal" | "Low";
  dueDate: string;
  openAssignments: string; // e.g. "(1/1)"
  status: "Open" | "Closed" | "Draft";
  assignee: string | string[] | null;
}
```

### Progress Tracking Item

```ts
interface TrackingItem {
  id: number;
  name: string;
  category: string;        // "Discrete Items"
  floor: string;           // "L1", "L2", etc.
  zone: string;
  contract: string;
  sovItem: string;         // Schedule of Values line item
  planned: number;
  actual: number;
  unit: string;            // "EA", "LF", "SF"
  status: "on-track" | "behind" | "complete" | "not-started";
  lastUpdated: string;
  assignee: string;
}
```

### Field Work Item

```ts
interface FieldWorkItem {
  id: number;
  name: string;
  type: "layout-survey" | "qa-qc" | "survey-request" | "general";
  floor: string;
  zone: string;
  status: "complete" | "in-progress" | "pending" | "overdue";
  completedDate: string | null;
  dueDate: string;
  assignee: string;
  tflxLinked: boolean;    // synced from Trimble Connect TFLX files
  percentComplete: number;
}
```

### Property Set Item (Fabrication / Install Tracking)

```ts
interface PropertySetItem {
  id: number;
  component: string;
  discipline: string;
  floor: string;
  zone: string;
  fabricationStatus: "in-design" | "in-development" | "loaded-on-truck" | "delivered-to-site";
  installStatus: "arrived-on-site" | "install-in-progress" | "inspection" | "complete" | "not-started";
  model: string;          // e.g. "MEP-Model-v3.ifc"
  lastSync: string;
}
```

### Maintenance Window

```ts
interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startDate: string;       // ISO 8601
  endDate: string;
  status: "scheduled" | "in-progress" | "completed";
  affectedServices: string[];
  impact: "low" | "medium" | "high";
}
```

### CPM Activity (Schedule Engine)

```ts
interface CpmActivity {
  id: string;
  duration: number;
  start_date: string | null;
  parent_id: string | null;
}

interface CpmDependency {
  predecessor_id: string;
  successor_id: string;
  type: "FS" | "SS" | "FF" | "SF";
  lag: number;
}

interface CpmResult {
  isCritical: boolean;
  totalFloat: number;
  freeFloat: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
}
```

### Project / Portfolio

```ts
interface ProjectItem {
  id: string;
  name: string;
  subtitle?: string;       // Company name
  progress?: number;       // 0–100
  icon?: string;
}

interface PortfolioItem {
  id: string;
  name: string;
  projectIds: string[];
}
```

### Folder Permissions

```ts
interface FolderPermissionDB {
  id: string;
  folder_id: string;
  entity_id: string | null;
  entity_type: "user" | "group" | "default";
  access_level: "full-access" | "read-only" | "no-access";
  created_at?: string;
  updated_at?: string;
  user?: { id, name, email, avatar? };
  group?: { id, name, description };
  inherited?: boolean;
  overridden?: boolean;
  direct_file_permission?: boolean;
  inherited_from_folder?: boolean;
  inherit_from_parent?: boolean;
}
```

---

## Build, Dev & Deployment

### Scripts

```bash
npm run dev       # Start development server (next dev)
npm run build     # Production build (next build)
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Git Hooks (Husky)

Pre-commit hook runs `node scripts/update-changelog.js` automatically before each commit.

### Deployment

- Deployed on **AWS Amplify** (configuration in `amplify.yml`)
- Built with Next.js production build
- Console logs removed in production (`removeConsole: true` in `next.config.js`)
- Three.js transpiled via webpack babel-loader (required for `three/examples` imports)

### Key Config Files

| File | Purpose |
|---|---|
| `next.config.js` | Next.js config — webpack Three.js transpilation, console removal |
| `tailwind.config.ts` | Tailwind theme, plugins, content paths |
| `tsconfig.json` | TypeScript compiler options |
| `components.json` | shadcn/ui configuration |
| `liveblocks.config.ts` | Liveblocks room and storage type configuration |
| `middleware.ts` | Next.js middleware (likely auth/routing) |
| `amplify.yml` | AWS Amplify CI/CD pipeline definition |
| `.eslintrc.json` | ESLint rules (extends `next` config) |
| `postcss.config.mjs` | PostCSS with Tailwind |
