export type PunchStatus = 'open' | 'resolved' | 'closed' | 'reopened';
export type PunchImportance = 'low' | 'normal' | 'high' | 'urgent';
export type PunchAction = 'create' | 'resolve' | 'reinspect';

export interface PunchItem {
  id: string;
  projectId: string;
  itemNumber?: string;
  description: string;
  status: PunchStatus;
  tradeName: string;
  locationDescription: string;
  importance: PunchImportance;
  reportedDate?: string;
  dueDate?: string;
  confidence?: number;
  sourceScanUrl?: string;
  psPunchId?: string;
  resolutionNotes?: string;
}

export interface ExtractedPunchItem {
  tempId: string;
  action: PunchAction;
  targetItemNumber?: string;
  targetItemId?: string;
  description: string;
  tradeName: string;
  locationDescription: string;
  status: PunchStatus;
  importance: PunchImportance;
  confidence: number;
  notes?: string;
}

export interface PunchExtractResponse {
  success: boolean;
  sheetType: 'new_defects' | 'back_punch' | 'mixed';
  items: ExtractedPunchItem[];
  rawText?: string;
  error?: string;
}

export interface PunchCommitActionItem {
  action: PunchAction;
  targetItemId?: string;
  targetItemNumber?: string;
  item?: Partial<PunchItem>;
  notes?: string;
}

export interface PunchCommitRequest {
  items: PunchCommitActionItem[];
}

export interface PunchCommitResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  items: PunchItem[];
  errors: string[];
}
