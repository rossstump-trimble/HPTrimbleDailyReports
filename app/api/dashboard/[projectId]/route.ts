import { NextResponse } from "next/server";
import { currentYearMonth, getDashboardPayload } from "@/lib/dashboard/enrich";

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

    const payload = getDashboardPayload(projectId, month, asOf);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[dashboard]", err);
    return NextResponse.json(
      { success: false, error: "Failed to build dashboard" },
      { status: 500 },
    );
  }
}
