import { NextResponse } from 'next/server';
import { getProjects, createProject, getCapacityStatus } from '@/lib/store';
import { requireAuthResponse } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const projects = getProjects();
    const capacity = getCapacityStatus();
    return NextResponse.json({
      projects,
      capacity,
    });
  } catch (err) {
    console.error('[api/projects] GET failed', err);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = requireAuthResponse(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      name: string;
      code?: string;
      workingDays?: number[];
      tradePartners?: Array<{ id: string; name: string; contactEmail?: string; category?: string }>;
      psPortfolioId?: string;
      psProjectId?: string;
    };

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const created = createProject({
      name: body.name.trim().slice(0, 160),
      code: body.code?.trim().slice(0, 32),
      workingDays: body.workingDays,
      tradePartners: body.tradePartners,
      psPortfolioId: body.psPortfolioId?.trim().slice(0, 64),
      psProjectId: body.psProjectId?.trim().slice(0, 64),
    });

    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err) {
    console.error('[api/projects] POST failed', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
