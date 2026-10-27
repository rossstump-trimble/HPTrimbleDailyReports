import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getPunchItems, upsertPunchItem } from '@/lib/store';
import { listPunchItems, normalizePunchItem } from '@/lib/projectsight/client';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { SESSION_COOKIE } from '@/lib/local-session';
import { getValidTidAccessToken, tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import type { PunchItem } from '@/types/punch';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    let token: string | null = null;
    let psPortfolioId = DEFAULT_DESTINATION.portfolioId;
    let psProjectId = DEFAULT_DESTINATION.projectId;

    try {
      const jar = cookies();
      const tokenRes = await getValidTidAccessToken(jar.get(SESSION_COOKIE)?.value);
      token = tokenRes.token || tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      psPortfolioId = dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      psProjectId = dest.projectId || DEFAULT_DESTINATION.projectId;
    } catch {
      // Running outside Next.js server context (e.g. tests)
    }

    let items: PunchItem[] = [];

    if (token && psPortfolioId && psProjectId) {
      try {
        const rawItems = await listPunchItems(token, psPortfolioId, psProjectId);
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          items = rawItems.map((r) => normalizePunchItem(r, projectId));
        }
      } catch (err) {
        console.warn('[punch items] failed to fetch from ProjectSight, falling back to local store:', err);
      }
    }

    if (items.length === 0) {
      items = getPunchItems(projectId);
    }

    return NextResponse.json({ success: true, items });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch punch items' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = (await req.json()) as Partial<PunchItem>;

    if (!body.description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const item: PunchItem = {
      id: body.id || `punch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      itemNumber: body.itemNumber,
      description: body.description,
      status: body.status || 'open',
      tradeName: body.tradeName || 'Unassigned',
      locationDescription: body.locationDescription || '',
      importance: body.importance || 'normal',
      reportedDate: body.reportedDate || new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate,
      confidence: body.confidence,
    };

    const saved = upsertPunchItem(projectId, item);
    return NextResponse.json({ success: true, item: saved });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save punch item' },
      { status: 500 },
    );
  }
}
