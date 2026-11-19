import { listProjects, ProjectSightRef } from '@/lib/projectsight/client';
import type { Project } from '@/types/hpproto';

const cache = new Map<string, { projectIds: Set<string>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getUserAccessiblePsProjects(
  accessToken: string,
  projects: Project[],
): Promise<Set<string>> {
  const cacheKey = accessToken.slice(-32);
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.projectIds;
  }

  const portfolioIds = Array.from(
    new Set(projects.map((p) => p.psPortfolioId?.trim()).filter(Boolean)),
  ) as string[];

  const accessibleIds = new Set<string>();

  await Promise.all(
    portfolioIds.map(async (portfolioId) => {
      try {
        const psProjects: ProjectSightRef[] = await listProjects(accessToken, portfolioId);
        for (const p of psProjects) {
          if (p.id) accessibleIds.add(String(p.id).toLowerCase());
        }
      } catch {
        // User lacks portfolio access or network failed
      }
    }),
  );

  cache.set(cacheKey, { projectIds: accessibleIds, expiresAt: now + CACHE_TTL_MS });
  return accessibleIds;
}
