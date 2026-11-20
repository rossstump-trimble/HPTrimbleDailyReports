import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getRequestAuthContext, type AuthenticatedContext } from '@/lib/api-auth';
import { AUTH_COOKIE, SESSION_COOKIE } from '@/lib/local-session';
import { getProjectById } from '@/lib/store';
import { getValidTidAccessToken } from '@/lib/projectsight/session-token';
import {
  getUserAccessiblePsProjectKeys,
  normalizePsPortfolioId,
  projectHasPsAccess,
} from '@/lib/projectsight/project-access';
import type { Project } from '@/types/hpproto';

/**
 * A project is visible when the user's own ProjectSight login can see its linked
 * project, or an admin listed the user's email on it. Anything that can't be
 * verified (no PS link, no PS token, PS error) is hidden: showing too little is
 * recoverable, showing another team's project is not.
 */
export async function filterProjectsForUser(
  auth: AuthenticatedContext,
  projects: Project[],
): Promise<Project[]> {
  const email = auth.email.toLowerCase();
  const needsPsCheck = projects.filter(
    (p) => !p.allowedUserEmails?.some((allowed) => allowed.toLowerCase() === email),
  );

  let accessibleKeys = new Set<string>();
  let hasToken = false;
  if (needsPsCheck.length > 0) {
    const jar = cookies();
    const rawCookie = jar.get(SESSION_COOKIE)?.value || jar.get(AUTH_COOKIE)?.value;
    const { token } = await getValidTidAccessToken(rawCookie);
    hasToken = Boolean(token);
    if (token) accessibleKeys = await getUserAccessiblePsProjectKeys(token, needsPsCheck);
  }

  const visible = projects.filter(
    (p) =>
      p.allowedUserEmails?.some((allowed) => allowed.toLowerCase() === email) ||
      projectHasPsAccess(p, accessibleKeys),
  );

  // Denials otherwise leave no trace, so "I can't see my project" can't be diagnosed later.
  const hidden = projects.filter((p) => !visible.includes(p));
  if (hidden.length > 0) {
    const reasons = hidden.map((p) => {
      if (!normalizePsPortfolioId(p.psPortfolioId) || !p.psProjectId?.trim()) return `${p.id}=no-projectsight-link`;
      if (!hasToken) return `${p.id}=no-projectsight-token`;
      return `${p.id}=not-in-projectsight-list`;
    });
    console.warn(`[project-guard] hid ${hidden.length} project(s) from ${auth.email}: ${reasons.join(', ')}`);
  }
  return visible;
}

/**
 * Guard for authenticated project-scoped API routes. Admins may open any project by
 * URL so they can repair misconfigured ones; their project *list* is still filtered.
 */
export async function requireProjectAccessResponse(
  req: Request,
  projectId: string,
): Promise<NextResponse | null> {
  const auth = getRequestAuthContext(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Authentication required via Trimble Identity.' },
      { status: 401 },
    );
  }
  if (auth.isAdmin) return null;

  const project = getProjectById(projectId);
  if (!project) return null;

  const visible = await filterProjectsForUser(auth, [project]);
  if (visible.length === 0) {
    return NextResponse.json(
      { success: false, error: 'You do not have access to this project in ProjectSight.' },
      { status: 403 },
    );
  }
  return null;
}
