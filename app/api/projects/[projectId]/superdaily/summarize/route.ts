import { NextResponse } from 'next/server';
import { getProjectById, getStore } from '@/lib/store';
import { synthesizeSuperdaily } from '@/lib/superdaily';
import { fetchWeatherForDate } from '@/lib/weather-service';
import { cookies } from 'next/headers';
import { getValidTidAccessToken, tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import { SESSION_COOKIE } from '@/lib/local-session';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { listDailyReports, listProjectLocations } from '@/lib/projectsight/client';
import type { DailyReport } from '@/types/hpproto';
import type { MissingTradePartner, SuperdailyWeather } from '@/types/superdaily';

export const runtime = 'nodejs';

function extractLocationName(rawLocation: unknown): string {
  if (!rawLocation) return '';
  if (typeof rawLocation === 'string') return rawLocation.trim();
  if (typeof rawLocation === 'object') {
    const locObj = rawLocation as Record<string, unknown>;
    return String(
      locObj.Name ?? locObj.Description ?? locObj.Path ?? locObj.Title ?? '',
    ).trim();
  }
  return '';
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const date = String(body.date || '').trim();
    const locationFilter = String(body.location || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    const store = getStore();
    const localReports = store.dailyReports.filter(
      (r) => r.projectId.toLowerCase() === projectId.toLowerCase() && r.date === date,
    );

    const mergedReports: DailyReport[] = [...localReports];
    const discoveredLocations = new Set<string>();

    // Collect locations from all local reports for this project so the dropdown has known project locations
    for (const r of store.dailyReports) {
      if (r.projectId.toLowerCase() === projectId.toLowerCase() && r.locationDescription?.trim()) {
        discoveredLocations.add(r.locationDescription.trim());
      }
    }

    // Attempt live ProjectSight lookup if authenticated
    try {
      const jar = cookies();
      const tokenRes = await getValidTidAccessToken(jar.get(SESSION_COOKIE)?.value);
      const token = tokenRes.token || tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      const psPortfolioId = project.psPortfolioId || dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      const psProjectId = project.psProjectId || dest.projectId || DEFAULT_DESTINATION.projectId;

      if (token && psPortfolioId && psProjectId) {
        const [livePs, psLocations] = await Promise.all([
          listDailyReports(token, psPortfolioId, psProjectId).catch(() => []),
          listProjectLocations(token, psPortfolioId, psProjectId).catch(() => []),
        ]);

        for (const loc of psLocations) {
          if (loc.name?.trim()) {
            discoveredLocations.add(loc.name.trim());
          }
        }

        if (Array.isArray(livePs)) {
          for (const raw of livePs) {
            const rDate = String(raw.Date || raw.ReportDate || '').slice(0, 10);
            const rawTopLoc = extractLocationName(raw.Location ?? raw.LocationDescription);
            if (rawTopLoc) discoveredLocations.add(rawTopLoc);

            const works = Array.isArray(raw.DailyWorks) ? (raw.DailyWorks as Record<string, unknown>[]) : [];
            for (const w of works) {
              const wLoc = extractLocationName(w.Location ?? w.LocationDescription);
              if (wLoc) discoveredLocations.add(wLoc);
            }

            if (rDate !== date) continue;

            const psId = String(raw.DailyReportID ?? raw.DailyReportId ?? raw.Id ?? '');
            if (mergedReports.some((r) => r.projectSightDailyId === psId)) continue;

            if (works.length > 0) {
              const reportWorkers = Number(raw.TotalWorkersApproved ?? raw.TotalWorkersUnapproved ?? 0) || 0;
              const reportHours = Number(raw.TotalWorkApproved ?? raw.TotalWorkUnapproved ?? 0) || 0;
              for (let idx = 0; idx < works.length; idx++) {
                const w = works[idx];
                const tradeName = String(w.CompanyName ?? w.Trade ?? w.Company ?? 'ProjectSight Trade').trim();
                const workLocation =
                  extractLocationName(w.Location ?? w.LocationDescription) ||
                  rawTopLoc ||
                  'Site General';
                const rowWorkers =
                  Number(w.Workers ?? w.WorkerCount ?? 0) ||
                  (works.length === 1 ? reportWorkers : 0);
                const rowHours =
                  Number(w.TotalWork ?? w.ManpowerQty ?? 0) ||
                  (works.length === 1 ? reportHours : rowWorkers * (Number(w.HoursPerDay) || 8));
                mergedReports.push({
                  id: `ps-${psId}-${idx}`,
                  projectId,
                  tradePartnerId: tradeName.toLowerCase().replace(/\s+/g, '-'),
                  tradePartnerName: tradeName,
                  date,
                  submittedAt: new Date().toISOString(),
                  locationDescription: workLocation,
                  workerCount: rowWorkers,
                  totalHours: rowHours,
                  crewBreakdown: [],
                  equipment: [],
                  notes: String(w.Notes ?? w.Description ?? raw.Notes ?? raw.GeneralNotes ?? ''),
                  staCompleted: true,
                  emailRecipients: [],
                  projectSightDailyId: psId,
                });
              }
            } else {
              const tradeName = String(raw.CompanyName ?? raw.Company ?? 'ProjectSight Trade').trim();
              mergedReports.push({
                id: `ps-${psId}`,
                projectId,
                tradePartnerId: tradeName.toLowerCase().replace(/\s+/g, '-'),
                tradePartnerName: tradeName,
                date,
                submittedAt: new Date().toISOString(),
                locationDescription: rawTopLoc || 'Site General',
                workerCount: Number(raw.TotalWorkersApproved ?? raw.TotalWorkersUnapproved ?? 1) || 1,
                totalHours: Number(raw.TotalWorkApproved ?? raw.TotalWorkUnapproved ?? 8) || 8,
                crewBreakdown: [],
                equipment: [],
                notes: String(raw.Notes ?? raw.GeneralNotes ?? ''),
                staCompleted: true,
                emailRecipients: [],
                projectSightDailyId: psId,
              });
            }
          }
        }
      }
    } catch {
      // Fallback cleanly to local store
    }

    for (const r of mergedReports) {
      if (r.locationDescription?.trim()) {
        discoveredLocations.add(r.locationDescription.trim());
      }
    }

    const availableLocations = Array.from(discoveredLocations).sort((a, b) => a.localeCompare(b));

    const reportsToSummarize =
      locationFilter && locationFilter.toLowerCase() !== 'all'
        ? mergedReports.filter((r) => {
            const loc = (r.locationDescription || 'Site General').trim().toLowerCase();
            const target = locationFilter.trim().toLowerCase();
            return loc === target;
          })
        : mergedReports;

    // 1. Fetch weather observations
    let weather: SuperdailyWeather | undefined;
    try {
      const normalizedWeather = await fetchWeatherForDate(date, project.lat, project.lon, project.name);
      weather = {
        temp: normalizedWeather.temp,
        tempMax: normalizedWeather.tempMax,
        tempMin: normalizedWeather.tempMin,
        conditions: normalizedWeather.conditions,
        humidity: normalizedWeather.humidity,
        windVelocity: normalizedWeather.windVelocity,
        rainfall: normalizedWeather.rainfall,
        snowfall: normalizedWeather.snowfall,
        weatherNotes: normalizedWeather.weatherNotes,
      };
    } catch (weatherErr) {
      console.warn('[superdaily] Weather fetch failed, proceeding without weather', weatherErr);
    }

    // 2. Cross-reference bowling sheet active trade partners against all submitted reports for the date
    const excludedSet = new Set((project.excludedTradePartnerIds || []).map((x) => x.toLowerCase()));
    const expectedPartners = (project.tradePartners || []).filter(
      (tp) =>
        !excludedSet.has(tp.id.toLowerCase()) &&
        !excludedSet.has(tp.name.toLowerCase()),
    );

    const submittedTradeIds = new Set(mergedReports.map((r) => r.tradePartnerId.toLowerCase()));
    const submittedTradeNames = new Set(mergedReports.map((r) => r.tradePartnerName.toLowerCase()));

    const missingTrades: MissingTradePartner[] = expectedPartners
      .filter(
        (tp) =>
          !submittedTradeIds.has(tp.id.toLowerCase()) &&
          !submittedTradeNames.has(tp.name.toLowerCase()),
      )
      .map((tp) => ({
        tradePartnerId: tp.id,
        tradePartnerName: tp.name,
        category: tp.category,
      }));

    const effectiveProjectName =
      locationFilter && locationFilter.toLowerCase() !== 'all'
        ? `${project.name} — ${locationFilter}`
        : project.name;

    const superdaily = await synthesizeSuperdaily(
      projectId,
      effectiveProjectName,
      date,
      reportsToSummarize,
      weather,
      missingTrades,
      expectedPartners.length || reportsToSummarize.length,
    );

    return NextResponse.json({
      success: true,
      report: superdaily,
      reportsCount: reportsToSummarize.length,
      availableLocations,
      activeLocation: locationFilter || 'all',
    });
  } catch (err) {
    console.error('[superdaily/summarize] failed', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate superdaily' },
      { status: 500 },
    );
  }
}
