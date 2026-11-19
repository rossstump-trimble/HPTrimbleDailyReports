import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '@/types/hpproto';
import type { AuthenticatedContext } from '@/lib/api-auth';

vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => ({ value: 'raw-cookie' }) }),
}));
vi.mock('@/lib/store', () => ({ getProjectById: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ getRequestAuthContext: vi.fn() }));
vi.mock('@/lib/projectsight/session-token', () => ({ getValidTidAccessToken: vi.fn() }));
vi.mock('@/lib/projectsight/project-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/projectsight/project-access')>();
  return { ...actual, getUserAccessiblePsProjectKeys: vi.fn() };
});

import { getRequestAuthContext } from '@/lib/api-auth';
import { getProjectById } from '@/lib/store';
import { getValidTidAccessToken } from '@/lib/projectsight/session-token';
import {
  getUserAccessiblePsProjectKeys,
  psProjectKey,
} from '@/lib/projectsight/project-access';
import { filterProjectsForUser, requireProjectAccessResponse } from './project-guard';

const PORTFOLIO = '8fddbe9f-933a-43b9-8b5e-17ff16f14598';

function project(id: string, overrides: Partial<Project> = {}): Project {
  return { id, name: id, psPortfolioId: PORTFOLIO, psProjectId: id, ...overrides } as Project;
}

function auth(overrides: Partial<AuthenticatedContext> = {}): AuthenticatedContext {
  return {
    authenticated: true,
    isAdmin: false,
    email: 'super@henselphelps.com',
    name: 'Super',
    session: null,
    ...overrides,
  };
}

describe('filterProjectsForUser', () => {
  beforeEach(() => {
    vi.mocked(getValidTidAccessToken).mockResolvedValue({ token: 'tok' });
    vi.mocked(getUserAccessiblePsProjectKeys).mockResolvedValue(new Set([psProjectKey(PORTFOLIO, '1')]));
  });

  it('shows only projects the user has in ProjectSight', async () => {
    const visible = await filterProjectsForUser(auth(), [project('1'), project('2')]);

    expect(visible.map((p) => p.id)).toEqual(['1']);
  });

  it('applies to admins too, so their default view matches ProjectSight', async () => {
    const visible = await filterProjectsForUser(auth({ isAdmin: true }), [project('1'), project('2')]);

    expect(visible.map((p) => p.id)).toEqual(['1']);
  });

  it('shows projects that list the user as an exception', async () => {
    const exception = project('2', { allowedUserEmails: ['SUPER@henselphelps.com'] });

    const visible = await filterProjectsForUser(auth(), [project('1'), exception]);

    expect(visible.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('hides everything that needs ProjectSight when there is no ProjectSight token', async () => {
    vi.mocked(getValidTidAccessToken).mockResolvedValue({ token: null });

    const visible = await filterProjectsForUser(auth(), [project('1')]);

    expect(visible).toEqual([]);
  });

  it('hides projects with no ProjectSight link', async () => {
    const unlinked = project('3', { psPortfolioId: undefined, psProjectId: undefined });

    const visible = await filterProjectsForUser(auth(), [unlinked]);

    expect(visible).toEqual([]);
  });
});

describe('requireProjectAccessResponse', () => {
  beforeEach(() => {
    vi.mocked(getValidTidAccessToken).mockResolvedValue({ token: 'tok' });
    vi.mocked(getUserAccessiblePsProjectKeys).mockResolvedValue(new Set([psProjectKey(PORTFOLIO, '1')]));
  });

  it('rejects unauthenticated callers', async () => {
    vi.mocked(getRequestAuthContext).mockReturnValue(auth({ authenticated: false }));

    const res = await requireProjectAccessResponse(new Request('http://x'), '1');

    expect(res?.status).toBe(401);
  });

  it('rejects a user without ProjectSight access to the project', async () => {
    vi.mocked(getRequestAuthContext).mockReturnValue(auth());
    vi.mocked(getProjectById).mockReturnValue(project('2'));

    const res = await requireProjectAccessResponse(new Request('http://x'), '2');

    expect(res?.status).toBe(403);
  });

  it('allows a user with ProjectSight access', async () => {
    vi.mocked(getRequestAuthContext).mockReturnValue(auth());
    vi.mocked(getProjectById).mockReturnValue(project('1'));

    expect(await requireProjectAccessResponse(new Request('http://x'), '1')).toBeNull();
  });

  it('lets admins open any project by URL', async () => {
    vi.mocked(getRequestAuthContext).mockReturnValue(auth({ isAdmin: true }));
    vi.mocked(getProjectById).mockReturnValue(project('2'));

    expect(await requireProjectAccessResponse(new Request('http://x'), '2')).toBeNull();
  });
});
