import { NextResponse } from 'next/server';
import type { DailyReport } from '@/types/hpproto';
import { getDailyReportById, markDailySentToProjectSight } from '@/lib/store';
import { readUpload } from '@/lib/upload-store';
import { sendFog617ToProjectSight } from '@/lib/projectsight/send-daily';
import { projectSightErrorResponse, requireTidToken } from '@/lib/projectsight/route-helpers';
import type { Fog617Capture } from '@/lib/projectsight/map-daily';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function captureFromDaily(report: DailyReport): Fog617Capture {
  return {
    tradePartnerName: report.tradePartnerName,
    date: report.date,
    locationDescription: report.locationDescription,
    workerCount: report.workerCount,
    totalHours: report.totalHours,
    crewBreakdown: report.crewBreakdown,
    equipment: report.equipment,
    notes: report.notes,
    staCompleted: report.staCompleted,
  };
}

export async function POST(request: Request) {
  const token = requireTidToken();
  if (token instanceof NextResponse) return token;

  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const portfolioId = String(form.get('portfolioId') || '');
      const projectId = String(form.get('projectId') || '');
      const dailyRaw = form.get('daily');
      const file = form.get('file');
      if (!portfolioId || !projectId) {
        return NextResponse.json({ error: 'portfolioId and projectId are required' }, { status: 400 });
      }
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'FOG 617 file is required' }, { status: 400 });
      }
      let capture: Fog617Capture = {};
      if (typeof dailyRaw === 'string' && dailyRaw.trim()) {
        capture = JSON.parse(dailyRaw) as Fog617Capture;
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const result = await sendFog617ToProjectSight({
        token,
        portfolioId,
        projectId,
        capture,
        fileName: file.name,
        fileBytes: bytes,
        mimeType: file.type,
      });
      return NextResponse.json(result);
    }

    const body = (await request.json()) as {
      portfolioId?: string;
      projectId?: string;
      localDailyId?: string;
    };
    const portfolioId = body.portfolioId || '';
    const projectId = body.projectId || '';
    const localDailyId = body.localDailyId || '';
    if (!portfolioId || !projectId || !localDailyId) {
      return NextResponse.json(
        { error: 'portfolioId, projectId, and localDailyId are required' },
        { status: 400 },
      );
    }
    const report = getDailyReportById(localDailyId);
    if (!report) {
      return NextResponse.json({ error: 'Local daily not found' }, { status: 404 });
    }
    let fileBytes: Buffer | undefined;
    if (report.rawSourcePath) {
      const bytes = readUpload(report.rawSourcePath);
      if (!bytes) {
        return NextResponse.json({ error: 'Original FOG 617 file is missing' }, { status: 400 });
      }
      fileBytes = bytes;
    }
    const result = await sendFog617ToProjectSight({
      token,
      portfolioId,
      projectId,
      capture: captureFromDaily(report),
      fileName: report.rawSourceFileName || 'FOG617.bin',
      fileBytes,
      mimeType: 'application/octet-stream',
    });
    markDailySentToProjectSight(localDailyId, {
      projectSightDailyId: result.projectSightDailyId,
      projectSightPortfolioId: portfolioId,
      projectSightProjectId: projectId,
      sentToProjectSightAt: new Date().toISOString(),
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    return projectSightErrorResponse(err);
  }
}

export async function PUT() {
  return NextResponse.json({ error: 'Existing Daily Reports cannot be changed.' }, { status: 403 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Existing Daily Reports cannot be changed.' }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Existing Daily Reports cannot be changed.' }, { status: 403 });
}
