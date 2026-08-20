import { NextResponse } from 'next/server';
import { upsertDailyReport } from '@/lib/store';
import type { DailyReport } from '@/types/hpproto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<DailyReport>;
    const { projectId, tradePartnerId, date } = body;

    if (!projectId || !tradePartnerId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, tradePartnerId, date' },
        { status: 400 },
      );
    }

    const report: DailyReport = {
      id: body.id ?? `${projectId}-${tradePartnerId}-${date}-${Date.now()}`,
      projectId,
      tradePartnerId,
      tradePartnerName: body.tradePartnerName ?? '',
      date,
      submittedAt: new Date().toISOString(),
      submittedBy: body.submittedBy,
      locationDescription: body.locationDescription ?? '',
      workerCount: body.workerCount ?? 0,
      totalHours: body.totalHours ?? 0,
      crewBreakdown: body.crewBreakdown ?? [],
      equipment: body.equipment ?? [],
      notes: body.notes ?? '',
      staCompleted: body.staCompleted ?? false,
      emailRecipients: body.emailRecipients ?? [],
      rawSourceFileName: body.rawSourceFileName,
    };

    const saved = upsertDailyReport(report);
    return NextResponse.json({ success: true, report: saved });
  } catch (err) {
    console.error('[intake/submit]', err);
    return NextResponse.json({ success: false, error: 'Submit failed' }, { status: 500 });
  }
}
