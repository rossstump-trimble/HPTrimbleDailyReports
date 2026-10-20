import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/local-session';
import { ProjectSightHttpError } from '@/lib/projectsight/client';
import { getValidTidAccessToken, tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';

export function requireTidToken(): string | NextResponse {
  const token = tidAccessTokenFromCookie(cookies().get(SESSION_COOKIE)?.value);
  if (!token) {
    return NextResponse.json(
      { error: 'Sign in required' },
      { status: 401 },
    );
  }
  return token;
}

export async function requireTidTokenAsync(): Promise<string | NextResponse> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  const { token } = await getValidTidAccessToken(raw);
  if (!token) {
    return NextResponse.json(
      { error: 'Sign in required' },
      { status: 401 },
    );
  }
  return token;
}

export function projectSightErrorResponse(err: unknown): NextResponse {
  if (err instanceof ProjectSightHttpError) {
    if (err.status === 401 || err.status === 403) {
      return NextResponse.json(
        { error: 'No ProjectSight access for this user or missing API scope.' },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: `ProjectSight error ${err.status}` },
      { status: 502 },
    );
  }
  return NextResponse.json({ error: 'ProjectSight request failed' }, { status: 502 });
}
