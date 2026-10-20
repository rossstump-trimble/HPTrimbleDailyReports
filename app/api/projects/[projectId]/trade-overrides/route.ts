import { NextResponse } from 'next/server';
import { getProjectById, setTradeDayOverride } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const project = getProjectById(params.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({
      projectId: project.id,
      tradeDayOverrides: project.tradeDayOverrides || {},
    });
  } catch (err) {
    console.error('[api/projects/trade-overrides] GET failed', err);
    return NextResponse.json({ error: 'Failed to get trade overrides' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const body = (await req.json()) as {
      tradePartnerId: string;
      date: string;
      status: 'onsite' | 'offsite' | 'clear';
    };

    if (!body.tradePartnerId || !body.date || !body.status) {
      return NextResponse.json(
        { error: 'tradePartnerId, date, and status (onsite|offsite|clear) are required' },
        { status: 400 },
      );
    }

    const updated = setTradeDayOverride(
      params.projectId,
      body.tradePartnerId,
      body.date,
      body.status,
    );

    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tradeDayOverrides: updated.tradeDayOverrides || {},
    });
  } catch (err) {
    console.error('[api/projects/trade-overrides] POST failed', err);
    return NextResponse.json({ error: 'Failed to update trade override' }, { status: 500 });
  }
}
