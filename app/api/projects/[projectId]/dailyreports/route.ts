import { NextResponse } from 'next/server';
import { getStore, getProjectById } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const store = getStore();
    const reports = store.dailyReports
      .filter((r) => r.projectId.toLowerCase() === projectId.toLowerCase())
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const pendingCount = reports.filter((r) => !r.approvalStatus || r.approvalStatus === 'pending').length;
    const approvedCount = reports.filter((r) => r.approvalStatus === 'approved').length;
    const syncedCount = reports.filter((r) => Boolean(r.projectSightDailyId)).length;

    return NextResponse.json({
      projectId,
      projectName: project.name,
      reports,
      counts: {
        total: reports.length,
        pending: pendingCount,
        approved: approvedCount,
        synced: syncedCount,
      },
    });
  } catch (err) {
    console.error('[api/projects/dailyreports] GET failed', err);
    return NextResponse.json({ error: 'Failed to list daily reports' }, { status: 500 });
  }
}
