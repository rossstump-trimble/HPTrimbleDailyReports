import { NextResponse } from 'next/server';
import { getProjectById, updateProjectWorkingDays, updateProjectTradePartners, deleteProject, getCapacityStatus } from '@/lib/store';
import { getRequestAuthContext, requireAuthResponse, requireAdminResponse } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const project = getProjectById(params.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const auth = getRequestAuthContext(req);
    const capacity = getCapacityStatus();

    if (!auth.authenticated) {
      // Return redacted project view for public QR intake form
      return NextResponse.json({
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
          workingDays: project.workingDays,
          tradePartners: (project.tradePartners || []).map((tp) => ({
            id: tp.id,
            name: tp.name,
            category: tp.category,
          })),
        },
        capacity,
      });
    }

    return NextResponse.json({ project, capacity });
  } catch (err) {
    console.error('[api/projects/[projectId]] GET failed', err);
    return NextResponse.json({ error: 'Failed to get project' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      workingDays?: number[];
      tradePartners?: Array<{ id: string; name: string; contactEmail?: string; category?: string }>;
    };

    let updated = getProjectById(params.projectId);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (body.workingDays && Array.isArray(body.workingDays)) {
      updated = updateProjectWorkingDays(params.projectId, body.workingDays) ?? updated;
    }

    if (body.tradePartners && Array.isArray(body.tradePartners)) {
      updated = updateProjectTradePartners(params.projectId, body.tradePartners) ?? updated;
    }

    return NextResponse.json({ project: updated });
  } catch (err) {
    console.error('[api/projects/[projectId]] PATCH failed', err);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  const denied = requireAdminResponse(req);
  if (denied) return denied;

  try {
    const deleted = deleteProject(params.projectId);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: params.projectId });
  } catch (err) {
    console.error('[api/projects/[projectId]] DELETE failed', err);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
