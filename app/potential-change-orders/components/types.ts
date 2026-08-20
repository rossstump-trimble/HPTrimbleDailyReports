export interface PCOLineItem {
  id: number;
  itemNo: string;
  description: string;
  uom: string;
  estimate: number;
  proposed: number;
  approved: number;
  applied: number;
  appliedHours: number;
  budgetCode: string;
  allocation: string;
}

export interface PCO {
  id: number;
  number: string;
  title: string;
  category: string;
  reason: string;
  status: "Ready for Review" | "Approved" | "Approved (Locked)" | "Rejected";
  budgetEstimate: number;
  costEstimate: number;
  proposedAmount: number;
  approvedAmount: number;
  appliedAmount: number;
  notes: string;
  createDate: string;
  dueDate: string;
  approvedForBudget: boolean;
  requestedDays: number;
  approvedDays: number;
  importance: string;
  reference: string;
  location: string;
  linkedSpecifications: string;
  author: string;
  authorCompany: string;
  lineItems: PCOLineItem[];
}

export interface CSICodeSuggestion {
  code: string;
  title: string;
  confidence: number;
  matchReason: string;
}

export interface AISuggestion {
  costCode: string;
  costCodeTitle: string;
  description: string;
  laborRate: number;
  laborHours: number;
  materialCost: number;
  equipmentCost: number;
  total: number;
  confidence: number;
  source: string;
  sourceProjects: string[];
}

export interface SuggestionOverrides {
  laborRate?: number;
  laborHours?: number;
  materialCost?: number;
  equipmentCost?: number;
}

export type SuggestionStatus = "pending" | "accepted" | "rejected";

export interface HistoricalProject {
  name: string;
  date: string;
  similarItem: string;
  actualCost: number;
  variance: string;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  marginPercent: number;
}

export type EstimatePhase = "idle" | "analyzing" | "review";

export interface EstimateState {
  phase: EstimatePhase;
  statuses: Record<number, SuggestionStatus>;
  overrides: Record<number, SuggestionOverrides>;
  editingRow: number | null;
  selectedCSI: string | null;
}
