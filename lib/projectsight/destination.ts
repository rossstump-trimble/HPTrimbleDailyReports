export const DESTINATION_COOKIE = 'ps_destination';

export interface ProjectSightDestination {
  portfolioId: string;
  projectId: string;
  portfolioName: string;
  projectName: string;
}

export function parseDestinationJson(raw: string | undefined | null): ProjectSightDestination | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ProjectSightDestination>;
    if (!parsed.portfolioId || !parsed.projectId) return null;
    return {
      portfolioId: String(parsed.portfolioId),
      projectId: String(parsed.projectId),
      portfolioName: String(parsed.portfolioName || ''),
      projectName: String(parsed.projectName || ''),
    };
  } catch {
    return null;
  }
}

export function destinationFromSearchParams(
  params: URLSearchParams,
  cookie: ProjectSightDestination | null,
): ProjectSightDestination | null {
  const portfolioId = params.get('psPortfolio') || cookie?.portfolioId || '';
  const projectId = params.get('psProject') || cookie?.projectId || '';
  if (!portfolioId || !projectId) return null;
  return {
    portfolioId,
    projectId,
    portfolioName: cookie?.portfolioName || '',
    projectName: cookie?.projectName || '',
  };
}

export function serializeDestination(dest: ProjectSightDestination): string {
  return JSON.stringify(dest);
}
