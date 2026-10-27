import { NextResponse } from "next/server";
import { answerDashboardQuestion } from "@/lib/dashboard/ask";
import { currentYearMonth, getDashboardPayload, type SourceDailyReport } from "@/lib/dashboard/enrich";
import { getProjectById, getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = (await req.json()) as { question?: string; month?: string; asOf?: string };
    const question = body.question?.trim() ?? "";
    const month = body.month ?? currentYearMonth();
    const asOf = body.asOf ? new Date(`${body.asOf}T12:00:00`) : new Date();

    if (!question) {
      return NextResponse.json({ success: false, error: "Question is required" }, { status: 400 });
    }

    const project = getProjectById(projectId);
    const store = getStore();
    const localReports: SourceDailyReport[] = store.dailyReports
      .filter((r) => r.projectId.toLowerCase() === projectId.toLowerCase())
      .map((lr) => ({
        dailyReportId: Math.abs(
          lr.id.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0),
        ),
        guid: lr.id,
        date: lr.date,
        hours: lr.totalHours ?? null,
        workflow: lr.approvalStatus === "approved" ? "Approved" : "Pending Review",
        projectId: Number(project?.psProjectId) || 1025,
        createdAt: lr.submittedAt,
        createdBy: lr.submittedBy || "field@trade.com",
        createdByName: lr.tradePartnerName,
      }));

    const data = getDashboardPayload(projectId, month, asOf, localReports);
    const result = answerDashboardQuestion(question, data);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[dashboard/ask]", err);
    return NextResponse.json({ success: false, error: "Failed to answer" }, { status: 500 });
  }
}
