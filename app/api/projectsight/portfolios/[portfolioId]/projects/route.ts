import { NextResponse } from 'next/server';
import { listProjects } from '@/lib/projectsight/client';
import { projectSightErrorResponse, requireTidToken } from '@/lib/projectsight/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { portfolioId: string } },
) {
  const token = requireTidToken();
  if (token instanceof NextResponse) return token;
  try {
    return NextResponse.json(await listProjects(token, params.portfolioId));
  } catch (err) {
    return projectSightErrorResponse(err);
  }
}
