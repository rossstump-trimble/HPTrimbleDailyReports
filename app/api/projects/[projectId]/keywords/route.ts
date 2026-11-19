import { NextResponse } from 'next/server';
import { getProjectById, updateProjectKeywords } from '@/lib/store';
import { requireProjectAccessResponse } from '@/lib/project-guard';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const projectAccessDenied = await requireProjectAccessResponse(req, params.projectId);
  if (projectAccessDenied) return projectAccessDenied;
  try {
    const project = getProjectById(params.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({
      projectId: project.id,
      keywords: project.keywords || ['colo', 'MPOE', 'AHU', 'VAV', 'switchgear', 'PDU', 'generator', 'chiller', 'conduit', 'feeder'],
    });
  } catch (err) {
    console.error('[api/projects/keywords] GET failed', err);
    return NextResponse.json({ error: 'Failed to get keywords' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const projectAccessDenied = await requireProjectAccessResponse(req, params.projectId);
  if (projectAccessDenied) return projectAccessDenied;
  try {
    const body = (await req.json()) as { keywords: string[] };
    if (!body.keywords || !Array.isArray(body.keywords)) {
      return NextResponse.json({ error: 'keywords array is required' }, { status: 400 });
    }

    const updated = updateProjectKeywords(params.projectId, body.keywords);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      projectId: updated.id,
      keywords: updated.keywords,
    });
  } catch (err) {
    console.error('[api/projects/keywords] POST failed', err);
    return NextResponse.json({ error: 'Failed to update keywords' }, { status: 500 });
  }
}
