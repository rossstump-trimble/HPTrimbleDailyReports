import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { addCompanyContact, getProjectById, getProjectCompanies } from '@/lib/store';
import { createProjectSightCompanyContact } from '@/lib/projectsight/client';
import { SESSION_COOKIE } from '@/lib/local-session';
import { tidAccessTokenFromCookie } from '@/lib/projectsight/session-token';
import { destinationFromCookieWithFallback, DEFAULT_DESTINATION, DESTINATION_COOKIE } from '@/lib/projectsight/destination';
import { slugTradePartnerId } from '@/lib/trade-partner';
import type { CompanyContact } from '@/types/hpproto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; companyId: string } },
) {
  try {
    const { projectId, companyId } = params;
    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      title?: string;
      phone?: string;
    };

    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and Last name are required' },
        { status: 400 },
      );
    }

    const email = (body.email || '').trim() || undefined;
    const title = (body.title || '').trim() || undefined;
    const phone = (body.phone || '').trim() || undefined;

    const jar = cookies();
    const token = tidAccessTokenFromCookie(jar.get(SESSION_COOKIE)?.value);
    const dest = destinationFromCookieWithFallback(jar.get(DESTINATION_COOKIE)?.value);
    const portfolioId = dest.portfolioId || project.psPortfolioId || DEFAULT_DESTINATION.portfolioId;

    const companies = getProjectCompanies(projectId);
    const targetCompany = companies.find(
      (c) => c.id.toLowerCase() === companyId.toLowerCase(),
    );

    let psContactId: string | undefined;

    // If connected to ProjectSight and company has psCompanyId, attempt live creation
    if (token && portfolioId && targetCompany?.psCompanyId) {
      try {
        const psRes = await createProjectSightCompanyContact(
          token,
          portfolioId,
          targetCompany.psCompanyId,
          {
            firstName,
            lastName,
            email,
            title,
            phone,
          },
        );

        const contactObj =
          psRes && typeof psRes === 'object' && 'ContactID' in psRes
            ? (psRes as Record<string, unknown>)
            : (Array.isArray(psRes?.Contacts) ? (psRes.Contacts[0] as Record<string, unknown> | undefined) : undefined);

        if (contactObj?.ContactID) {
          psContactId = String(contactObj.ContactID);
        }
      } catch (err) {
        console.warn('[contacts API] ProjectSight live contact creation failed, saving locally:', err);
      }
    }

    const newContact: CompanyContact = {
      id: psContactId || `c-${Date.now()}-${slugTradePartnerId(`${firstName}-${lastName}`)}`,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      email,
      title: title || 'Foreman',
      phone,
    };

    const saved = addCompanyContact(projectId, companyId, newContact);
    return NextResponse.json({ success: true, contact: saved });
  } catch (err) {
    console.error('[api/companies/contacts] POST failed', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to add contact' },
      { status: 500 },
    );
  }
}
