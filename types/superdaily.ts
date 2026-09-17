export type TradeFavorType =
  | 'equipment_sharing'
  | 'material_handling'
  | 'access_handover'
  | 'manpower_assist'
  | 'general';

export interface TradeFavor {
  providingTrade: string;
  receivingTrade: string;
  description: string;
  type: TradeFavorType;
}

export interface TradeWorkSummary {
  tradePartnerId: string;
  tradePartnerName: string;
  category?: string;
  workerCount: number;
  totalHours: number;
  locationDescription: string;
  workPerformed: string;
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
  executiveSummary: string;
  totalHeadcount: number;
  totalManHours: number;
  activeTradeCount: number;
  tradeSummaries: TradeWorkSummary[];
  interTradeFavors: TradeFavor[];
  delaysAndRoadblocks: string[];
  safetyAndStas: SuperdailySafety;
  weatherSummary?: string;
}

export interface SuperdailySummarizeRequest {
  date: string; // YYYY-MM-DD
}

export interface SuperdailySummarizeResponse {
  success: boolean;
  report?: SuperdailyReport;
  reportsCount: number;
  error?: string;
}
