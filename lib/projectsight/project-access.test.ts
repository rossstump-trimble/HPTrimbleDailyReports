import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '@/types/hpproto';

vi.mock('@/lib/projectsight/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/projectsight/client')>();
  return { ...actual, listProjects: vi.fn() };
});

import { ProjectSightHttpError, listProjects } from '@/lib/projectsight/client';
import {
  getUserAccessiblePsProjectKeys,
  normalizePsPortfolioId,
  projectHasPsAccess,
  psProjectKey,
} from './project-access';

const PORTFOLIO_A = '8fddbe9f-933a-43b9-8b5e-17ff16f14598';
const PORTFOLIO_B = 'b68d7ced-68be-45a3-b1ae-99b0250db779';

function project(id: string, psPortfolioId?: string, psProjectId?: string): Project {
  return { id, name: id, psPortfolioId, psProjectId } as Project;
}

const mockedListProjects = vi.mocked(listProjects);
let tokenCounter = 0;
// The cache keys on the last 32 characters of the token, so uniqueness has to live at the end.
const freshToken = (): string => `${'x'.repeat(40)}-${++tokenCounter}`.padStart(48, 'x');

describe('normalizePsPortfolioId', () => {
  it('strips characters pasted from a URL query string', () => {
    expect(normalizePsPortfolioId(`${PORTFOLIO_A.toUpperCase()}&`)).toBe(PORTFOLIO_A);
  });

  it('returns empty for values without a GUID', () => {
    expect(normalizePsPortfolioId('not-a-portfolio')).toBe('');
    expect(normalizePsPortfolioId(undefined)).toBe('');
  });
});

describe('getUserAccessiblePsProjectKeys', () => {
  beforeEach(() => {
    mockedListProjects.mockReset();
  });

  it('keeps a project ID scoped to the portfolio that granted it', async () => {
    mockedListProjects.mockImplementation(async (_token, portfolioId) =>
      portfolioId === PORTFOLIO_A ? [{ id: '8', name: 'Mine' }] : [],
    );
    const projects = [project('a', PORTFOLIO_A, '8'), project('b', PORTFOLIO_B, '8')];

    const keys = await getUserAccessiblePsProjectKeys(freshToken(), projects);

    expect(projectHasPsAccess(projects[0], keys)).toBe(true);
    expect(projectHasPsAccess(projects[1], keys)).toBe(false);
  });

  it('treats a portfolio that rejects the token as no access', async () => {
    mockedListProjects.mockRejectedValue(new ProjectSightHttpError(401, 'not authorized'));
    const projects = [project('a', PORTFOLIO_A, '8')];

    const keys = await getUserAccessiblePsProjectKeys(freshToken(), projects);

    expect(projectHasPsAccess(projects[0], keys)).toBe(false);
  });

  it('matches a portfolio ID saved with a trailing "&"', async () => {
    mockedListProjects.mockResolvedValue([{ id: '28', name: 'PHX' }]);
    const projects = [project('phx', `${PORTFOLIO_A}&`, '28')];

    const keys = await getUserAccessiblePsProjectKeys(freshToken(), projects);

    expect(projectHasPsAccess(projects[0], keys)).toBe(true);
  });

  it('does not cache an unexpected failure, so the next call can recover', async () => {
    const token = freshToken();
    const projects = [project('a', PORTFOLIO_A, '8')];
    mockedListProjects.mockRejectedValueOnce(new ProjectSightHttpError(500, 'boom'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const failed = await getUserAccessiblePsProjectKeys(token, projects);
    expect(projectHasPsAccess(projects[0], failed)).toBe(false);

    mockedListProjects.mockResolvedValueOnce([{ id: '8', name: 'Mine' }]);
    const recovered = await getUserAccessiblePsProjectKeys(token, projects);
    expect(projectHasPsAccess(projects[0], recovered)).toBe(true);
  });

  it('reuses a successful lookup for the same token and portfolio', async () => {
    const token = freshToken();
    mockedListProjects.mockResolvedValue([{ id: '8', name: 'Mine' }]);
    const projects = [project('a', PORTFOLIO_A, '8')];

    await getUserAccessiblePsProjectKeys(token, projects);
    await getUserAccessiblePsProjectKeys(token, projects);

    expect(mockedListProjects).toHaveBeenCalledTimes(1);
  });
});

describe('projectHasPsAccess', () => {
  it('denies projects that are not linked to ProjectSight', () => {
    const keys = new Set([psProjectKey(PORTFOLIO_A, '8')]);

    expect(projectHasPsAccess(project('a'), keys)).toBe(false);
    expect(projectHasPsAccess(project('a', PORTFOLIO_A), keys)).toBe(false);
    expect(projectHasPsAccess(project('a', undefined, '8'), keys)).toBe(false);
  });
});
