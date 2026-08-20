export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "active" | "dismissed" | "converted_to_rfi" | "converted_to_issue";

export interface IssueAlert {
  id: string;
  alertTitle: string;
  severity: AlertSeverity;
  confidenceScore: number;
  matchedSpecSection: string;
  matchedDrawing: string;
  rationale: string;
  category: string;
  historicalProject: string;
  historicalDate: string;
  rootCause: string;
  suggestedResolution: string;
  costImpact: string;
  scheduleImpactDays: number;
  status: AlertStatus;
}
