import { NextResponse } from 'next/server';
import { getProjectById, updateProjectWorkingDays } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  try {
    const project = getProjectById(params.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({
      projectId: project.id,
      workingDays: project.workingDays || [1, 2, 3, 4, 5],
    });
  } catch (err) {
    console.error('[api/projects/working-days] GET failed', err);
    return NextResponse.json({ error: 'Failed to get working days' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const body = (await req.json()) as { workingDays: number[] };
    if (!body.workingDays || !Array.isArray(body.workingDays)) {
      return NextResponse.json({ error: 'workingDays array is required' }, { status: 400 });
    }

    const updated = updateProjectWorkingDays(params.projectId, body.workingDays);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      projectId: updated.id,
      workingDays: updated.workingDays,
    });
  } catch (err) {
    console.error('[api/projects/working-days] POST failed', err);
    return NextResponse.json({ error: 'Failed to update working days' }, { status: 500 });
  }
}
