import { NextResponse } from 'next/server';
import { getProjectById, updateProject, updateProjectWorkingDays, updateProjectTradePartners, deleteProject, getCapacityStatus } from '@/lib/store';
import { getRequestAuthContext, requireAuthResponse, requireAdminResponse } from '@/lib/api-auth';
import { requireProjectAccessResponse } from '@/lib/project-guard';
import { normalizePsPortfolioId } from '@/lib/projectsight/project-access';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const project = getProjectById(params.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const auth = getRequestAuthContext(req);
    const capacity = getCapacityStatus();

    const hasFullAccess = auth.authenticated && !(await requireProjectAccessResponse(req, params.projectId));
    if (!hasFullAccess) {
      // Return redacted project view for public QR intake form (and signed-in users without ProjectSight access)
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
  const denied = requireAuthResponse(req) ?? (await requireProjectAccessResponse(req, params.projectId));
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      name?: string;
      code?: string;
      psPortfolioId?: string;
      psProjectId?: string;
      workingDays?: number[];
      keywords?: string[];
      allowedUserEmails?: string[];
      tradePartners?: Array<{ id: string; name: string; contactEmail?: string; category?: string }>;
    };

    let updated = getProjectById(params.projectId);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // These fields decide who can see the project, so only admins may change them.
    const { isAdmin } = getRequestAuthContext(req);
    if (!isAdmin) {
      const normalizeEmails = (emails: string[] | undefined): string =>
        Array.from(new Set((emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean))).sort().join(',');
      const changesAccess =
        (body.allowedUserEmails !== undefined &&
          normalizeEmails(body.allowedUserEmails) !== normalizeEmails(updated.allowedUserEmails)) ||
        (body.psPortfolioId !== undefined && body.psPortfolioId !== (updated.psPortfolioId ?? '')) ||
        (body.psProjectId !== undefined && body.psProjectId !== (updated.psProjectId ?? ''));
      if (changesAccess) {
        return NextResponse.json(
          { error: 'Only administrators can change ProjectSight links or project access.' },
          { status: 403 },
        );
      }
    }

    let psPortfolioId = body.psPortfolioId;
    if (psPortfolioId?.trim()) {
      psPortfolioId = normalizePsPortfolioId(psPortfolioId);
      if (!psPortfolioId) {
        return NextResponse.json({ error: 'ProjectSight Portfolio ID must be a GUID' }, { status: 400 });
      }
    }

    updated = updateProject(params.projectId, {
      name: body.name,
      code: body.code,
      psPortfolioId,
      psProjectId: body.psProjectId,
      workingDays: body.workingDays,
      keywords: body.keywords,
      allowedUserEmails: body.allowedUserEmails,
    }) ?? updated;

    if (body.tradePartners && Array.isArray(body.tradePartners)) {
      updated = updateProjectTradePartners(params.projectId, body.tradePartners) ?? updated;
    }

    return NextResponse.json({ success: true, project: updated });
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
