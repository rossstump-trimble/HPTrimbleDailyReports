import {
  attachDailyReportFile,
  createDailyReport,
  listProjectLocations,
  ProjectSightHttpError,
} from './client';
import {
  mapFog617ToProjectSightBody,
  type Fog617Capture,
} from './map-daily';
import { fetchWeatherForDate } from '@/lib/weather-service';

export interface SendDailyAttachment {
  fileName: string;
  fileBytes: Buffer;
  mimeType?: string;
  category?: 'daily_capture' | 'sta_form';
}

export interface SendDailyArgs {
  token: string;
  portfolioId: string;
  projectId: string;
  capture: Fog617Capture;
  fileName?: string;
  fileBytes?: Buffer;
  mimeType?: string;
  files?: SendDailyAttachment[];
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
  const dateStr = args.capture.date || new Date().toISOString().slice(0, 10);
  let weather;
  try {
    weather = await fetchWeatherForDate(dateStr);
  } catch (wErr) {
    console.warn('[sendFog617ToProjectSight] weather fetch fallback', wErr);
  }

  // Auto-resolve ProjectSight LocationID if not explicitly set
  if (args.capture.psLocationId == null && args.capture.locationDescription) {
    try {
      const locations = await listProjectLocations(args.token, args.portfolioId, args.projectId);
      const text = args.capture.locationDescription.toLowerCase();
      // Match longest location name first (or tokens separated by '>')
      const sorted = [...locations].sort((a, b) => b.name.length - a.name.length);
      const match = sorted.find((loc) => {
        if (!loc.name) return false;
        const fullLower = loc.name.toLowerCase();
        if (text.includes(fullLower)) return true;
        // Check hierarchy segments, e.g. "Building A Interior > Level 1" -> check "Level 1"
        const segments = fullLower.split('>').map((s) => s.trim()).filter((s) => s.length >= 3);
        return segments.some((seg) => text.includes(seg));
      });
      if (match?.id) {
        const numId = Number(match.id);
        if (Number.isFinite(numId)) {
          args.capture.psLocationId = numId;
        }
      }
    } catch {
      // Ignore location resolution fallback error
    }
  }

  const created = await deps.createDailyReport(
    args.token,
    args.portfolioId,
    args.projectId,
    mapFog617ToProjectSightBody(args.capture, weather),
  );
  const dailyId = created.id;
  const filesToAttach: SendDailyAttachment[] =
    args.files && args.files.length > 0
      ? args.files
      : args.fileBytes && args.fileBytes.length > 0
        ? [{ fileName: args.fileName || 'FOG617.bin', fileBytes: args.fileBytes, mimeType: args.mimeType }]
        : [];

  if (filesToAttach.length === 0) {
    return { projectSightDailyId: dailyId, attached: false };
  }

  let attachedCount = 0;
  let lastError: string | undefined;
  let dailyIdx = 1;
  let staIdx = 1;

  for (const f of filesToAttach) {
    try {
      const isSta = f.category === 'sta_form';
      const prefix = isSta ? `STA-Form-${staIdx++}-` : `Daily-Capture-${dailyIdx++}-`;
      const fileNameToSend =
        f.fileName.startsWith('Daily-Capture-') || f.fileName.startsWith('STA-Form-')
          ? f.fileName
          : `${prefix}${f.fileName}`;

      await deps.attachDailyReportFile(
        args.token,
        args.portfolioId,
        args.projectId,
        dailyId,
        fileNameToSend,
        f.fileBytes,
        f.mimeType || 'application/octet-stream',
      );
      attachedCount++;
    } catch (err) {
      lastError =
        err instanceof ProjectSightHttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Attach failed';
    }
  }

  return {
    projectSightDailyId: dailyId,
    attached: attachedCount > 0,
    attachError: attachedCount === 0 ? lastError : undefined,
  };
}
