import { NextResponse } from 'next/server';
import { toggleCompanyTracking, getProjectById } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string; companyId: string } },
) {
  try {
    const { projectId, companyId: rawCompanyId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as { isTracked?: boolean; companyId?: string };
    const isTracked = Boolean(body.isTracked);
    const targetCompanyId = body.companyId || decodeURIComponent(rawCompanyId || '');
    const updated = toggleCompanyTracking(projectId, targetCompanyId, isTracked);

    return NextResponse.json({
      success: true,
      companies: updated,
      trackedCount: updated.filter((c) => c.isTracked).length,
    });
  } catch (err) {
    console.error('[api/companies/tracking] PATCH failed', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Tracking update failed' },
      { status: 500 },
    );
  }
}
