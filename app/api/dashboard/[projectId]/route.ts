import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentYearMonth, getDashboardPayload, loadSourceReports, type SourceDailyReport } from "@/lib/dashboard/enrich";
import { listDailyReports } from "@/lib/projectsight/client";
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from "@/lib/projectsight/destination";
import { SESSION_COOKIE } from "@/lib/local-session";
import { tidAccessTokenFromCookie } from "@/lib/projectsight/session-token";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ?? currentYearMonth();
    const asOfParam = searchParams.get("asOf");
    const asOf = asOfParam ? new Date(`${asOfParam}T12:00:00`) : new Date();

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: "Invalid month format. Expected YYYY-MM" },
        { status: 400 },
      );
    }

    const jar = cookies();
    const token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
    const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
    const psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
    const psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;

    let realReports: SourceDailyReport[] = [];

    // 1. Fetch live ProjectSight reports if authenticated
    if (token && psPortfolioId && psProjectId) {
      try {
        const rawPsReports = await listDailyReports(token, psPortfolioId, psProjectId);
        if (Array.isArray(rawPsReports) && rawPsReports.length > 0) {
          realReports = rawPsReports.map((r, idx) => {
            const dateStr = String(r.Date || r.ReportDate || r.DateCreated || "").slice(0, 10);
            return {
              dailyReportId: Number(r.DailyReportID ?? r.DailyReportId ?? r.Id ?? idx + 1),
              guid: String(r.DailyReportID ?? r.DailyReportId ?? r.Id ?? `ps-${idx}`),
              date: dateStr || new Date().toISOString().slice(0, 10),
              hours: Number(r.TotalHours || r.Hours || null),
              workflow: String(r.WorkflowStateName || r.Status || "Closed"),
              projectId: Number(psProjectId) || 1025,
              createdAt: String(r.DateCreated || r.CreatedAt || new Date().toISOString()),
              createdBy: String(r.CreatedBy || r.Author || "field@company.com"),
              createdByName: String(r.CreatedByName || r.Trade || r.Company || "Trade Partner"),
            };
          });
        }
      } catch (psErr) {
        console.error("[dashboard] failed to list live PS reports, falling back to local/cached", psErr);
      }
    }

    // 2. Include local store reports for this project
    const store = getStore();
    const localReports = store.dailyReports.filter(
      (r) => r.projectId.toLowerCase() === projectId.toLowerCase(),
    );
    for (const lr of localReports) {
      realReports.push({
        dailyReportId: Math.abs(lr.id.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)),
        guid: lr.id,
        date: lr.date,
        hours: lr.totalHours || null,
        workflow: lr.approvalStatus === "approved" ? "Approved" : "Pending Review",
        projectId: Number(psProjectId) || 1025,
        createdAt: lr.submittedAt,
        createdBy: lr.submittedBy || "field@trade.com",
        createdByName: lr.tradePartnerName,
      });
    }

    const payload = getDashboardPayload(projectId, month, asOf, realReports);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[dashboard]", err);
    return NextResponse.json(
      { success: false, error: "Failed to build dashboard" },
      { status: 500 },
    );
  }
}
