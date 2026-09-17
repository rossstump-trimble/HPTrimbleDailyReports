export type InspectionItemResult = 'Pass' | 'Fail' | 'N/A' | 'Unchecked';

export interface InspectionChecklistItem {
  id: string;
  itemNumber: number;
  prompt: string;
  result: InspectionItemResult;
  comment?: string;
  confidence?: number;
  needsReview?: boolean;
}

export interface InspectionRecord {
  id: string;
  projectId: string;
  psRecordId?: string;
  number: string;
  title: string;
  location?: string;
  inspectorName?: string;
  date?: string;
  status: 'open' | 'in_review' | 'approved' | 'closed';
  items: InspectionChecklistItem[];
  sheetImageUrl?: string;
  source: 'projectsight' | 'upload';
  psSynced?: boolean;
  psSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedInspectionItem {
  itemNumber: number;
  prompt: string;
  result: InspectionItemResult;
  comment?: string;
  confidence: number;
  needsReview: boolean;
}

export interface InspectionExtractionResult {
  checklistNumber?: string;
  checklistGuid?: string;
  title?: string;
  inspectorName?: string;
  date?: string;
  items: ExtractedInspectionItem[];
  overallConfidence: number;
  rawVisionNotes?: string;
}
