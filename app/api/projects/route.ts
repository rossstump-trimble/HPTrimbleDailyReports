import { NextResponse } from 'next/server';
import { getProjects, createProject, updateProject, getCapacityStatus } from '@/lib/store';
import { requireAuthResponse, getRequestAuthContext } from '@/lib/api-auth';
import { filterProjectsForUser } from '@/lib/project-guard';
import { normalizePsPortfolioId } from '@/lib/projectsight/project-access';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const auth = getRequestAuthContext(req);
    const capacity = getCapacityStatus();
    const allProjects = getProjects();

    // Admins see everything only when they ask for it, so their default view matches what ProjectSight grants them.
    const showAll = auth.isAdmin && new URL(req.url).searchParams.get('scope') === 'all';
    const projects = showAll ? allProjects : await filterProjectsForUser(auth, allProjects);

    return NextResponse.json({
      projects,
      capacity,
      isAdmin: auth.isAdmin,
      hiddenCount: allProjects.length - projects.length,
    });
  } catch (err) {
    console.error('[api/projects] GET failed', err);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      name: string;
      code?: string;
      workingDays?: number[];
      tradePartners?: Array<{ id: string; name: string; contactEmail?: string; category?: string }>;
      psPortfolioId?: string;
      psProjectId?: string;
    };

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const psPortfolioId = body.psPortfolioId?.trim()
      ? normalizePsPortfolioId(body.psPortfolioId)
      : undefined;
    if (body.psPortfolioId?.trim() && !psPortfolioId) {
      return NextResponse.json({ error: 'ProjectSight Portfolio ID must be a GUID' }, { status: 400 });
    }

    let created = createProject({
      name: body.name.trim().slice(0, 160),
      code: body.code?.trim().slice(0, 32),
      workingDays: body.workingDays,
      tradePartners: body.tradePartners,
      psPortfolioId,
      psProjectId: body.psProjectId?.trim().slice(0, 64),
    });

    // Otherwise a creator without a verifiable ProjectSight link could not see the project they just made.
    const auth = getRequestAuthContext(req);
    if (!auth.isAdmin && auth.email) {
      created = updateProject(created.id, { allowedUserEmails: [auth.email] }) ?? created;
    }

    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err) {
    console.error('[api/projects] POST failed', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
