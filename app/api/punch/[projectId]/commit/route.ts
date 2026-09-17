import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { batchCommitPunchItems } from '@/lib/store';
import { createPunchItem, updatePunchItem } from '@/lib/projectsight/client';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import type { PunchCommitActionItem, PunchCommitResult } from '@/types/punch';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = (await req.json()) as { items?: PunchCommitActionItem[] };
    const actionItems = body.items || [];

    if (!Array.isArray(actionItems) || actionItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided to commit' }, { status: 400 });
    }

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

    const psErrors: string[] = [];

    // If authenticated, push actions to live ProjectSight
    if (token && psPortfolioId && psProjectId) {
      for (const actionItem of actionItems) {
        try {
          if (actionItem.action === 'create' && actionItem.item) {
            await createPunchItem(token, psPortfolioId, psProjectId, {
              Description: actionItem.item.description || 'Punch item',
              Status: 'Open',
              Importance: actionItem.item.importance || 'Normal',
              LocationDescription: actionItem.item.locationDescription || '',
            });
          } else if ((actionItem.action === 'resolve' || actionItem.action === 'reinspect') && actionItem.targetItemId) {
            await updatePunchItem(token, psPortfolioId, psProjectId, actionItem.targetItemId, {
              Status: actionItem.action === 'resolve' ? 'Resolved' : 'Reopened',
              Comments: actionItem.notes ? [{ Comments: actionItem.notes }] : [],
            });
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
