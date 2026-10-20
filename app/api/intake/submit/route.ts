import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCapacityStatus, upsertDailyReport, markDailySentToProjectSight, CapacityLimitError } from '@/lib/store';
import { saveUpload, readUpload } from '@/lib/upload-store';
import { backupIngestedDaily, type IngestedFileAttachment } from '@/lib/ingest-backup';
import type { DailyReport } from '@/types/hpproto';
import { slugTradePartnerId } from '@/lib/trade-partner';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { getValidTidAccessToken } from '@/lib/projectsight/session-token';
import { sendFog617ToProjectSight } from '@/lib/projectsight/send-daily';
import { captureFromDailyReport } from '@/lib/projectsight/send-intake-daily';

export const runtime = 'nodejs';

type IntakeFormData = Omit<Partial<DailyReport>, 'staFiles' | 'rawSourceFiles'> & {
  files?: File[];
  file?: File;
  staFiles?: File[];
};

async function dailyFromFormData(form: FormData): Promise<IntakeFormData> {
  const rawFiles = [
    ...form.getAll('files'),
    ...form.getAll('file'),
  ].filter((f): f is File => f instanceof File);
  const files = Array.from(new Set(rawFiles));
  const file = files[0];

  const rawStaFiles = [
    ...form.getAll('staFiles'),
    ...form.getAll('staFile'),
  ].filter((f): f is File => f instanceof File);
  const staFiles = Array.from(new Set(rawStaFiles));

  const dailyRaw = form.get('daily');
  if (typeof dailyRaw === 'string' && dailyRaw.trim()) {
    const parsed = JSON.parse(dailyRaw) as Record<string, unknown>;
    const { files: _f, staFiles: _sf, ...rest } = parsed;
    return { ...rest, files, file, staFiles } as IntakeFormData;
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
    staFiles,
  } as IntakeFormData;
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
    let staFiles: File[] = [];

    const isMultipart =
      contentType.includes('multipart/form-data') ||
      (!contentType && typeof (req as any).formData === 'function');

    if (isMultipart) {
      const parsed = await dailyFromFormData(await req.formData());
      files = parsed.files || (parsed.file ? [parsed.file] : []);
      staFiles = parsed.staFiles || [];
      const { staFiles: _sf, files: _f, file: _fi, ...reportFields } = parsed;
      body = reportFields;
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
          category: 'daily_capture' as const,
        });
      }
      rawSourceFiles = attachments;
      rawSourceFileName = attachments.map((a) => a.fileName).join(', ');
      rawSourcePath = attachments[0].filePath;
    }

    let savedStaAttachments = body.staFiles ? [...body.staFiles] : [];
    if (staFiles.length > 0) {
      const staAttachments = [];
      for (const f of staFiles) {
        const fileBytes = Buffer.from(await f.arrayBuffer());
        const savedPath = saveUpload(id, `STA-${f.name}`, fileBytes);
        staAttachments.push({
          fileName: f.name,
          filePath: savedPath,
          fileSize: f.size,
          mimeType: f.type || 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          category: 'sta_form' as const,
        });
      }
      savedStaAttachments = staAttachments;
    }

    const isHp = Boolean(body.isHpEmployee);

    const report: DailyReport = {
      id,
      projectId,
      tradePartnerId,
      tradePartnerName: tradePartnerName || body.tradePartnerName || '',
      date,
      submittedAt: new Date().toISOString(),
      submittedBy: body.submittedBy || (isHp ? 'HP Staff' : 'Field Intake'),
      locationDescription: body.locationDescription ?? '',
      workerCount: isHp ? 0 : (body.workerCount ?? 0),
      totalHours: isHp ? 0 : (body.totalHours ?? 0),
      crewBreakdown: isHp ? [] : (body.crewBreakdown ?? []),
      tierSubcontractors: body.tierSubcontractors ?? [],
      tierSubsSummary: body.tierSubsSummary ?? '',
      equipment: body.equipment ?? [],
      notes: body.notes ?? '',
      tradesAndFavors: body.tradesAndFavors ?? '',
      isHpEmployee: isHp,
      staCompleted: isHp ? true : (savedStaAttachments.length > 0 || body.staCompleted || false),
      staFiles: isHp ? undefined : (savedStaAttachments.length > 0 ? savedStaAttachments : undefined),
      emailRecipients: body.emailRecipients ?? [],
      rawSourceFileName,
      rawSourcePath,
      rawSourceFiles: rawSourceFiles.length > 0 ? rawSourceFiles : undefined,
      approvalStatus: isHp ? 'approved' : 'pending',
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

    let psDailyId: string | undefined;
    let psAttached: boolean | undefined;

    // If HP staff report, dispatch directly to ProjectSight API without requiring superintendent approval
    if (isHp) {
      try {
        const jar = cookies();
        const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
        const portfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
        const targetProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;
        const sessionCookie = jar.get(SESSION_COOKIE)?.value;
        const { token } = await getValidTidAccessToken(sessionCookie);

        if (token && portfolioId && targetProjectId) {
          const filesToAttach = (saved.rawSourceFiles || []).map((f) => {
            const fileData = readUpload(f.filePath);
            return {
              fileName: f.fileName,
              fileBytes: fileData || Buffer.from(''),
              mimeType: f.mimeType,
              category: 'daily_capture' as const,
            };
          });

          const capture = captureFromDailyReport(saved);
          const psResult = await sendFog617ToProjectSight({
            token,
            portfolioId,
            projectId: targetProjectId,
            capture,
            files: filesToAttach.length > 0 ? filesToAttach : undefined,
            fileName: filesToAttach[0]?.fileName,
            fileBytes: filesToAttach[0]?.fileBytes,
          });

          if (psResult.projectSightDailyId) {
            psDailyId = psResult.projectSightDailyId;
            psAttached = psResult.attached;
            const stamped = markDailySentToProjectSight(saved.id, {
              projectSightDailyId: psResult.projectSightDailyId,
              projectSightPortfolioId: portfolioId,
              projectSightProjectId: targetProjectId,
              sentToProjectSightAt: new Date().toISOString(),
            });
            if (stamped) {
              saved = stamped;
            }
          }
        }
      } catch (psErr) {
        console.warn('[intake/submit] direct HP dispatch error', psErr);
      }
    }

    return NextResponse.json({
      success: true,
      report: saved,
      status: isHp ? 'approved' : 'pending_review',
      autoApproved: isHp,
      projectSightDailyId: psDailyId,
      attached: psAttached,
      message: isHp
        ? (psDailyId ? `HP daily approved and synced to ProjectSight #${psDailyId}.` : 'HP daily approved.')
        : 'Daily report received and queued for review.',
    });
  } catch (err) {
    console.error('[intake/submit]', err);
    return NextResponse.json({ success: false, error: 'Submit failed' }, { status: 500 });
  }
}
