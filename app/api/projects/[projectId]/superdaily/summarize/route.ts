import { NextResponse } from 'next/server';
import { getProjectById, getStore } from '@/lib/store';
import { synthesizeSuperdaily } from '@/lib/superdaily';
import { cookies } from 'next/headers';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import { SESSION_COOKIE } from '@/lib/local-session';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { listDailyReports } from '@/lib/projectsight/client';
import type { DailyReport } from '@/types/hpproto';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const date = String(body.date || '').trim();

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

    // Attempt live ProjectSight lookup if authenticated
    try {
      const jar = cookies();
      const token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      const psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      const psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;

      if (token && psPortfolioId && psProjectId) {
        const livePs = await listDailyReports(token, psPortfolioId, psProjectId);
        if (Array.isArray(livePs)) {
          for (const raw of livePs) {
            const rDate = String(raw.Date || raw.ReportDate || '').slice(0, 10);
            if (rDate !== date) continue;

            const psId = String(raw.DailyReportID ?? raw.DailyReportId ?? raw.Id ?? '');
            if (mergedReports.some((r) => r.projectSightDailyId === psId)) continue;

            const works = Array.isArray(raw.DailyWorks) ? (raw.DailyWorks as Record<string, unknown>[]) : [];
            const tradeName = works[0]?.Trade ?? works[0]?.Company ?? 'ProjectSight Trade';
            mergedReports.push({
              id: `ps-${psId}`,
              projectId,
              tradePartnerId: String(tradeName).toLowerCase().replace(/\s+/g, '-'),
              tradePartnerName: String(tradeName),
              date,
              submittedAt: new Date().toISOString(),
              locationDescription: String(works[0]?.LocationDescription ?? 'Site General'),
              workerCount: Number(raw.TotalWorkersApproved ?? raw.TotalWorkersUnapproved ?? 1) || 1,
              totalHours: Number(raw.TotalWorkApproved ?? raw.TotalWorkUnapproved ?? 8) || 8,
              crewBreakdown: [],
              equipment: [],
              notes: String(raw.Notes ?? raw.GeneralNotes ?? works[0]?.Description ?? ''),
              staCompleted: true,
              emailRecipients: [],
              projectSightDailyId: psId,
            });
          }
        }
      }
    } catch {
      // Fallback cleanly to local store
    }

    const superdaily = await synthesizeSuperdaily(projectId, project.name, date, mergedReports);

    return NextResponse.json({
      success: true,
      report: superdaily,
      reportsCount: mergedReports.length,
    });
  } catch (err) {
    console.error('[superdaily/summarize] failed', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate superdaily' },
      { status: 500 },
    );
  }
}
