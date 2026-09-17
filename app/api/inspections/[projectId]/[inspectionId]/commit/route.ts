import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getInspectionById,
  updateInspectionRecord,
  getStore,
  saveStore,
  upsertDailyReport,
} from '@/lib/store';
import {
  updateChecklistItems,
  uploadChecklistAttachment,
} from '@/lib/projectsight/client';
import {
  DEFAULT_DESTINATION,
  DESTINATION_COOKIE,
  destinationFromCookieWithFallback,
} from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import type { InspectionChecklistItem, InspectionRecord } from '@/types/inspections';
import type { DailyReport } from '@/types/hpproto';

export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; inspectionId: string } },
) {
  try {
    const { projectId, inspectionId } = params;
    const body = (await req.json()) as {
      items?: InspectionChecklistItem[];
      status?: InspectionRecord['status'];
      sheetImageBase64?: string;
      imageFileName?: string;
    };

    const target = getInspectionById(inspectionId);
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Inspection record not found' },
        { status: 404 },
      );
    }

    const updatedItems = body.items || target.items;
    const updatedStatus = body.status || 'approved';

    let token: string | null = null;
    let psPortfolioId = DEFAULT_DESTINATION.portfolioId;
    let psProjectId = DEFAULT_DESTINATION.projectId;

    try {
      const jar = cookies();
      token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;
    } catch {
      // Running outside Next.js server context
    }

    let psSynced = false;
    let psSyncError: string | undefined = undefined;

    if (token && target.psRecordId && psPortfolioId && psProjectId) {
      try {
        await updateChecklistItems(
          token,
          psPortfolioId,
          psProjectId,
          target.psRecordId,
          updatedItems.map((it) => ({
            id: it.id,
            itemNumber: it.itemNumber,
            prompt: it.prompt,
            result: it.result,
            comment: it.comment,
          })),
          updatedStatus === 'approved' ? 'Approved' : 'In Review',
        );

        if (body.sheetImageBase64) {
          try {
            const cleanBase64 = body.sheetImageBase64.replace(/^data:[^;]+;base64,/, '');
            const imgBuffer = Buffer.from(cleanBase64, 'base64');
            await uploadChecklistAttachment(
              token,
              psPortfolioId,
              psProjectId,
              target.psRecordId,
              body.imageFileName || 'inspection_scan.jpg',
              imgBuffer,
              'image/jpeg',
            );
          } catch (attachErr) {
            console.warn('[inspection commit] attachment upload warning:', attachErr);
          }
        }

        psSynced = true;
      } catch (err) {
        psSynced = false;
        psSyncError = err instanceof Error ? err.message : String(err);
        console.warn('[inspection commit] ProjectSight update failed:', psSyncError);
      }
    }

    const updatedRecord = updateInspectionRecord(inspectionId, {
      items: updatedItems,
      status: updatedStatus,
      psSynced,
      psSyncError,
    });

    // Cross-sync to today's daily report
    try {
      const today = new Date().toISOString().split('T')[0];
      const store = getStore();
      const existingDaily = store.dailyReports.find(
        (d) => d.projectId.toLowerCase() === projectId.toLowerCase() && d.date === today,
      );

      const passedCount = updatedItems.filter((it) => it.result === 'Pass').length;
      const totalCount = updatedItems.length;
      const summaryNote = `[Inspection Completed] ${target.number} - ${target.title}: ${passedCount}/${totalCount} items Passed (${updatedStatus.toUpperCase()})`;

      if (existingDaily) {
        existingDaily.notes = existingDaily.notes
          ? `${existingDaily.notes}\n${summaryNote}`
          : summaryNote;
        saveStore(store);
      } else {
        const newDaily: DailyReport = {
          id: `daily-${projectId}-${today}`,
          projectId,
          tradePartnerId: 'general-contractor',
          tradePartnerName: 'General Contractor',
          date: today,
          submittedAt: new Date().toISOString(),
          locationDescription: target.location || 'On Site',
          workerCount: 0,
          totalHours: 0,
          crewBreakdown: [],
          equipment: [],
          notes: summaryNote,
          staCompleted: true,
          emailRecipients: [],
          approvalStatus: 'approved',
        };
        upsertDailyReport(newDaily);
      }
    } catch (dailyErr) {
      console.warn('[inspection commit] daily report cross-sync warning:', dailyErr);
    }

    return NextResponse.json({
      success: true,
      inspection: updatedRecord,
      psSynced,
      psSyncError,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Commit failed' },
      { status: 500 },
    );
  }
}
