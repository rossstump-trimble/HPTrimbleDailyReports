import { listProjects, ProjectSightHttpError } from '@/lib/projectsight/client';
import type { Project } from '@/types/hpproto';

const CACHE_TTL_MS = 5 * 60 * 1000;
const PORTFOLIO_ID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const cache = new Map<string, { projectIds: Set<string>; expiresAt: number }>();

/** Pulls the GUID out of values pasted from a URL (e.g. a trailing "&"); empty when there isn't one. */
export function normalizePsPortfolioId(raw: string | undefined): string {
  return raw?.match(PORTFOLIO_ID_PATTERN)?.[0].toLowerCase() ?? '';
}

// ProjectSight project IDs are small integers that are only meaningful inside a portfolio.
export function psProjectKey(portfolioId: string | undefined, projectId: string | undefined): string {
  return `${normalizePsPortfolioId(portfolioId)}:${String(projectId ?? '').trim().toLowerCase()}`;
}

export function projectHasPsAccess(project: Project, accessibleKeys: Set<string>): boolean {
  if (!normalizePsPortfolioId(project.psPortfolioId) || !project.psProjectId?.trim()) return false;
  return accessibleKeys.has(psProjectKey(project.psPortfolioId, project.psProjectId));
}

/**
 * Keys ("portfolio:project") of every ProjectSight project this token can see in the
 * portfolios the given projects are linked to. A portfolio that rejects the token
 * (401/403/404) contributes nothing; any other failure is not cached so a blip
 * doesn't hide projects for the whole TTL.
 */
export async function getUserAccessiblePsProjectKeys(
  accessToken: string,
  projects: Project[],
): Promise<Set<string>> {
  const tokenKey = accessToken.slice(-32);
  const now = Date.now();
  const portfolioIds = Array.from(
    new Set(projects.map((p) => normalizePsPortfolioId(p.psPortfolioId)).filter(Boolean)),
  );

  const keys = new Set<string>();
  await Promise.all(
    portfolioIds.map(async (portfolioId) => {
      const cacheKey = `${tokenKey}|${portfolioId}`;
      const cached = cache.get(cacheKey);
      let projectIds = cached && cached.expiresAt > now ? cached.projectIds : null;

      if (!projectIds) {
        try {
          const psProjects = await listProjects(accessToken, portfolioId);
          projectIds = new Set(psProjects.map((p) => p.id.trim().toLowerCase()));
          cache.set(cacheKey, { projectIds, expiresAt: now + CACHE_TTL_MS });
        } catch (err) {
          const noAccess =
            err instanceof ProjectSightHttpError && [401, 403, 404].includes(err.status);
          if (noAccess) {
            projectIds = new Set();
            cache.set(cacheKey, { projectIds, expiresAt: now + CACHE_TTL_MS });
          } else {
            console.error('[project-access] ProjectSight project list failed', portfolioId, err);
            return;
          }
        }
      }

      projectIds.forEach((id) => keys.add(`${portfolioId}:${id}`));
    }),
  );
  return keys;
}
