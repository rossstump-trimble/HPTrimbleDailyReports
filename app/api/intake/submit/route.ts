import { NextResponse } from 'next/server';
import { getCapacityStatus, upsertDailyReport, CapacityLimitError } from '@/lib/store';
import { saveUpload } from '@/lib/upload-store';
import { backupIngestedDaily, type IngestedFileAttachment } from '@/lib/ingest-backup';
import type { DailyReport } from '@/types/hpproto';
import { slugTradePartnerId } from '@/lib/trade-partner';

export const runtime = 'nodejs';

async function dailyFromFormData(form: FormData): Promise<Partial<DailyReport> & { files?: File[]; file?: File }> {
  const rawFiles = [
    ...form.getAll('files'),
    ...form.getAll('file'),
  ].filter((f): f is File => f instanceof File);
  const files = Array.from(new Set(rawFiles));
  const file = files[0];

  const dailyRaw = form.get('daily');
  if (typeof dailyRaw === 'string' && dailyRaw.trim()) {
    const parsed = JSON.parse(dailyRaw) as Partial<DailyReport>;
    return { ...parsed, files, file };
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
    files,
    file,
  };
}

export async function POST(req: Request) {
  try {
    const capacity = getCapacityStatus();
    if (capacity.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `System capacity limit of ${capacity.max} daily reports reached. New submissions are locked.`,
          locked: true,
        },
        { status: 429 },
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let body: Partial<DailyReport>;
    let files: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const parsed = await dailyFromFormData(await req.formData());
      files = parsed.files || (parsed.file ? [parsed.file] : []);
      body = parsed;
    } else {
      body = (await req.json()) as Partial<DailyReport>;
    }

    const { projectId, date } = body;
    const tradePartnerName = (body.tradePartnerName ?? '').trim();
    const tradePartnerId =
      body.tradePartnerId?.trim() || (tradePartnerName ? slugTradePartnerId(tradePartnerName) : '');

    if (!projectId || !tradePartnerId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, company name, date' },
        { status: 400 },
      );
    }

    const id = body.id ?? `${projectId}-${tradePartnerId}-${date}-${Date.now()}`;
    let rawSourcePath = body.rawSourcePath;
    let rawSourceFileName = body.rawSourceFileName;
    let rawSourceFiles = body.rawSourceFiles ? [...body.rawSourceFiles] : [];

    if (files.length > 0) {
      const attachments = [];
      for (const f of files) {
        const fileBytes = Buffer.from(await f.arrayBuffer());
        const savedPath = saveUpload(id, f.name, fileBytes);
        attachments.push({
          fileName: f.name,
          filePath: savedPath,
          fileSize: f.size,
          mimeType: f.type || 'image/jpeg',
          uploadedAt: new Date().toISOString(),
        });
      }
      rawSourceFiles = attachments;
      rawSourceFileName = attachments.map((a) => a.fileName).join(', ');
      rawSourcePath = attachments[0].filePath;
    }

    const report: DailyReport = {
      id,
      projectId,
      tradePartnerId,
      tradePartnerName: tradePartnerName || body.tradePartnerName || '',
      date,
      submittedAt: new Date().toISOString(),
      submittedBy: body.submittedBy || 'Field Intake',
      locationDescription: body.locationDescription ?? '',
      workerCount: body.workerCount ?? 0,
      totalHours: body.totalHours ?? 0,
      crewBreakdown: body.crewBreakdown ?? [],
      tierSubcontractors: body.tierSubcontractors ?? [],
      tierSubsSummary: body.tierSubsSummary ?? '',
      equipment: body.equipment ?? [],
      notes: body.notes ?? '',
      tradesAndFavors: body.tradesAndFavors ?? '',
      isHpEmployee: body.isHpEmployee ?? false,
      staCompleted: body.staCompleted ?? false,
      emailRecipients: body.emailRecipients ?? [],
      rawSourceFileName,
      rawSourcePath,
      rawSourceFiles: rawSourceFiles.length > 0 ? rawSourceFiles : undefined,
      approvalStatus: 'pending',
    };

    try {
      const fileAttachments: IngestedFileAttachment[] = [];
      for (const f of files) {
        fileAttachments.push({
          name: f.name,
          buffer: Buffer.from(await f.arrayBuffer()),
        });
      }
      backupIngestedDaily(report, fileAttachments);
    } catch (backupErr) {
      console.warn('[submit] disaster recovery backup failed', backupErr);
    }

    let saved: DailyReport;
    try {
      saved = upsertDailyReport(report);
    } catch (e) {
      if (e instanceof CapacityLimitError) {
        return NextResponse.json(
          { success: false, error: e.message, locked: true },
          { status: 429 },
        );
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      report: saved,
      status: 'pending_review',
      message: 'Daily report received and queued for review.',
    });
  } catch (err) {
    console.error('[intake/submit]', err);
    return NextResponse.json({ success: false, error: 'Submit failed' }, { status: 500 });
  }
}
