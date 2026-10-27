import { NextResponse } from 'next/server';
import { deleteDailyReport, getDailyReportById } from '@/lib/store';
import { requireAuthResponse } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { dailyId: string } },
) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const { dailyId } = params;
    const report = getDailyReportById(dailyId);
    if (!report) {
      return NextResponse.json({ error: 'Daily report not found' }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    console.error('[api/dailyreports] GET failed', err);
    return NextResponse.json({ error: 'Failed to get daily report' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { dailyId: string } },
) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const { dailyId } = params;
    const deleted = deleteDailyReport(dailyId);
    if (!deleted) {
      return NextResponse.json({ error: 'Daily report not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: dailyId });
  } catch (err) {
    console.error('[api/dailyreports] DELETE failed', err);
    return NextResponse.json({ error: 'Failed to delete daily report' }, { status: 500 });
  }
}
