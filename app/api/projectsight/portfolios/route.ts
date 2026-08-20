import { NextResponse } from 'next/server';
import { listPortfolios } from '@/lib/projectsight/client';
import { projectSightErrorResponse, requireTidToken } from '@/lib/projectsight/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const token = requireTidToken();
  if (token instanceof NextResponse) return token;
  try {
    return NextResponse.json(await listPortfolios(token));
  } catch (err) {
    return projectSightErrorResponse(err);
  }
}
