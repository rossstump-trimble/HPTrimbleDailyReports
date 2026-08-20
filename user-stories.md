# ProjectSight — User Stories & Backlog

> **Product:** Trimble ProjectSight  
> **Last updated:** March 25, 2026  
> **Status:** Draft — Pending Story Expansion & NFR Review

---

## Table of Contents

1. [Backlog Summary](#backlog-summary)
2. [Epic 1 — Field Data Capture](#epic-1--field-data-capture)
3. [Epic 2 — AI-Powered Estimation](#epic-2--ai-powered-estimation)
4. [Epic 3 — Pricing Review & Finalization](#epic-3--pricing-review--finalization)
5. [Epic 4 — Approval Workflow & Notifications](#epic-4--approval-workflow--notifications)
6. [Epic 5 — ERP Integration & Compliance](#epic-5--erp-integration--compliance)
7. [Story Detail Notes](#story-detail-notes)
8. [Design Gaps & Open Questions](#design-gaps--open-questions)

---

## Backlog Summary

| Metric | Value |
|---|---|
| Total Stories | 16 |
| Total Story Points | 81 |
| High Priority | 12 |
| Medium Priority | 3 |
| Low Priority | 1 |

### Points by Epic

| Epic | Stories | Points |
|---|---|---|
| Epic 1 — Field Data Capture | 3 | 16 |
| Epic 2 — AI-Powered Estimation | 3 | 16 |
| Epic 3 — Pricing Review & Finalization | 3 | 13 |
| Epic 4 — Approval Workflow & Notifications | 3 | 13 |
| Epic 5 — ERP Integration & Compliance | 4 | 26 |

---

## Epic 1 — Field Data Capture

**Goal:** Enable Superintendents to capture and submit field deviations in under 60 seconds, even with limited connectivity.

---

### US-1: Voice-to-Text Field Capture

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 5 |
| **Role** | Superintendent |
| **Status** | `[ ]` Not Started |

**Story:** As a Superintendent, I want to record voice memos of site deviations so that I can document issues without manual typing.

**Acceptance Criteria:**

- [ ] Superintendent can activate voice recording from the field capture screen on mobile
- [ ] Speech-to-text transcription populates the deviation description field in real time
- [ ] Full field submission (voice + photo + metadata) completes in < 60 seconds
- [ ] VTT integration handles common construction terminology accurately
- [ ] Mobile UI is optimized for one-handed, gloved operation

**Notes:**
- Critical for meeting the <60s submission goal
- Requires VTT integration and mobile UI

---

### US-2: Multi-Photo Metadata Tagging

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 3 |
| **Role** | Superintendent |
| **Status** | `[ ]` Not Started |

**Story:** As a Superintendent, I want photos to automatically include GPS and timestamps so that my site records are verifiable.

**Acceptance Criteria:**

- [ ] Photos captured in-app embed GPS coordinates in EXIF metadata
- [ ] Timestamps are applied automatically at capture time
- [ ] Multiple photos can be attached to a single field report
- [ ] Metadata is visible in the photo detail view for audit purposes

**Notes:**
- Essential for auditability
- Standard mobile sensor integration

---

### US-3: Offline Sync & Caching

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 8 |
| **Role** | Superintendent |
| **Status** | `[ ]` Not Started |

**Story:** As a Superintendent, I want my data to cache locally and sync when I have service so that I can work in low-connectivity areas.

**Acceptance Criteria:**

- [ ] Field data is persisted to local storage immediately upon entry
- [ ] Background sync executes automatically when connectivity is restored
- [ ] Conflict resolution handles overlapping edits gracefully
- [ ] User receives visual confirmation of pending vs. synced records
- [ ] No data loss occurs during network transitions

**Notes:**
- Significant architectural effort for data integrity
- Core requirement for field reliability

---

## Epic 2 — AI-Powered Estimation

**Goal:** Use AI to accelerate cost estimation by auto-mapping CSI codes and generating L/M/E pricing from historical data.

---

### US-4: Automated CSI Code Mapping

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 5 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want the AI to suggest CSI cost codes based on field descriptions so that I don't have to search the database manually.

**Acceptance Criteria:**

- [ ] AI suggests top-3 CSI codes ranked by confidence from free-text field descriptions
- [ ] PM can accept a suggestion or search/override manually
- [ ] Mapping accuracy meets or exceeds 80% on test corpus
- [ ] Response time for suggestion is < 2 seconds

**Notes:**
- Direct mapping to FR2
- Medium complexity for NLP classification

---

### US-5: L/M/E Pricing Suggestions

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 8 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want AI-generated labor, material, and equipment rates so that I can build an estimate baseline instantly.

**Acceptance Criteria:**

- [ ] AI generates labor, material, and equipment rate suggestions per line item
- [ ] Pricing is derived from historical project data with recency weighting
- [ ] AI pricing is generated in < 5 seconds (NFR target)
- [ ] Each rate shows source data lineage (which projects informed the rate)
- [ ] PM can accept, modify, or reject each rate independently

**Notes:**
- Core AI functionality using historical data
- High complexity for multi-variable pricing

---

### US-6: Estimation Confidence Scoring

| Field | Value |
|---|---|
| **Priority** | Medium |
| **Points** | 3 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want to see a confidence score for AI suggestions so that I can prioritize which line items need a closer review.

**Acceptance Criteria:**

- [ ] Each AI suggestion displays a confidence percentage (0–100%)
- [ ] Visual indicator (color/icon) differentiates High / Medium / Low confidence
- [ ] Low-confidence items are flagged for mandatory PM review
- [ ] Confidence methodology is documented and explainable

**Notes:**
- Visual indicator for PM trust
- Logical extension of the pricing engine

---

## Epic 3 — Pricing Review & Finalization

**Goal:** Provide PMs with a workspace to validate, adjust, and finalize AI-generated estimates before submission.

---

### US-7: Pricing Review Interface

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 5 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want a workspace to accept or reject AI line items so that I can finalize the change order for the owner.

**Acceptance Criteria:**

- [ ] PM can view all AI-generated line items in a structured table
- [ ] Each line item has Accept / Reject / Edit actions
- [ ] Bulk actions are available (accept all, reject all)
- [ ] Change order total updates in real time as items are accepted or modified
- [ ] Finalized CO can be exported or routed for approval

**Notes:**
- Required for the "Human-in-the-Loop" safety check
- Standard CRUD/UI work

---

### US-8: Historical Comparison Widget

| Field | Value |
|---|---|
| **Priority** | Medium |
| **Points** | 5 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want to see pricing from similar past projects so that I can validate the current estimate against historical margins.

**Acceptance Criteria:**

- [ ] Widget displays "Similar Projects" with count and relevance score
- [ ] Historical pricing breakdown (L/M/E) is shown side-by-side with current estimate
- [ ] PM can drill into individual historical projects for detail
- [ ] Margin variance is calculated and highlighted when outside tolerance

**Notes:**
- Data-intensive UI component
- High value for risk mitigation

---

### US-9: Manual Pricing Overrides

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 3 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want to manually edit rates and hours so that I can correct any AI inaccuracies before submission.

**Acceptance Criteria:**

- [ ] PM can edit labor rates, material costs, equipment rates, and hours per line item
- [ ] System tracks the delta between AI suggestion and manual override
- [ ] Override history is logged for audit trail
- [ ] Overridden items are visually distinguished from AI-accepted items

**Notes:**
- Mandatory for financial control
- Logic needed to track "delta" vs. AI suggestion

---

## Epic 4 — Approval Workflow & Notifications

**Goal:** Automate change order routing and follow-ups to reduce approval cycle time to < 7 days.

---

### US-10: Automated Approval Routing

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 5 |
| **Role** | Project Admin |
| **Status** | `[ ]` Not Started |

**Story:** As a Project Admin, I want change orders to route automatically based on project logic so that the right stakeholders are notified.

**Acceptance Criteria:**

- [ ] Routing rules are configurable per project (dollar thresholds, role-based)
- [ ] Notifications fire automatically when a CO enters a new approval stage
- [ ] Escalation paths are defined for overdue approvals
- [ ] Routing configuration is editable by Project Admins without developer support

**Notes:**
- Foundation for Epic 4 workflow
- Requires logic-based notification engine

---

### US-11: AI Agent Nudges

| Field | Value |
|---|---|
| **Priority** | Medium |
| **Points** | 5 |
| **Role** | AI Agent |
| **Status** | `[ ]` Not Started |

**Story:** As an AI Agent, I want to send persistent SMS/Email follow-ups to owners so that stagnant approvals are accelerated.

**Acceptance Criteria:**

- [ ] AI sends escalating follow-ups (email, then SMS) on a configurable cadence
- [ ] Nudge messages include a "risk impact" statement (e.g., "Delaying this will impact the electrical schedule by 3 days")
- [ ] Owner can approve directly from the nudge (deep link or inline action)
- [ ] Nudge history is logged and visible on the approval dashboard
- [ ] Opt-out / do-not-disturb settings are respected

**Notes:**
- Key driver for reducing cycle time to <7 days
- Integration with external messaging APIs (SMS gateway, email service)

---

### US-12: Approval Stage Dashboard

| Field | Value |
|---|---|
| **Priority** | Low |
| **Points** | 3 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want to see "Days in Stage" for all pending COs so that I can identify where the bottleneck is occurring.

**Acceptance Criteria:**

- [ ] Dashboard displays all pending COs with current stage and days elapsed
- [ ] Color-coded indicators flag COs approaching or exceeding SLA thresholds
- [ ] PM can filter by project, stage, or assignee
- [ ] Click-through navigates to the CO detail for action

**Notes:**
- Visual reporting for process health
- Low complexity data visualization

---

## Epic 5 — ERP Integration & Compliance

**Goal:** Establish bi-directional sync with ERPs (Procore, Sage) and ensure full audit compliance for financial data.

---

### US-13: ERP Bi-directional Sync

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 13 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want data to sync between our platform and the ERP (Procore/Sage) so that I avoid double data entry.

**Acceptance Criteria:**

- [ ] Cost codes and project structures are pulled from ERP into ProjectSight
- [ ] Approved CO totals are pushed back to the ERP
- [ ] Sync runs on a configurable schedule and supports manual trigger
- [ ] Sync failures are retried with exponential backoff and surfaced to the user
- [ ] Data mapping is configurable per ERP connector

**Notes:**
- High complexity due to external API dependencies
- Mandatory for FR5 compliance
- Covers bi-directional nature: pulling codes from ERP, pushing totals to ERP

---

### US-14: Prime Contract Automated Update

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 5 |
| **Role** | PM |
| **Status** | `[ ]` Not Started |

**Story:** As a PM, I want the Prime Contract in the ERP to update upon CO approval so that our financial reporting is always accurate.

**Acceptance Criteria:**

- [ ] Upon CO approval, the Prime Contract value in the ERP is updated automatically
- [ ] Write-back success is confirmed and logged
- [ ] Failure triggers a retry and alerts the PM
- [ ] A rollback mechanism exists if the ERP rejects the update

**Notes:**
- Direct financial impact
- Logic required to ensure write-back success

---

### US-15: OAuth2/SSO Security

| Field | Value |
|---|---|
| **Priority** | High |
| **Points** | 5 |
| **Role** | IT Admin |
| **Status** | `[ ]` Not Started |

**Story:** As an IT Admin, I want secure authentication for ERP integrations so that our financial data remains protected.

**Acceptance Criteria:**

- [ ] ERP connections authenticate via OAuth2 / SSO (no stored passwords)
- [ ] Token refresh is handled automatically without user intervention
- [ ] Access scopes are minimized to required data only (principle of least privilege)
- [ ] Authentication events are logged for security audit

**Notes:**
- Compliance and security requirement
- Standard integration effort

---

### US-16: Financial Audit Trail

| Field | Value |
|---|---|
| **Priority** | Medium |
| **Points** | 3 |
| **Role** | Controller |
| **Status** | `[ ]` Not Started |

**Story:** As a Controller, I want a full log of every state change and sync event so that we can pass financial audits.

**Acceptance Criteria:**

- [ ] Every CO state transition is logged with timestamp, actor, and before/after values
- [ ] ERP sync events (success, failure, retry) are recorded
- [ ] Audit log is immutable (append-only)
- [ ] Log is searchable and exportable for audit review
- [ ] Retention policy meets regulatory requirements

**Notes:**
- Supports FR6
- Database logging and UI view

---

## Story Detail Notes

| Story | Key Detail |
|---|---|
| **US-1** (VTT) | Focuses on the speech-to-text pipeline on mobile. Key AC: Superintendent can submit in < 60 seconds. |
| **US-5** (Pricing) | Leverages the historical engine for L/M/E rates. NFR target: AI pricing generated in < 5 seconds. |
| **US-8** (Historical Widget) | Surfaces "Similar Projects" counts (e.g., Building C) for PM margin validation. |
| **US-11** (AI Nudges) | Requires "risk impact" statements in nudge text (e.g., "Delaying this will impact the electrical schedule by 3 days"). |
| **US-13** (ERP Sync) | Bi-directional: pulls codes from ERP, pushes totals to ERP. |

---

## Design Gaps & Open Questions

| # | Area | Question | Status |
|---|---|---|---|
| 1 | Sync Error Handling | What is the UX for a Superintendent if a background sync fails after they leave the site? | `[ ]` Open |
| 2 | External Owner Access | US-11 mentions "Nudges," but how does the Owner actually view the CO summary? Is there a lightweight web view, or is the summary purely within the email/attachment? | `[ ]` Open |
| 3 | CSI Code Versioning | Does the system support multiple versions of CSI codes (2004 vs. 2016) or custom internal codes? | `[ ]` Open |
| 4 | Trimble NFRs | Are there Trimble- or product-specific NFRs that should apply to this epic or product? | `[ ]` Open |
