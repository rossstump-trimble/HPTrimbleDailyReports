import {
  attachDailyReportFile,
  createDailyReport,
  ProjectSightHttpError,
} from './client';
import { mapFog617ToProjectSightBody, type Fog617Capture } from './map-daily';

export interface SendDailyArgs {
  token: string;
  portfolioId: string;
  projectId: string;
  capture: Fog617Capture;
  fileName?: string;
  fileBytes?: Buffer;
  mimeType?: string;
}

export interface SendDailyResult {
  projectSightDailyId: string;
  attached: boolean;
  attachError?: string;
}

export interface SendDailyDeps {
  createDailyReport: typeof createDailyReport;
  attachDailyReportFile: typeof attachDailyReportFile;
}

const defaultDeps: SendDailyDeps = {
  createDailyReport,
  attachDailyReportFile,
};

export async function sendFog617ToProjectSight(
  args: SendDailyArgs,
  deps: SendDailyDeps = defaultDeps,
): Promise<SendDailyResult> {
  const created = await deps.createDailyReport(
    args.token,
    args.portfolioId,
    args.projectId,
    mapFog617ToProjectSightBody(args.capture),
  );
  if (!args.fileBytes || args.fileBytes.length === 0) {
    return { projectSightDailyId: created.id, attached: false };
  }
  try {
    await deps.attachDailyReportFile(
      args.token,
      args.portfolioId,
      args.projectId,
      created.id,
      args.fileName || 'FOG617.bin',
      args.fileBytes,
      args.mimeType || 'application/octet-stream',
    );
    return { projectSightDailyId: created.id, attached: true };
  } catch (err) {
    const attachError =
      err instanceof ProjectSightHttpError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Attach failed';
    return { projectSightDailyId: created.id, attached: false, attachError };
  }
}
