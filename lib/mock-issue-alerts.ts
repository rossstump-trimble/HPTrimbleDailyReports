import { IssueAlert } from "@/types/issue-alerts";

export const mockIssueAlerts: IssueAlert[] = [
  {
    id: "alert-001",
    alertTitle: "MEP Coordination Clash — HVAC Supply Over Structural Beam",
    severity: "critical",
    confidenceScore: 92,
    matchedSpecSection: "23 31 13",
    matchedDrawing: "M-401",
    rationale:
      "The current HVAC supply duct routing on drawing M-401 passes through the same elevation as the W12x26 beam at grid line C-4. An identical configuration on the Riverdale Office project caused a 3-week delay when the conflict was discovered during rough-in.",
    category: "MEP",
    historicalProject: "Riverdale Office Tower",
    historicalDate: "2024-06-15",
    rootCause:
      "HVAC duct routing was designed at the same elevation as a structural beam. No 3D coordination was performed before construction started.",
    suggestedResolution:
      "Route the supply duct below the beam with a vertical offset of 8 inches, or coordinate with structural to add a penetration sleeve. Run a clash detection report before proceeding.",
    costImpact: "$47,500",
    scheduleImpactDays: 15,
    status: "active",
  },
  {
    id: "alert-002",
    alertTitle: "Below-Grade Waterproofing Spec Mismatch",
    severity: "high",
    confidenceScore: 87,
    matchedSpecSection: "07 11 13",
    matchedDrawing: "A-102",
    rationale:
      "Spec section 07 11 13 calls for a sheet membrane system, but drawing A-102 detail 3 shows a fluid-applied waterproofing at the foundation wall. This same discrepancy on the Harbor Point project led to a costly RFI cycle and rework after the wrong material was installed.",
    category: "Envelope",
    historicalProject: "Harbor Point Condominiums",
    historicalDate: "2023-11-02",
    rootCause:
      "Specifications and architectural details were developed by different teams and never reconciled. The contractor followed the drawing detail instead of the spec.",
    suggestedResolution:
      "Issue an RFI to the architect to confirm which waterproofing system governs. Reconcile Spec 07 11 13 with Detail 3/A-102 before any below-grade work begins.",
    costImpact: "$32,000",
    scheduleImpactDays: 10,
    status: "active",
  },
  {
    id: "alert-003",
    alertTitle: "Fire Sprinkler Head Clearance Below Ceiling Grid",
    severity: "high",
    confidenceScore: 81,
    matchedSpecSection: "21 13 13",
    matchedDrawing: "FP-301",
    rationale:
      "The ceiling height on Level 3 leaves only 14 inches between the T-bar grid and the deck. Spec 21 13 13 requires pendant heads with a minimum 18-inch clearance for proper spray pattern. The Lakewood Medical project had the same tight plenum and required a complete sprinkler redesign.",
    category: "Fire Protection",
    historicalProject: "Lakewood Medical Center",
    historicalDate: "2024-01-20",
    rootCause:
      "Ceiling heights were reduced during value engineering but fire protection drawings were not updated to reflect the new plenum depth.",
    suggestedResolution:
      "Verify the as-designed plenum depth against NFPA 13 Table 8.6.4.1.1.1 clearance requirements. Consider switching to sidewall heads or recessed pendant heads if clearance is insufficient.",
    costImpact: "$28,000",
    scheduleImpactDays: 12,
    status: "active",
  },
  {
    id: "alert-004",
    alertTitle: "Structural Steel Connection Detail Missing for Moment Frame",
    severity: "medium",
    confidenceScore: 74,
    matchedSpecSection: "05 12 23",
    matchedDrawing: "S-201",
    rationale:
      "Drawing S-201 shows a welded moment connection at grid B-6, but no connection detail is provided in the structural detail sheets. On the Westfield Commerce project, a similar omission caused the steel fabricator to hold production for 4 weeks while awaiting an engineer's response.",
    category: "Structural",
    historicalProject: "Westfield Commerce Park",
    historicalDate: "2023-08-14",
    rootCause:
      "The structural engineer's detail sheet set was issued incomplete. The connection at B-6 was flagged for a future addendum that was never issued before bid.",
    suggestedResolution:
      "Submit an RFI requesting the moment connection detail for grid B-6. Flag for the steel fabricator to exclude this connection from the first shop drawing submission until the detail is confirmed.",
    costImpact: "$18,500",
    scheduleImpactDays: 20,
    status: "active",
  },
  {
    id: "alert-005",
    alertTitle: "Air Barrier Continuity Gap at Curtain Wall Transition",
    severity: "medium",
    confidenceScore: 68,
    matchedSpecSection: "07 27 00",
    matchedDrawing: "A-501",
    rationale:
      "The transition detail between the curtain wall system and the cast-in-place concrete spandrel on A-501 does not show how the air barrier membrane terminates. A similar gap on the Pinnacle Tower project resulted in air infiltration failures during commissioning.",
    category: "Envelope",
    historicalProject: "Pinnacle Tower",
    historicalDate: "2024-03-08",
    rootCause:
      "The curtain wall subcontractor's shop drawings did not address the air barrier transition, and the architect's detail assumed the curtain wall system would provide continuity — neither was verified.",
    suggestedResolution:
      "Request a joint detail review meeting between the curtain wall sub and the envelope consultant. Require a transition mock-up before full production.",
    costImpact: "$22,000",
    scheduleImpactDays: 8,
    status: "active",
  },
  {
    id: "alert-006",
    alertTitle: "Electrical Panel Working Clearance Violation",
    severity: "low",
    confidenceScore: 58,
    matchedSpecSection: "26 24 16",
    matchedDrawing: "E-201",
    rationale:
      "Panel LP-3A on drawing E-201 is located in a corridor with only 30 inches of clear space in front. NEC 110.26 requires 36 inches minimum. A similar placement on the Gateway Retail project required panel relocation after the AHJ rejected the installation.",
    category: "Electrical",
    historicalProject: "Gateway Retail Center",
    historicalDate: "2023-05-22",
    rootCause:
      "Panel location was coordinated with the architectural plan before the corridor width was reduced by a wall furring revision.",
    suggestedResolution:
      "Verify the corridor dimension at LP-3A against NEC 110.26(A) clearance requirements (36\" min). Relocate the panel or coordinate a wall revision to restore clearance before rough-in.",
    costImpact: "$8,500",
    scheduleImpactDays: 5,
    status: "active",
  },
  {
    id: "alert-007",
    alertTitle: "Roof Drain Sizing Undersized for Tributary Area",
    severity: "medium",
    confidenceScore: 71,
    matchedSpecSection: "22 14 23",
    matchedDrawing: "P-401",
    rationale:
      "The roof drain at area D on P-401 serves a tributary area of approximately 4,800 SF but is specified as a 4-inch drain. IPC Table 1106.2 requires a 6-inch drain for this area at the local rainfall rate. The Northgate project had an identical undersizing that led to ponding and a warranty claim.",
    category: "Plumbing",
    historicalProject: "Northgate Business Center",
    historicalDate: "2024-09-11",
    rootCause:
      "Plumbing engineer used a generic rainfall rate instead of the local jurisdiction's 100-year/1-hour rate, resulting in undersized drains across the roof.",
    suggestedResolution:
      "Verify the local rainfall intensity and recalculate drain sizing per IPC 1106.2. Upsize the drain at area D to 6 inches and check all other roof drains for the same issue.",
    costImpact: "$12,000",
    scheduleImpactDays: 6,
    status: "active",
  },
];
