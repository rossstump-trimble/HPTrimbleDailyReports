import crypto from 'crypto';
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
import type { CrewEntry, DailyReport, TierSubcontractor } from '@/types/hpproto';
import { slugTradePartnerId } from '@/lib/trade-partner';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { getRequestAuthContext } from '@/lib/api-auth';
import { getValidTidAccessToken } from '@/lib/projectsight/session-token';
import { sendFog617ToProjectSight } from '@/lib/projectsight/send-daily';
import { captureFromDailyReport } from '@/lib/projectsight/send-intake-daily';

export const runtime = 'nodejs';

const MAX_UPLOAD_FILES = 10;
const MAX_UPLOAD_BYTES_PER_FILE = 15 * 1024 * 1024; // 15 MB
const MAX_UPLOAD_BYTES_TOTAL = 35 * 1024 * 1024; // 35 MB
const MAX_CREW_ROWS = 30;
const MAX_TIER_SUBS = 30;
const MAX_EQUIPMENT_ITEMS = 40;
const MAX_EMAIL_RECIPIENTS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function sanitizeCrewBreakdown(raw: unknown): CrewEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_CREW_ROWS)
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .map((r) => ({
      craft: sanitizeText(r.craft, 80) || 'Craft',
      count: Math.max(0, Math.min(1000, Number(r.count) || 0)),
      hoursPerWorker:
        r.hoursPerWorker != null
          ? Math.max(0, Math.min(24, Number(r.hoursPerWorker) || 0))
          : undefined,
      totalHours:
        r.totalHours != null
          ? Math.max(0, Math.min(24000, Number(r.totalHours) || 0))
          : undefined,
    }));
}

function sanitizeTierSubcontractors(raw: unknown): TierSubcontractor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_TIER_SUBS)
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .map((s) => ({
      name: sanitizeText(s.name, 120),
      count: Math.max(0, Math.min(1000, Number(s.count ?? s.workerCount) || 0)),
      trade: sanitizeText(s.trade, 80) || undefined,
    }))
    .filter((s) => s.name.length > 0);
}

function sanitizeEquipment(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_EQUIPMENT_ITEMS)
    .map((e) => sanitizeText(e, 120))
    .filter(Boolean);
}

function sanitizeEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_EMAIL_RECIPIENTS)
    .map((e) => sanitizeText(e, 160).toLowerCase())
    .filter((e) => EMAIL_RE.test(e));
}

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
    if (dailyRaw.length > 200_000) {
      throw new Error('Daily payload exceeds maximum allowed size');
    }
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

    const projectId = sanitizeText(body.projectId, 120);
    const date = sanitizeText(body.date, 10);
    const tradePartnerName = sanitizeText(body.tradePartnerName, 160);
    const tradePartnerId =
      sanitizeText(body.tradePartnerId, 120) ||
      (tradePartnerName ? slugTradePartnerId(tradePartnerName) : '');

    if (!projectId || !tradePartnerId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required fields: projectId, company name, date (YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    if (files.length + staFiles.length > MAX_UPLOAD_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_UPLOAD_FILES} files allowed per submission` },
        { status: 413 },
      );
    }

    let totalUploadBytes = 0;
    for (const f of [...files, ...staFiles]) {
      if (f.size > MAX_UPLOAD_BYTES_PER_FILE) {
        return NextResponse.json(
          { success: false, error: `File ${f.name} exceeds 15 MB limit` },
          { status: 413 },
        );
      }
      totalUploadBytes += f.size;
      if (totalUploadBytes > MAX_UPLOAD_BYTES_TOTAL) {
        return NextResponse.json(
          { success: false, error: 'Total upload size exceeds 35 MB limit' },
          { status: 413 },
        );
      }
    }

    const targetProject = getProjectById(projectId);
    if (!targetProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    const auth = getRequestAuthContext(req);
    const isAuthedStaff = auth.authenticated;

    if (!isAuthedStaff && targetProject.requireIntakeToken && targetProject.intakeToken) {
      const suppliedToken = sanitizeText((body as Record<string, unknown>).intakeToken, 64);
      if (suppliedToken !== targetProject.intakeToken) {
        return NextResponse.json(
          { success: false, error: 'Invalid or missing jobsite QR access token.' },
          { status: 403 },
        );
      }
    }
    let sessionCookie: string | undefined;
    try {
      const jar = cookies();
      sessionCookie = jar.get(SESSION_COOKIE)?.value;
    } catch {
      // ignore outside request context
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
    const randSuffix = crypto.randomBytes(6).toString('hex');
    const id = existingReport
      ? existingReport.id
      : `${projectId}-${tradePartnerId}-${date}-${randSuffix}`;

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

    const sanitizedCrew = isHp ? [] : sanitizeCrewBreakdown(body.crewBreakdown);
    const sanitizedWorkerCount = isHp
      ? 0
      : Math.max(0, Math.min(5000, Number(body.workerCount) || 0));
    const sanitizedTotalHours = isHp
      ? 0
      : Math.max(0, Math.min(100000, Number(body.totalHours) || 0));

    const report: DailyReport = {
      id,
      projectId,
      tradePartnerId,
      tradePartnerName: tradePartnerName || 'Trade Partner',
      date,
      submittedAt: existingReport?.submittedAt || new Date().toISOString(),
      submittedBy: sanitizeText(body.submittedBy, 120) || (isHp ? 'HP Staff' : 'Field Intake'),
      locationDescription: sanitizeText(body.locationDescription, 4000),
      workerCount: sanitizedWorkerCount,
      totalHours: sanitizedTotalHours,
      crewBreakdown: sanitizedCrew,
      tierSubcontractors: sanitizeTierSubcontractors(body.tierSubcontractors),
      tierSubsSummary: sanitizeText(body.tierSubsSummary, 1000),
      equipment: sanitizeEquipment(body.equipment),
      notes: sanitizeText(body.notes, 8000),
      tradesAndFavors: sanitizeText(body.tradesAndFavors, 4000),
      isHpEmployee: isHp,
      staCompleted: isHp ? true : (savedStaAttachments.length > 0 || Boolean(body.staCompleted)),
      staFiles: isHp ? undefined : (savedStaAttachments.length > 0 ? savedStaAttachments : undefined),
      emailRecipients: sanitizeEmails(body.emailRecipients),
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
