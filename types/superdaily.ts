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

export interface SuperdailyWeather {
  temp: number;
  tempMax?: number;
  tempMin?: number;
  conditions: string;
  humidity: number;
  windVelocity: number;
  rainfall: number;
  snowfall: number;
  weatherNotes: string;
}

export interface MissingTradePartner {
  tradePartnerId: string;
  tradePartnerName: string;
  category?: string;
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
  weather?: SuperdailyWeather;
  executiveSummary: string;
  totalHeadcount: number;
  totalManHours: number;
  activeTradeCount: number;
  expectedTradeCount: number;
  missingTrades: MissingTradePartner[];
  tradeSummaries: TradeWorkSummary[];
  interTradeFavors?: TradeFavor[];
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
