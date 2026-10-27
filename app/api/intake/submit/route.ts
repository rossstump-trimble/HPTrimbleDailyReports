import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getCapacityStatus,
  upsertDailyReport,
  markDailySentToProjectSight,
  CapacityLimitError,
  getDailyReportById,
  getProjectById,
} from '@/lib/store';
import { saveUpload, readUpload } from '@/lib/upload-store';
import { backupIngestedDaily, type IngestedFileAttachment } from '@/lib/ingest-backup';
import type { DailyReport } from '@/types/hpproto';
import { slugTradePartnerId } from '@/lib/trade-partner';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE, parseVerifiedSession } from '@/lib/local-session';
import { isLocalAuthRequest } from '@/lib/auth-mode';
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
      (!contentType && typeof (req as unknown as { formData?: unknown }).formData === 'function');

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

    const targetProject = getProjectById(projectId);
    if (!targetProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    let isAuthedStaff = false;
    let sessionCookie: string | undefined;
    try {
      const jar = cookies();
      sessionCookie = jar.get(SESSION_COOKIE)?.value;
      const verified = parseVerifiedSession(sessionCookie);
      isAuthedStaff = verified !== null || isLocalAuthRequest(req);
    } catch {
      isAuthedStaff = isLocalAuthRequest(req);
    }

    // Only authenticated staff can submit HP employee direct reports or update existing report IDs
    const isHp = Boolean(body.isHpEmployee) && isAuthedStaff;
    if (body.isHpEmployee && !isAuthedStaff) {
      return NextResponse.json(
        { success: false, error: 'Authentication required for Hensel Phelps staff submissions.' },
        { status: 401 },
      );
    }

    const existingReport = body.id && isAuthedStaff ? getDailyReportById(body.id) : undefined;
    const id = existingReport
      ? existingReport.id
      : `${projectId}-${tradePartnerId}-${date}-${Date.now()}`;

    let rawSourcePath = existingReport?.rawSourcePath;
    let rawSourceFileName = existingReport?.rawSourceFileName;
    let rawSourceFiles = existingReport?.rawSourceFiles ? [...existingReport.rawSourceFiles] : [];

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

    let savedStaAttachments = existingReport?.staFiles ? [...existingReport.staFiles] : [];
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

    const report: DailyReport = {
      id,
      projectId,
      tradePartnerId,
      tradePartnerName: tradePartnerName || body.tradePartnerName || '',
      date,
      submittedAt: existingReport?.submittedAt || new Date().toISOString(),
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
      approvalStatus: isHp ? 'approved' : (existingReport?.approvalStatus || 'pending'),
    };

    try {
      const fileAttachments: IngestedFileAttachment[] = [];
      for (const f of files) {
        fileAttachments.push({
          name: f.name,
          buffer: Buffer.from(await f.arrayBuffer()),
        });
      }
      for (const sf of staFiles) {
        fileAttachments.push({
          name: `STA-${sf.name}`,
          buffer: Buffer.from(await sf.arrayBuffer()),
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

    let psDailyId: string | undefined = saved.projectSightDailyId;
    let psAttached: boolean | undefined;

    // If HP staff report and not already synced, dispatch directly to ProjectSight API
    if (isHp && !saved.projectSightDailyId) {
      try {
        const proj = getProjectById(projectId);
        let dest = DEFAULT_DESTINATION;
        try {
          const jar = cookies();
          dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
        } catch {
          // ignore outside request context
        }
        const portfolioId = proj?.psPortfolioId || dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
        const targetProjectId = proj?.psProjectId || dest.projectId || DEFAULT_DESTINATION.projectId;
        const { token } = await getValidTidAccessToken(sessionCookie);

        if (token && portfolioId && targetProjectId) {
          const filesToAttach = (saved.rawSourceFiles || [])
            .map((f) => {
              const fileData = readUpload(f.filePath);
              if (!fileData) return null;
              return {
                fileName: f.fileName,
                fileBytes: fileData,
                mimeType: f.mimeType,
                category: 'daily_capture' as const,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

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

    const clientReport = isAuthedStaff
      ? saved
      : {
          id: saved.id,
          projectId: saved.projectId,
          tradePartnerId: saved.tradePartnerId,
          tradePartnerName: saved.tradePartnerName,
          date: saved.date,
          submittedAt: saved.submittedAt,
          approvalStatus: saved.approvalStatus,
        };

    return NextResponse.json({
      success: true,
      report: clientReport,
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
