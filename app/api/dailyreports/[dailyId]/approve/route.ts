import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  approveDailyReport,
  getDailyReportById,
  getProjectById,
  markDailySentToProjectSight,
} from '@/lib/store';
import { readUpload } from '@/lib/upload-store';
import { sendFog617ToProjectSight } from '@/lib/projectsight/send-daily';
import { captureFromDailyReport } from '@/lib/projectsight/send-intake-daily';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE, parseVerifiedSession, signSessionPayload } from '@/lib/local-session';
import { getValidTidAccessToken } from '@/lib/projectsight/session-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: { dailyId: string } },
) {
  try {
    const { dailyId } = params;
    const body = (await req.json().catch(() => ({}))) as {
      portfolioId?: string;
      projectId?: string;
      approverEmail?: string;
    };

    const existing = getDailyReportById(dailyId);
    if (!existing) {
      return NextResponse.json({ error: 'Daily report not found' }, { status: 404 });
    }

    if (existing.projectSightDailyId && existing.approvalStatus === 'approved') {
      return NextResponse.json({
        success: true,
        report: existing,
        projectSightDailyId: existing.projectSightDailyId,
        attached: true,
        message: `Already synced to ProjectSight #${existing.projectSightDailyId}.`,
      });
    }

    const jar = cookies();
    const sessionCookie = jar.get(SESSION_COOKIE)?.value;
    const session = parseVerifiedSession(sessionCookie);
    const approverEmail = session?.email || body.approverEmail || 'Superintendent';

    const proj = getProjectById(existing.projectId);
    const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
    const portfolioId = body.portfolioId || proj?.psPortfolioId || dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
    const projectId = body.projectId || proj?.psProjectId || dest.projectId || DEFAULT_DESTINATION.projectId;
    const { token, refreshedSession } = await getValidTidAccessToken(sessionCookie);

    // If signed in with Trimble Identity, dispatch to ProjectSight API first
    if (token && portfolioId && projectId) {
      const filesToAttach: { fileName: string; fileBytes: Buffer; mimeType?: string; category?: 'daily_capture' | 'sta_form' }[] = [];

      if (existing.rawSourceFiles && existing.rawSourceFiles.length > 0) {
        for (const att of existing.rawSourceFiles) {
          const fileData = readUpload(att.filePath);
          if (fileData) {
            filesToAttach.push({
              fileName: att.fileName,
              fileBytes: fileData,
              mimeType: att.mimeType,
              category: 'daily_capture',
            });
          }
        }
      } else if (existing.rawSourcePath) {
        const fileData = readUpload(existing.rawSourcePath);
        if (fileData) {
          filesToAttach.push({
            fileName: existing.rawSourceFileName || 'FOG617.bin',
            fileBytes: fileData,
            category: 'daily_capture',
          });
        }
      }

      if (existing.staFiles && existing.staFiles.length > 0) {
        for (const att of existing.staFiles) {
          const fileData = readUpload(att.filePath);
          if (fileData) {
            filesToAttach.push({
              fileName: att.fileName,
              fileBytes: fileData,
              mimeType: att.mimeType,
              category: 'sta_form',
            });
          }
        }
      }

      const capture = captureFromDailyReport(existing);
      const psResult = await sendFog617ToProjectSight({
        token,
        portfolioId,
        projectId,
        capture,
        files: filesToAttach.length > 0 ? filesToAttach : undefined,
        fileName: filesToAttach[0]?.fileName,
        fileBytes: filesToAttach[0]?.fileBytes,
      });

      const approved = approveDailyReport(dailyId, approverEmail);
      const stamped = markDailySentToProjectSight(dailyId, {
        projectSightDailyId: psResult.projectSightDailyId,
        projectSightPortfolioId: portfolioId,
        projectSightProjectId: projectId,
        sentToProjectSightAt: new Date().toISOString(),
      });

      const response = NextResponse.json({
        success: true,
        report: stamped ?? approved,
        projectSightDailyId: psResult.projectSightDailyId,
        attached: psResult.attached,
        attachError: psResult.attachError,
      });

      if (refreshedSession) {
        response.cookies.set(SESSION_COOKIE, JSON.stringify(signSessionPayload(refreshedSession)), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      return response;
    }

    const approved = approveDailyReport(dailyId, approverEmail);
    const response = NextResponse.json({
      success: true,
      report: approved,
      status: 'approved_locally',
      message: 'Daily report approved. Connect Trimble Identity to sync with ProjectSight API.',
    });

    if (refreshedSession) {
      response.cookies.set(SESSION_COOKIE, JSON.stringify(signSessionPayload(refreshedSession)), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    console.error('[dailyreports/approve] POST failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Approval failed' },
      { status: 500 },
    );
  }
}
