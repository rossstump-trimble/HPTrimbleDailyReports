import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getProjectById,
  updateProjectTradePartners,
  removeTradePartnerFromProject,
  getProjects,
  getProjectCompanies,
  setProjectCompanies,
  toggleCompanyTracking,
} from '@/lib/store';
import { listCompaniesWithContacts } from '@/lib/projectsight/client';
import { DEFAULT_DESTINATION, DESTINATION_COOKIE, destinationFromCookieWithFallback } from '@/lib/projectsight/destination';
import { AUTH_COOKIE, SESSION_COOKIE } from '@/lib/local-session';
import { getValidTidAccessToken, tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import { slugTradePartnerId } from '@/lib/trade-partner';
import type { TradePartner, ProjectCompany, CompanyContact } from '@/types/hpproto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    const allCompanies = getProjectCompanies(projectId);
    const trackedCount = allCompanies.filter((c) => c.isTracked).length;

    let filtered = allCompanies;
    if (search) {
      filtered = allCompanies.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.trade || '').toLowerCase().includes(search) ||
          c.contacts.some(
            (ct) =>
              ct.displayName.toLowerCase().includes(search) ||
              (ct.email || '').toLowerCase().includes(search),
          ),
      );
    }

    if (pageParam != null || pageSizeParam != null) {
      const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
      const pageSize = Math.min(200, Math.max(1, parseInt(pageSizeParam || '50', 10) || 50));
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      const pagedCompanies = filtered.slice(start, start + pageSize);

      return NextResponse.json({
        success: true,
        projectId,
        count: allCompanies.length,
        filteredCount: total,
        page: safePage,
        pageSize,
        totalPages,
        companies: pagedCompanies,
        trackedCount,
        tradePartners: project.tradePartners || [],
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      count: allCompanies.length,
      filteredCount: filtered.length,
      companies: filtered,
      trackedCount,
      tradePartners: project.tradePartners || [],
    });
  } catch (err) {
    console.error('[api/companies] GET failed', err);
    return NextResponse.json({ success: false, error: 'Failed to get companies' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: 'sync-connected' | 'preview-sync-connected' | 'clear' | 'add' | 'copy-from-project' | 'delete' | 'toggle-tracking';
      sourceProjectId?: string;
      sourcePortfolioId?: string;
      name?: string;
      category?: string;
      contactEmail?: string;
      companyId?: string;
      id?: string;
      purgeReports?: boolean;
      isTracked?: boolean;
      trackImported?: boolean;
      selectedCompanyIds?: string[];
    };

    const action = body.action || 'sync-connected';

    // Action: Toggle tracking
    if (action === 'toggle-tracking') {
      const companyId = (body.companyId || body.id || body.name || '').trim();
      if (!companyId) {
        return NextResponse.json({ success: false, error: 'companyId is required to toggle tracking' }, { status: 400 });
      }
      const isTracked = Boolean(body.isTracked);
      const updated = toggleCompanyTracking(projectId, companyId, isTracked);
      return NextResponse.json({
        success: true,
        companies: updated,
        trackedCount: updated.filter((c) => c.isTracked).length,
      });
    }

    // Action: Delete a single company
    if (action === 'delete') {
      const companyId = (body.companyId || body.id || '').trim();
      const name = (body.name || '').trim();
      const target = companyId || name;
      if (!target) {
        return NextResponse.json({ success: false, error: 'companyId or name is required to delete' }, { status: 400 });
      }
      const purgeReports = body.purgeReports !== false;
      const res = removeTradePartnerFromProject(projectId, target, purgeReports);
      const current = getProjectCompanies(projectId).filter(
        (c) => c.id.toLowerCase() !== target.toLowerCase() && c.name.toLowerCase() !== target.toLowerCase(),
      );
      setProjectCompanies(projectId, current);
      return NextResponse.json({
        success: true,
        count: current.length,
        companies: current,
        tradePartners: res.project?.tradePartners || [],
        purgedReportsCount: res.purgedReportsCount,
        message: `Removed company "${name || companyId}" from the project.`,
      });
    }

    // Action 1: Clear all companies
    if (action === 'clear') {
      setProjectCompanies(projectId, []);
      return NextResponse.json({
        success: true,
        count: 0,
        companies: [],
        tradePartners: [],
        message: 'Cleared all companies from the bowling sheet.',
      });
    }

    // Action 2: Add single company manually
    if (action === 'add') {
      const name = (body.name || '').trim();
      if (!name) {
        return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
      }
      const current = getProjectCompanies(projectId);
      const compId = slugTradePartnerId(name);
      const alreadyExists = current.some(
        (tp) => tp.id.toLowerCase() === compId.toLowerCase() || tp.name.toLowerCase() === name.toLowerCase(),
      );
      if (alreadyExists) {
        return NextResponse.json({
          success: true,
          count: current.length,
          companies: current,
          tradePartners: project.tradePartners || [],
          message: `"${name}" is already in the bowling sheet list.`,
        });
      }
      const newCompany: ProjectCompany = {
        id: compId,
        name,
        trade: (body.category || 'Trade Partner').trim(),
        isTracked: true,
        contacts: body.contactEmail
          ? [
              {
                id: `c-${Date.now()}`,
                firstName: name,
                lastName: '',
                displayName: name,
                email: body.contactEmail.trim(),
                title: 'Foreman',
              },
            ]
          : [],
      };
      current.push(newCompany);
      setProjectCompanies(projectId, current);
      return NextResponse.json({
        success: true,
        count: current.length,
        companies: current,
        tradePartners: getProjectById(projectId)?.tradePartners || [],
        message: `Added "${name}" to the bowling sheet.`,
      });
    }

    // Action 3: Copy companies from another local project
    if (action === 'copy-from-project') {
      const sourceId = (body.sourceProjectId || '').trim();
      if (!sourceId) {
        return NextResponse.json({ success: false, error: 'Source project ID is required' }, { status: 400 });
      }
      const sourceCompanies = getProjectCompanies(sourceId);
      setProjectCompanies(projectId, [...sourceCompanies]);
      const updatedProj = getProjectById(projectId);
      return NextResponse.json({
        success: true,
        count: sourceCompanies.length,
        companies: sourceCompanies,
        tradePartners: updatedProj?.tradePartners || [],
        message: `Copied ${sourceCompanies.length} companies from "${sourceId}".`,
      });
    }

    // Action 4: Sync or Preview Sync from connected ProjectSight project
    if (action === 'sync-connected' || action === 'preview-sync-connected') {
      const jar = cookies();
      const rawCookie = jar.get(SESSION_COOKIE)?.value || jar.get(AUTH_COOKIE)?.value;
      const tokenRes = await getValidTidAccessToken(rawCookie);
      const token = tokenRes.token || tidAccessTokenFromCookie(rawCookie);
      const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
      const psPortfolioId = body.sourcePortfolioId || project.psPortfolioId || dest.portfolioId || DEFAULT_DESTINATION.portfolioId;
      const psProjectId = body.sourceProjectId || project.psProjectId || dest.projectId || DEFAULT_DESTINATION.projectId;

      if (!token) {
        // Fallback for local development without Trimble Identity: check other projects
        const otherProjects = getProjects().filter(p => p.id.toLowerCase() !== projectId.toLowerCase());
        return NextResponse.json({
          success: false,
          requiresTid: true,
          error: 'Sign in with Trimble Identity to load live companies from ProjectSight, or copy from a project.',
          availableLocalProjects: otherProjects.map(p => ({ id: p.id, name: p.name, count: p.tradePartners?.length || 0 })),
        }, { status: 401 });
      }

      if (!psPortfolioId || !psProjectId) {
        return NextResponse.json({
          success: false,
          error: 'Connected ProjectSight portfolio and project could not be resolved.',
        }, { status: 400 });
      }

      const rawCompanies = await listCompaniesWithContacts(token, psPortfolioId, psProjectId);
      const currentCompanies = getProjectCompanies(projectId);
      const existingMap = new Map(currentCompanies.map((c) => [c.id.toLowerCase(), c]));
      const nameMap = new Map(currentCompanies.map((c) => [c.name.toLowerCase(), c]));

      let addedCount = 0;
      let existingMatchCount = 0;
      const updatedList: ProjectCompany[] = [];
      const candidateCompanies: Array<{
        id: string;
        psCompanyId?: number;
        name: string;
        trade: string;
        contactsCount: number;
        alreadyExists: boolean;
      }> = [];
      const seenIncomingIds = new Set<string>();
      const selectedFilterSet = Array.isArray(body.selectedCompanyIds)
        ? new Set(body.selectedCompanyIds.map((id) => String(id).trim().toLowerCase()).filter(Boolean))
        : null;

      for (const raw of rawCompanies) {
        const compName = String(
          raw.Name || raw.CompanyName || raw.name || raw.TradeName || raw.Title || '',
        ).trim();
        if (!compName) continue;
        const compId = slugTradePartnerId(compName);
        if (seenIncomingIds.has(compId.toLowerCase())) continue;
        seenIncomingIds.add(compId.toLowerCase());

        const psCompId = Number(raw.CompanyID || raw.CompanyId || raw.Id || raw.id) || undefined;
        const cat = String(raw.Trade || raw.Category || raw.Type || 'Trade Partner').trim();

        const rawContacts = Array.isArray(raw.Contacts) ? raw.Contacts : [];
        const contacts: CompanyContact[] = rawContacts
          .map((c: unknown) => {
            if (!c || typeof c !== 'object') return null;
            const rec = c as Record<string, unknown>;
            const firstName = String(rec.FirstName || rec.firstName || '').trim();
            const lastName = String(rec.LastName || rec.lastName || '').trim();
            const displayName = String(rec.DisplayName || rec.displayName || `${firstName} ${lastName}`).trim();
            const cid = String(rec.ContactID || rec.ContactId || rec.Id || rec.id || slugTradePartnerId(displayName || 'contact'));
            return {
              id: cid,
              firstName,
              lastName,
              displayName: displayName || `${firstName} ${lastName}`.trim(),
              email: String(rec.EMail || rec.Email || rec.email || '').trim() || undefined,
              title: String(rec.Title || rec.title || '').trim() || undefined,
              phone: String(rec.Tel || rec.Phone || rec.phone || '').trim() || undefined,
            } as CompanyContact;
          })
          .filter(Boolean) as CompanyContact[];

        const existing = existingMap.get(compId.toLowerCase()) || nameMap.get(compName.toLowerCase());
        candidateCompanies.push({
          id: compId,
          psCompanyId: psCompId,
          name: compName,
          trade: cat || 'Trade Partner',
          contactsCount: contacts.length,
          alreadyExists: Boolean(existing),
        });

        // If user provided an explicit selection list, skip importing companies not in that list
        const isSelected =
          !selectedFilterSet ||
          selectedFilterSet.has(compId.toLowerCase()) ||
          selectedFilterSet.has(compName.toLowerCase()) ||
          (psCompId != null && selectedFilterSet.has(String(psCompId)));

        if (!isSelected) {
          continue;
        }

        if (existing) {
          existingMatchCount++;
          const mergedContacts = [...existing.contacts];
          for (const newC of contacts) {
            const hasMatch = mergedContacts.some(
              (mc) =>
                mc.id === newC.id ||
                (newC.email && mc.email && mc.email.toLowerCase() === newC.email.toLowerCase()) ||
                (newC.displayName && mc.displayName && mc.displayName.toLowerCase() === newC.displayName.toLowerCase()),
            );
            if (!hasMatch) mergedContacts.push(newC);
          }

          updatedList.push({
            ...existing,
            psCompanyId: psCompId || existing.psCompanyId,
            trade: cat || existing.trade,
            contacts: mergedContacts,
          });
        } else {
          addedCount++;
          const excludedSet = new Set((project.excludedTradePartnerIds || []).map((x) => x.toLowerCase()));
          const isExcluded =
            excludedSet.has(compId.toLowerCase()) ||
            excludedSet.has(compName.toLowerCase()) ||
            excludedSet.has(slugTradePartnerId(compName));
          const shouldTrack = body.trackImported !== undefined ? Boolean(body.trackImported) : !isExcluded;

          updatedList.push({
            id: compId,
            psCompanyId: psCompId,
            name: compName,
            trade: cat || 'Trade Partner',
            isTracked: shouldTrack,
            contacts,
          });
        }
      }

      const updatedIds = new Set(updatedList.map((u) => u.id.toLowerCase()));
      // Preserve existing companies not returned in this PS sync
      for (const comp of currentCompanies) {
        if (!updatedIds.has(comp.id.toLowerCase())) {
          updatedList.push(comp);
          updatedIds.add(comp.id.toLowerCase());
        }
      }

      if (action === 'preview-sync-connected') {
        return NextResponse.json({
          success: true,
          preview: true,
          remoteCount: seenIncomingIds.size,
          addedCount,
          existingMatchCount,
          currentCount: currentCompanies.length,
          totalAfterSync: updatedList.length,
          sampleNames: updatedList.slice(0, 8).map((c) => c.name),
          candidates: candidateCompanies,
          message: `Found ${seenIncomingIds.size} company record(s) in ProjectSight (${addedCount} new to add, ${existingMatchCount} already in project).`,
        });
      }

      setProjectCompanies(projectId, updatedList);
      const updatedProj = getProjectById(projectId);

      return NextResponse.json({
        success: true,
        count: updatedList.length,
        addedCount,
        companies: updatedList,
        tradePartners: updatedProj?.tradePartners || [],
        message: `Successfully loaded ${addedCount} new companies (${updatedList.length} total) from ProjectSight.`,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[api/companies] POST failed', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Company operation failed' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || searchParams.get('id') || '';
    const name = searchParams.get('name') || searchParams.get('companyName') || '';
    const target = companyId || name;
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'companyId or name query parameter is required' },
        { status: 400 },
      );
    }
    const res = removeTradePartnerFromProject(projectId, target, true);
    return NextResponse.json({
      success: true,
      count: res.project?.tradePartners?.length || 0,
      tradePartners: res.project?.tradePartners || [],
      purgedReportsCount: res.purgedReportsCount,
      message: `Deleted "${name || companyId}" from project.`,
    });
  } catch (err) {
    console.error('[api/companies] DELETE failed', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Delete company failed' },
      { status: 500 },
    );
  }
}
