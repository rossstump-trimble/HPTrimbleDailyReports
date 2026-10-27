import type { DailyReport } from '@/types/hpproto';
import type { ProjectSightDestination } from '@/lib/projectsight/destination';
import { ProjectSightHttpError } from '@/lib/projectsight/client';
import { getProjectCompanies, markDailySentToProjectSight } from '@/lib/store';
import { sendFog617ToProjectSight, type SendDailyResult, type SendDailyAttachment } from '@/lib/projectsight/send-daily';
import type { Fog617Capture } from '@/lib/projectsight/map-daily';
import { slugTradePartnerId } from '@/lib/trade-partner';

export function captureFromDailyReport(report: DailyReport): Fog617Capture {
  let psCompanyId: number | undefined;
  try {
    if (report.projectId) {
      const companies = getProjectCompanies(report.projectId);
      const rId = (report.tradePartnerId || '').toLowerCase();
      const rName = (report.tradePartnerName || '').trim().toLowerCase();
      const rSlug = slugTradePartnerId(rName);
      const matched = companies.find(
        (c) =>
          c.id.toLowerCase() === rId ||
          c.name.trim().toLowerCase() === rName ||
          slugTradePartnerId(c.name) === rSlug,
      );
      if (matched?.psCompanyId != null) {
        psCompanyId = matched.psCompanyId;
      }
    }
  } catch {
    // ignore store read issues in isolated unit tests
  }

  return {
    tradePartnerName: report.tradePartnerName,
    psCompanyId,
    submittedBy: report.submittedBy,
    date: report.date,
    locationDescription: report.locationDescription,
    workerCount: report.workerCount,
    totalHours: report.totalHours,
    crewBreakdown: report.crewBreakdown,
    tierSubcontractors: report.tierSubcontractors,
    tierSubsSummary: report.tierSubsSummary,
    equipment: report.equipment,
    tradesAndFavors: report.tradesAndFavors,
    isHpEmployee: report.isHpEmployee,
    notes: report.notes,
    staCompleted: report.staCompleted,
    staFiles: report.staFiles?.map((f) => ({ fileName: f.fileName, filePath: f.filePath })),
  };
}

export interface SendSavedDailyInput {
  token: string | null;
  destination: ProjectSightDestination | null;
  report: DailyReport;
  fileBytes?: Buffer;
  fileName?: string;
  mimeType?: string;
  files?: SendDailyAttachment[];
}

export type SendSavedDailyResult =
  | { ok: true; report: DailyReport; attached: boolean; attachError?: string }
  | { ok: false; status: number; error: string };

export interface SendSavedDailyDeps {
  send: typeof sendFog617ToProjectSight;
  mark: typeof markDailySentToProjectSight;
}

const defaultDeps: SendSavedDailyDeps = {
  send: sendFog617ToProjectSight,
  mark: markDailySentToProjectSight,
};

function errorFromUnknown(err: unknown): { status: number; error: string } {
  if (err instanceof ProjectSightHttpError) {
    if (err.status === 401 || err.status === 403) {
      return {
        status: err.status,
        error: 'No ProjectSight access for this user or missing API scope.',
      };
    }
    return { status: 502, error: `ProjectSight error ${err.status}` };
  }
  return { status: 502, error: 'ProjectSight request failed' };
}

export async function sendSavedDailyToProjectSight(
  input: SendSavedDailyInput,
  deps: SendSavedDailyDeps = defaultDeps,
): Promise<SendSavedDailyResult> {
  if (!input.token) {
    return {
      ok: false,
      status: 401,
      error: 'Sign in with Trimble Identity to send this daily to ProjectSight.',
    };
  }
  if (!input.destination?.portfolioId || !input.destination.projectId) {
    return {
      ok: false,
      status: 400,
      error: 'Pick a ProjectSight portfolio and project before submitting.',
    };
  }

  let sent: SendDailyResult;
  try {
    sent = await deps.send({
      token: input.token,
      portfolioId: input.destination.portfolioId,
      projectId: input.destination.projectId,
      capture: captureFromDailyReport(input.report),
      fileName: input.fileName,
      fileBytes: input.fileBytes,
      mimeType: input.mimeType,
      files: input.files,
    });
  } catch (err) {
    return { ok: false, ...errorFromUnknown(err) };
  }

  const marked =
    deps.mark(input.report.id, {
      projectSightDailyId: sent.projectSightDailyId,
      projectSightPortfolioId: input.destination.portfolioId,
      projectSightProjectId: input.destination.projectId,
      sentToProjectSightAt: new Date().toISOString(),
    }) ?? { ...input.report, projectSightDailyId: sent.projectSightDailyId };

  return {
    ok: true,
    report: marked,
    attached: sent.attached,
    attachError: sent.attachError,
  };
}
