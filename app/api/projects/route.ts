import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjects, createProject, getCapacityStatus } from '@/lib/store';
import { requireAuthResponse, getRequestAuthContext } from '@/lib/api-auth';
import { getUserAccessiblePsProjects } from '@/lib/projectsight/project-access';
import { getValidTidAccessToken } from '@/lib/projectsight/session-token';
import { SESSION_COOKIE, AUTH_COOKIE } from '@/lib/local-session';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const auth = getRequestAuthContext(req);
    const capacity = getCapacityStatus();
    let projects = getProjects();

    // If not a system administrator, filter projects by user permissions
    if (!auth.isAdmin && auth.email) {
      const userEmail = auth.email.toLowerCase();
      let userPsProjectIds: Set<string> | null = null;
      try {
        const jar = cookies();
        const rawCookie = jar.get(SESSION_COOKIE)?.value || jar.get(AUTH_COOKIE)?.value;
        const tokenRes = await getValidTidAccessToken(rawCookie);
        if (tokenRes.token) {
          userPsProjectIds = await getUserAccessiblePsProjects(tokenRes.token, projects).catch(() => null);
        }
      } catch {
        // ignore token lookup error
      }

      projects = projects.filter((p) => {
        // 1. Explicitly allowed email exceptions on this project
        if (p.allowedUserEmails && p.allowedUserEmails.length > 0) {
          const allowed = p.allowedUserEmails.map((e) => e.toLowerCase());
          if (allowed.includes(userEmail)) return true;
        }

        // 2. Restricted to ProjectSight assigned project users
        if (p.restrictToAssignedUsers && p.psProjectId) {
          if (userPsProjectIds) {
            return userPsProjectIds.has(String(p.psProjectId).toLowerCase());
          }
          return false;
        }

        // 3. Unrestricted / demo projects
        return true;
      });
    }

    return NextResponse.json({
      projects,
      capacity,
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
      restrictToAssignedUsers?: boolean;
      allowedUserEmails?: string[];
    };

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const created = createProject({
      name: body.name.trim().slice(0, 160),
      code: body.code?.trim().slice(0, 32),
      workingDays: body.workingDays,
      tradePartners: body.tradePartners,
      psPortfolioId: body.psPortfolioId?.trim().slice(0, 64),
      psProjectId: body.psProjectId?.trim().slice(0, 64),
    });

    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err) {
    console.error('[api/projects] POST failed', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
