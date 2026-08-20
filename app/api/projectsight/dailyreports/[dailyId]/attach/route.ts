import { NextResponse } from 'next/server';
import { attachDailyReportFile } from '@/lib/projectsight/client';
import { attachMethodAllowed } from '@/lib/projectsight/write-gate';
import { projectSightErrorResponse, requireTidToken } from '@/lib/projectsight/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: { dailyId: string } },
) {
  if (!attachMethodAllowed('POST')) {
    return NextResponse.json({ error: 'Existing Daily Reports cannot be changed.' }, { status: 403 });
  }
  const token = requireTidToken();
  if (token instanceof NextResponse) return token;

  const form = await request.formData();
  const portfolioId = String(form.get('portfolioId') || '');
  const projectId = String(form.get('projectId') || '');
  const file = form.get('file');
  if (!portfolioId || !projectId) {
    return NextResponse.json({ error: 'portfolioId and projectId are required' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'FOG 617 file is required' }, { status: 400 });
  }
  try {
    await attachDailyReportFile(
      token,
      portfolioId,
      projectId,
      params.dailyId,
      file.name,
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    return NextResponse.json({ projectSightDailyId: params.dailyId, attached: true });
  } catch (err) {
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
