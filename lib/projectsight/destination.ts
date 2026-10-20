export const DESTINATION_COOKIE = 'ps_destination';

export const DEFAULT_DESTINATION: ProjectSightDestination = {
  portfolioId: '8fddbe9f-933a-43b9-8b5e-17ff16f14598',
  projectId: '1025',
  portfolioName: 'Hensel Phelps',
  projectName: 'Hensel Phelps Demo Project',
};

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

export function destinationFromCookieValue(raw: string | undefined | null): ProjectSightDestination | null {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return parseDestinationJson(decoded);
}

export function destinationFromCookieWithFallback(raw: string | undefined | null): ProjectSightDestination {
  return destinationFromCookieValue(raw) ?? DEFAULT_DESTINATION;
}

export function destinationFromSearchParams(
  params: URLSearchParams,
  cookie: ProjectSightDestination | null,
): ProjectSightDestination | null {
  const fallback = cookie ?? DEFAULT_DESTINATION;
  const portfolioId = params.get('psPortfolio') || fallback.portfolioId;
  const projectId = params.get('psProject') || fallback.projectId;
  if (!portfolioId || !projectId) return null;
  return {
    portfolioId,
    projectId,
    portfolioName: fallback.portfolioName || '',
    projectName: fallback.projectName || '',
  };
}

export function serializeDestination(dest: ProjectSightDestination): string {
  return JSON.stringify(dest);
}
