import { NextResponse } from 'next/server';
import { upsertDailyReport } from '@/lib/store';
import { saveUpload } from '@/lib/upload-store';
import type { DailyReport } from '@/types/hpproto';

export const runtime = 'nodejs';

async function dailyFromFormData(form: FormData): Promise<Partial<DailyReport> & { file?: File }> {
  const file = form.get('file');
  const dailyRaw = form.get('daily');
  if (typeof dailyRaw === 'string' && dailyRaw.trim()) {
    const parsed = JSON.parse(dailyRaw) as Partial<DailyReport>;
    return { ...parsed, file: file instanceof File ? file : undefined };
  }
  return {
    projectId: String(form.get('projectId') || ''),
    tradePartnerId: String(form.get('tradePartnerId') || ''),
    tradePartnerName: String(form.get('tradePartnerName') || ''),
    date: String(form.get('date') || ''),
    locationDescription: String(form.get('locationDescription') || ''),
    workerCount: Number(form.get('workerCount') || 0),
    totalHours: Number(form.get('totalHours') || 0),
    notes: String(form.get('notes') || ''),
    staCompleted: String(form.get('staCompleted') || '') === 'true',
    file: file instanceof File ? file : undefined,
  };
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: Partial<DailyReport>;
    let file: File | undefined;

    if (contentType.includes('multipart/form-data')) {
      const parsed = await dailyFromFormData(await req.formData());
      file = parsed.file;
      body = parsed;
    } else {
      body = (await req.json()) as Partial<DailyReport>;
    }

    const { projectId, tradePartnerId, date } = body;

    if (!projectId || !tradePartnerId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, tradePartnerId, date' },
        { status: 400 },
      );
    }

    const id = body.id ?? `${projectId}-${tradePartnerId}-${date}-${Date.now()}`;
    let rawSourcePath = body.rawSourcePath;
    let rawSourceFileName = body.rawSourceFileName;
    if (file) {
      const bytes = Buffer.from(await file.arrayBuffer());
      rawSourceFileName = file.name;
      rawSourcePath = saveUpload(id, file.name, bytes);
    }

    const report: DailyReport = {
      id,
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
      rawSourceFileName,
      rawSourcePath,
    };

    const saved = upsertDailyReport(report);
    return NextResponse.json({ success: true, report: saved });
  } catch (err) {
    console.error('[intake/submit]', err);
    return NextResponse.json({ success: false, error: 'Submit failed' }, { status: 500 });
  }
}
