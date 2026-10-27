import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { batchCommitPunchItems, getProjectById, getPunchItems } from '@/lib/store';
import { createPunchItem, updatePunchItem } from '@/lib/projectsight/client';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import type { PunchCommitActionItem } from '@/types/punch';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = (await req.json()) as { items?: PunchCommitActionItem[] };
    const actionItems = body.items || [];

    if (!Array.isArray(actionItems) || actionItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided to commit' }, { status: 400 });
    }

    const project = getProjectById(projectId);
    let token: string | null = null;
    let psPortfolioId = project?.psPortfolioId || DEFAULT_DESTINATION.portfolioId;
    let psProjectId = project?.psProjectId || DEFAULT_DESTINATION.projectId;

    try {
      const jar = cookies();
      token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      psPortfolioId = project?.psPortfolioId || dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      psProjectId = project?.psProjectId || dest.projectId || DEFAULT_DESTINATION.projectId;
    } catch {
      // Running outside Next.js server context (e.g. tests)
    }

    const psErrors: string[] = [];
    const existingLocalItems = getPunchItems(projectId);

    // If authenticated, push actions to live ProjectSight
    if (token && psPortfolioId && psProjectId) {
      for (const actionItem of actionItems) {
        try {
          if (actionItem.action === 'create' && actionItem.item) {
            const createdPs = await createPunchItem(token, psPortfolioId, psProjectId, {
              Description: actionItem.item.description || 'Punch item',
              Status: 'Open',
              Importance: actionItem.item.importance || 'Normal',
              LocationDescription: actionItem.item.locationDescription || '',
            });
            if (createdPs.id) {
              actionItem.item.psPunchId = createdPs.id;
            }
          } else if (actionItem.action === 'resolve' || actionItem.action === 'reinspect') {
            let psTargetId = actionItem.targetItemId;
            if (!psTargetId && actionItem.targetItemNumber) {
              const matched = existingLocalItems.find(
                (p) => p.itemNumber === actionItem.targetItemNumber,
              );
              psTargetId = matched?.psPunchId || matched?.id;
            } else if (psTargetId) {
              const matched = existingLocalItems.find((p) => p.id === psTargetId);
              if (matched?.psPunchId) {
                psTargetId = matched.psPunchId;
              }
            }
            if (psTargetId) {
              await updatePunchItem(token, psPortfolioId, psProjectId, psTargetId, {
                Status: actionItem.action === 'resolve' ? 'Resolved' : 'Reopened',
                Comments: actionItem.notes ? [{ Comments: actionItem.notes }] : [],
              });
            }
          }
        } catch (err) {
          psErrors.push(`PS Sync error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // Always commit to local store
    const localResult = batchCommitPunchItems(projectId, actionItems);
    localResult.errors.push(...psErrors);

    return NextResponse.json({
      ...localResult,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Commit failed' },
      { status: 500 },
    );
  }
}
