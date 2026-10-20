import { NextResponse } from 'next/server';
import { getProjects, createProject, getCapacityStatus } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
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
      name: body.name.trim(),
      code: body.code?.trim(),
      workingDays: body.workingDays,
      tradePartners: body.tradePartners,
      psPortfolioId: body.psPortfolioId,
      psProjectId: body.psProjectId,
    });

    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err) {
    console.error('[api/projects] POST failed', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
