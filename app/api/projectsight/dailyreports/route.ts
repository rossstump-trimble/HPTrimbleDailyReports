import { NextResponse } from 'next/server';
import { getDailyReportById, markDailySentToProjectSight } from '@/lib/store';
import { readUpload } from '@/lib/upload-store';
import { sendFog617ToProjectSight } from '@/lib/projectsight/send-daily';
import { captureFromDailyReport } from '@/lib/projectsight/send-intake-daily';
import { projectSightErrorResponse, requireTidTokenAsync } from '@/lib/projectsight/route-helpers';
import type { Fog617Capture } from '@/lib/projectsight/map-daily';

import { DEFAULT_DESTINATION } from '@/lib/projectsight/destination';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const token = await requireTidTokenAsync();
  if (token instanceof NextResponse) return token;

  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const portfolioId = String(form.get('portfolioId') || DEFAULT_DESTINATION.portfolioId);
      const projectId = String(form.get('projectId') || DEFAULT_DESTINATION.projectId);
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
    const portfolioId = body.portfolioId || DEFAULT_DESTINATION.portfolioId;
    const projectId = body.projectId || DEFAULT_DESTINATION.projectId;
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
      capture: captureFromDailyReport(report),
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
