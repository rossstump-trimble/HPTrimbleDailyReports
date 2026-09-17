import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getInspectionsForProject, saveInspectionRecord } from '@/lib/store';
import { listChecklists, FIXTURE_PROJECTSIGHT_CHECKLISTS } from '@/lib/projectsight/client';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import type { InspectionRecord } from '@/types/inspections';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    let token: string | null = null;
    let psPortfolioId = DEFAULT_DESTINATION.portfolioId;
    let psProjectId = DEFAULT_DESTINATION.projectId;

    try {
      const jar = cookies();
      token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;
    } catch {
      // Running outside Next.js server context (e.g. tests)
    }

    let records = getInspectionsForProject(projectId);

    if (records.length === 0) {
      if (token && psPortfolioId && psProjectId) {
        try {
          const rawChecklists = await listChecklists(token, psPortfolioId, psProjectId);
          records = rawChecklists.map((ck, idx) => ({
            id: `insp-${projectId}-${ck.id || idx + 1}`,
            projectId,
            psRecordId: ck.id,
            number: ck.number || `CK-00${idx + 1}`,
            title: ck.title,
            location: ck.location,
            status: (ck.workflowState.toLowerCase() === 'approved' ? 'approved' : 'open') as InspectionRecord['status'],
            items: (ck.items || []).map((it, itemIdx) => ({
              id: it.id || `item-${itemIdx + 1}`,
              itemNumber: it.itemNumber || itemIdx + 1,
              prompt: it.prompt,
              result: (it.result as InspectionRecord['items'][0]['result']) || 'Unchecked',
              comment: it.comment,
            })),
            source: 'projectsight',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          for (const rec of records) {
            saveInspectionRecord(rec);
          }
        } catch (err) {
          console.warn('[inspections] listChecklists failed, seeding default fixture:', err);
        }
      }

      if (records.length === 0) {
        // Seed default fixture for demo & offline
        records = FIXTURE_PROJECTSIGHT_CHECKLISTS.map((ck, idx) => ({
          id: `insp-${projectId}-${ck.id || idx + 1}`,
          projectId,
          psRecordId: ck.id,
          number: ck.number,
          title: ck.title,
          location: ck.location,
          status: 'open',
          items: (ck.items || []).map((it, itemIdx) => ({
            id: it.id || `item-${itemIdx + 1}`,
            itemNumber: it.itemNumber || itemIdx + 1,
            prompt: it.prompt,
            result: 'Unchecked',
          })),
          source: 'projectsight',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        for (const rec of records) {
          saveInspectionRecord(rec);
        }
      }
    }

    return NextResponse.json({ success: true, inspections: records });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch inspections' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = (await req.json().catch(() => ({}))) as Partial<InspectionRecord>;

    if (body.title && body.number) {
      const newRecord: InspectionRecord = {
        id: body.id || `insp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        projectId,
        number: body.number,
        title: body.title,
        location: body.location,
        status: body.status || 'open',
        items: body.items || [],
        source: 'upload',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveInspectionRecord(newRecord);
      return NextResponse.json({ success: true, inspection: newRecord });
    }

    // Force re-sync from ProjectSight
    let token: string | null = null;
    let psPortfolioId = DEFAULT_DESTINATION.portfolioId;
    let psProjectId = DEFAULT_DESTINATION.projectId;

    try {
      const jar = cookies();
      token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;
    } catch {
      // Running outside Next.js server context
    }

    if (token && psPortfolioId && psProjectId) {
      const rawChecklists = await listChecklists(token, psPortfolioId, psProjectId);
      const synced: InspectionRecord[] = rawChecklists.map((ck, idx) => ({
        id: `insp-${projectId}-${ck.id || idx + 1}`,
        projectId,
        psRecordId: ck.id,
        number: ck.number || `CK-00${idx + 1}`,
        title: ck.title,
        location: ck.location,
        status: (ck.workflowState.toLowerCase() === 'approved' ? 'approved' : 'open') as InspectionRecord['status'],
        items: (ck.items || []).map((it, itemIdx) => ({
          id: it.id || `item-${itemIdx + 1}`,
          itemNumber: it.itemNumber || itemIdx + 1,
          prompt: it.prompt,
          result: (it.result as InspectionRecord['items'][0]['result']) || 'Unchecked',
          comment: it.comment,
        })),
        source: 'projectsight',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      for (const rec of synced) {
        saveInspectionRecord(rec);
      }
      return NextResponse.json({ success: true, inspections: synced });
    }

    const current = getInspectionsForProject(projectId);
    return NextResponse.json({ success: true, inspections: current });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
