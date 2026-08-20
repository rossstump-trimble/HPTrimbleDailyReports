import { NextResponse } from "next/server";
import { answerDashboardQuestion } from "@/lib/dashboard/ask";
import { currentYearMonth, getDashboardPayload } from "@/lib/dashboard/enrich";

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

    const data = getDashboardPayload(projectId, month, asOf);
    const result = answerDashboardQuestion(question, data);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[dashboard/ask]", err);
    return NextResponse.json({ success: false, error: "Failed to answer" }, { status: 500 });
  }
}
