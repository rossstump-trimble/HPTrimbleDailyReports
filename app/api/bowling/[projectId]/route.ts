import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBowlingMatrix, getProjectById } from '@/lib/store';
import { listDailyReports } from '@/lib/projectsight/client';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { getValidTidAccessToken, tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import { slugTradePartnerId } from '@/lib/trade-partner';
import type { DailyReport } from '@/types/hpproto';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    const workingDaysParam = searchParams.get('workingDays');

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: 'Invalid month format. Expected YYYY-MM' },
        { status: 400 },
      );
    }

    let workingDaysOverride: number[] | undefined;
    if (workingDaysParam) {
      workingDaysOverride = workingDaysParam
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
    }

    const project = getProjectById(projectId);
  const jar = cookies();
  const tokenRes = await getValidTidAccessToken(jar.get(SESSION_COOKIE)?.value);
  const token = tokenRes.token || tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
    const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
    const psPortfolioId = project?.psPortfolioId || dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
    const psProjectId = project?.psProjectId || dest.projectId || DEFAULT_DESTINATION.projectId;

    const liveReports: DailyReport[] = [];

    // If authenticated, load live daily reports from ProjectSight in memory for the matrix
    if (token && psPortfolioId && psProjectId) {
      try {
        const rawPsReports = await listDailyReports(token, psPortfolioId, psProjectId);
        if (Array.isArray(rawPsReports) && rawPsReports.length > 0) {
          const excludedSet = new Set((project?.excludedTradePartnerIds || []).map((x) => x.toLowerCase()));
          const existingPartners = (project?.tradePartners ? [...project.tradePartners] : []).filter(
            (tp) =>
              !excludedSet.has(tp.id.toLowerCase()) &&
              !excludedSet.has(tp.name.toLowerCase()) &&
              !excludedSet.has(slugTradePartnerId(tp.name)),
          );

          for (const raw of rawPsReports) {
            const dateStr = String(raw.Date || raw.ReportDate || '').slice(0, 10);
            if (!dateStr || !dateStr.startsWith(month)) continue;

            const works = Array.isArray(raw.DailyWorks) ? (raw.DailyWorks as Record<string, unknown>[]) : [];
            const psDailyId = String(raw.DailyReportID ?? raw.DailyReportId ?? raw.Id ?? '');
            const reportWorkers = Number(raw.TotalWorkersApproved ?? raw.TotalWorkersUnapproved ?? 0) || 0;
            const reportHours = Number(raw.TotalWorkApproved ?? raw.TotalWorkUnapproved ?? 0) || 0;

            if (works.length > 0) {
              for (let wIdx = 0; wIdx < works.length; wIdx++) {
                const w = works[wIdx];
                const companyName = String(w.CompanyName || w.Company || w.Trade || w.TradePartner || '').trim();
                if (!companyName) continue;
                if (excludedSet.has(companyName.toLowerCase()) || excludedSet.has(slugTradePartnerId(companyName).toLowerCase())) {
                  continue;
                }

                const tp = existingPartners.find(
                  (p) => p.name.toLowerCase() === companyName.toLowerCase(),
                ) ?? {
                  id: slugTradePartnerId(companyName),
                  name: companyName,
                  category: String(w.Trade || 'Trade Partner'),
                };

                const rowWorkers =
                  Number(w.Workers ?? w.WorkerCount ?? 0) ||
                  (works.length === 1 ? reportWorkers : 0);
                const rowHours =
                  Number(w.TotalWork ?? w.ManpowerQty ?? 0) ||
                  (works.length === 1 ? reportHours : rowWorkers * (Number(w.HoursPerDay) || 8));

                liveReports.push({
                  id: `ps-${psDailyId}-${tp.id}-${wIdx}`,
                  projectId,
                  tradePartnerId: tp.id,
                  tradePartnerName: tp.name,
                  date: dateStr,
                  submittedAt: String(raw.WhenCreated || raw.DateCreated || new Date().toISOString()),
                  submittedBy: String(raw.CreatedByDisplayName || raw.CreatedBy || 'ProjectSight'),
                  locationDescription: String(w.Description || w.Location || ''),
                  workerCount: rowWorkers,
                  totalHours: rowHours,
                  crewBreakdown: [],
                  equipment: [],
                  notes: String(w.Notes || raw.WeatherNotes || ''),
                  staCompleted: true,
                  emailRecipients: [],
                  approvalStatus: 'approved',
                  projectSightDailyId: psDailyId,
                  projectSightPortfolioId: psPortfolioId,
                  projectSightProjectId: psProjectId,
                  sentToProjectSightAt: String(raw.WhenCreated || new Date().toISOString()),
                });
              }
            } else {
              const companyName = String(raw.CompanyName || raw.Company || 'General Contractor').trim();
              if (excludedSet.has(companyName.toLowerCase()) || excludedSet.has(slugTradePartnerId(companyName).toLowerCase())) {
                continue;
              }
              const tp = existingPartners.find(
                (p) => p.name.toLowerCase() === companyName.toLowerCase(),
              ) ?? {
                id: slugTradePartnerId(companyName),
                name: companyName,
                category: 'General',
              };

              liveReports.push({
                id: `ps-${psDailyId}-${tp.id}`,
                projectId,
                tradePartnerId: tp.id,
                tradePartnerName: tp.name,
                date: dateStr,
                submittedAt: String(raw.WhenCreated || raw.DateCreated || new Date().toISOString()),
                submittedBy: String(raw.CreatedByDisplayName || raw.CreatedBy || 'ProjectSight'),
                locationDescription: String(raw.WeatherNotes || ''),
                workerCount: reportWorkers,
                totalHours: reportHours,
                crewBreakdown: [],
                equipment: [],
                notes: String(raw.WeatherNotes || ''),
                staCompleted: true,
                emailRecipients: [],
                approvalStatus: 'approved',
                projectSightDailyId: psDailyId,
                projectSightPortfolioId: psPortfolioId,
                projectSightProjectId: psProjectId,
                sentToProjectSightAt: String(raw.WhenCreated || new Date().toISOString()),
              });
            }
          }
        }
      } catch (psErr) {
        console.error('[bowling] live PS sync error', psErr);
      }
    }

    const matrix = getBowlingMatrix(projectId, month, undefined, workingDaysOverride, liveReports);
    return NextResponse.json(matrix);
  } catch (err) {
    console.error('[bowling]', err);
    return NextResponse.json({ success: false, error: 'Failed to build bowling matrix' }, { status: 500 });
  }
}
