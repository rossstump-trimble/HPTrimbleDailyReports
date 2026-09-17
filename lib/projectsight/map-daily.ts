import type { NormalizedWeather } from '@/lib/weather-service';
import type { TierSubcontractor } from '@/types/hpproto';
import { parseEquipmentItem, lookupConditionsId, lookupCompany } from './ps-lookups';

export interface Fog617Capture {
  tradePartnerName?: string;
  submittedBy?: string;
  date?: string;
  locationDescription?: string;
  workerCount?: number;
  totalHours?: number;
  crewBreakdown?: { craft: string; count: number; hoursPerWorker?: number; totalHours?: number }[];
  tierSubcontractors?: TierSubcontractor[];
  tierSubsSummary?: string;
  equipment?: string[];
  notes?: string;
  tradesAndFavors?: string;
  isHpEmployee?: boolean;
  staCompleted?: boolean;
  staFiles?: { fileName: string; filePath: string }[];
}

const TITLE_MAX = 120;

export function buildDailyTitle(capture: Fog617Capture): string {
  const trade = (capture.tradePartnerName || '').trim();
  const location = (capture.locationDescription || '').trim();
  const details = [trade, location].filter(Boolean).join(' — ');
  const rawTitle = details ? `[AI Generated] ${details}` : '[AI Generated] Daily Report';
  return rawTitle.length > TITLE_MAX ? `${rawTitle.slice(0, TITLE_MAX - 1)}…` : rawTitle;
}

export function buildDailyNarrative(capture: Fog617Capture): string {
  const crew = (capture.crewBreakdown ?? [])
    .filter((row) => row.craft)
    .map((row) => `${row.craft} (${row.count})`)
    .join('; ');
  const tierSubs =
    (capture.tierSubcontractors ?? []).length > 0
      ? (capture.tierSubcontractors ?? [])
          .map((s) => `${s.name} (${s.count} workers${s.trade ? ` · ${s.trade}` : ''})`)
          .join('; ')
      : capture.tierSubsSummary?.trim() || 'None';
  const equipment = (capture.equipment ?? []).filter(Boolean).join(', ');
  const trade = (capture.tradePartnerName || '').trim();
  const lines = [
    `Trade partner: ${trade || '—'}`,
    `Location / work: ${capture.locationDescription?.trim() || '—'}`,
    `Headcount: ${capture.workerCount ?? 0}`,
    `Total hours: ${capture.totalHours ?? 0}`,
    `Crew: ${crew || '—'}`,
    `Tier subcontractors: ${tierSubs}`,
    `Equipment: ${equipment || '—'}`,
    `STA completed: ${capture.staCompleted ? 'yes' : 'no'}`,
    capture.tradesAndFavors ? `Trades & favors: ${capture.tradesAndFavors}` : '',
    `Notes: ${capture.notes?.trim() || '—'}`,
  ].filter(Boolean);
  return lines.join('\n');
}

export function mapFog617ToProjectSightBody(
  capture: Fog617Capture,
  weather?: NormalizedWeather,
): Record<string, unknown> {
  const title = buildDailyTitle(capture);
  const narrative = buildDailyNarrative(capture);
  const trade = (capture.tradePartnerName || '').trim();
  const location = (capture.locationDescription || '').trim();
  const effectiveLocation = location || 'Jobsite';
  const notes = (capture.notes || '').trim();

  const company = lookupCompany(trade);

  // Crew breakdown & real quantities
  const crew = capture.crewBreakdown ?? [];
  const workerCount = capture.workerCount ?? (crew.reduce((sum, r) => sum + (r.count || 0), 0) || 1);
  const totalHours = capture.totalHours ?? (workerCount * 8);
  const hoursPerWorker =
    workerCount > 0 && totalHours > 0
      ? Math.round((totalHours / workerCount) * 10) / 10
      : totalHours > 0
        ? totalHours
        : 8;

  // Equipment parsing & records
  const equipmentList = (capture.equipment ?? []).filter(Boolean);
  const equipmentRecords = equipmentList.map((eq) => {
    const lookedUp = parseEquipmentItem(eq);
    const qty = lookedUp.quantity || 1.0;
    const hrs = hoursPerWorker || 8.0;
    return {
      EquipmentItemID: lookedUp.id,
      EquipmentItem: lookedUp.name,
      Description: lookedUp.name,
      Name: lookedUp.name,
      Quantity: qty,
      Hours: hrs,
      TotalHours: qty * hrs,
      Location: effectiveLocation,
      ...(company ? { CompanyID: company.id } : {}),
      CompanyName: trade || company?.name || '',
      Company: trade || company?.name || '',
      Notes: '',
    };
  });

  const totalEquipmentQty = equipmentRecords.reduce((sum, e) => sum + Number(e.Quantity || 0), 0);
  const totalEquipmentHours = equipmentRecords.reduce((sum, e) => sum + Number(e.TotalHours || 0), 0);

  const crewSummary =
    crew.length > 0
      ? crew.map((row) => `${row.craft} (${row.count})`).join(', ')
      : `${workerCount} workers`;

  // Comprehensive work description covering location, crew, hours, equipment, STA, and notes
  const workDescriptionLines = [
    location ? `Location / Work: ${location}` : '',
    `Crew: ${crewSummary}`,
    `Total Hours: ${totalHours} hrs (${hoursPerWorker} hrs/worker)`,
    equipmentList.length > 0 ? `Equipment on Site: ${equipmentList.join(', ')}` : '',
    `STA Safety Completed: ${capture.staCompleted ? 'Yes' : 'No'}`,
    capture.tradesAndFavors ? `Trades & Favors / Trade Assistance: ${capture.tradesAndFavors}` : '',
    notes ? `Field Notes / Delays: ${notes}` : '',
  ].filter(Boolean);

  const workDescription = workDescriptionLines.join('\n\n') || narrative || 'Daily work completed';

  // 1. DailyWorks (Work Performed section in ProjectSight)
  // Only include CompanyID if it exists in the ProjectSight portfolio registry.
  // Passing an arbitrary CompanyID without a matching portfolio company causes ProjectSight to reject:
  // "Company X for Labor ... is invalid or has been deleted."
  const dailyWorksItem: Record<string, unknown> = {
    ...(company ? { CompanyID: company.id } : {}),
    CompanyName: trade || company?.name || 'Trade Partner',
    Company: trade || company?.name || 'Trade Partner',
    Trade: trade || company?.name || 'Trade Partner',
    TradePartner: trade || company?.name || 'Trade Partner',
    WorkDescription: workDescription,
    Description: workDescription,
    WorkPerformed: location || workDescription,
    Workers: workerCount,
    WorkerCount: workerCount,
    ManpowerQty: totalHours,
    HoursPerDay: hoursPerWorker,
    TotalWork: totalHours,
    Status: 'Approved',
    StatusID: 69,
    DetailLevel: 'BasicWithWorkers',
    Location: effectiveLocation,
    LocationDescription: effectiveLocation,
    Notes: notes || '',
  };

  const dateVal = capture.date || '';
  const weatherNotes =
    weather?.weatherNotes ||
    (notes ? `Weather: ${weather?.conditions || 'Partly Cloudy'}` : 'Partly Cloudy, 75°F, Humidity 40%, Wind 5 mph');
  const conditionsId = lookupConditionsId(weather?.conditions);

  const weathersList = [
    {
      ConditionsID: conditionsId,
      Conditions: weather?.conditions || 'Partly Cloudy',
      Temp: weather?.temp ?? 75,
      Temperature: weather?.temp ?? 75,
      Humidity: weather?.humidity ?? 40,
      WindVelocity: weather?.windVelocity ?? 5,
      WindSpeed: weather?.windVelocity ?? 5,
      Precipitation: weather?.rainfall ?? 0.0,
      Rainfall: weather?.rainfall ?? 0.0,
      Gusts: 0,
      UOM: 'Imperial',
      EndTime: '17:00:00',
      Location: weather?.weathers?.[0]?.Location || 'Wichita, KS',
      IsCurrent: true,
      IsAutomated: true,
    },
  ];

  return {
    Date: dateVal,
    ReportDate: dateVal,
    DateCreated: dateVal ? `${dateVal}T00:00:00Z` : '',
    Subject: title,
    Title: title,
    Name: title,
    Description: narrative,
    Notes: notes || narrative,
    GeneralNotes: notes || narrative,
    SiteNotes: notes || narrative,
    Summary: narrative,
    WorkPerformed: effectiveLocation || narrative,
    Location: effectiveLocation,
    LocationDescription: effectiveLocation,
    WeatherNotes: weatherNotes,
    WeatherUOM: 'Imperial',
    TotalRainfall: weather?.rainfall ?? 0.0,
    TotalSnowfall: weather?.snowfall ?? 0.0,
    TotalWorkApproved: totalHours,
    TotalWorkersApproved: workerCount,
    TotalWorkUnapproved: 0.0,
    TotalWorkersUnapproved: 0.0,
    TotalEquipmentQty: totalEquipmentQty,
    TotalEquipmentHours: totalEquipmentHours,
    TotalEquipmentRecords: equipmentRecords.length,
    DailyWorks: [dailyWorksItem],
    Works: [dailyWorksItem],
    EquipmentRecords: equipmentRecords,
    Equipment: equipmentRecords,
    DailyEquipment: equipmentRecords,
    Weathers: weathersList,
    RecordComments: [{ Comments: narrative }],
  };
}
