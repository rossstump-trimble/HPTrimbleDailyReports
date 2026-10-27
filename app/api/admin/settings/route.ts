import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { AUTH_COOKIE, SESSION_COOKIE, isAdminEmail, parseVerifiedSession } from "@/lib/local-session";
import {
  getAccessControl,
  updateAccessControl,
  getCapacityStatus,
  getProjects,
  getStore,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAdmin(request: NextRequest): { allowed: boolean; email?: string } {
  if (isLocalAuthRequest(request)) {
    return { allowed: true, email: "local@trimble.com" };
  }
  const accessControl = getAccessControl();
  const policy = {
    allowedDomains: accessControl.allowedDomains,
    allowedEmails: accessControl.allowedEmails,
  };
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const session =
    parseVerifiedSession(sessionCookie, policy) ||
    parseVerifiedSession(authCookie, policy);
  if (!session) {
    return { allowed: false };
  }
  const isPasskeySession = Boolean(session.sub && session.sub.startsWith("passkey:"));
  if (isPasskeySession && !accessControl.allowPasskeyLogin) {
    return { allowed: false };
  }
  if (!isAdminEmail(session.email, accessControl.adminEmails)) {
    return { allowed: false, email: session.email };
  }
  return { allowed: true, email: session.email };
}

export async function GET(request: NextRequest) {
  const auth = checkAdmin(request);
  if (!auth.allowed) {
    return NextResponse.json({ success: false, error: "Administrator access required" }, { status: 403 });
  }

  const accessControl = getAccessControl();
  const capacity = getCapacityStatus();
  const projects = getProjects();
  const store = getStore();

  return NextResponse.json({
    success: true,
    accessControl,
    capacity,
    summary: {
      projectsCount: projects.length,
      dailyReportsCount: store.dailyReports.length,
      punchItemsCount: (store.punchItems || []).length,
      inspectionsCount: (store.inspections || []).length,
      projects: projects.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        psPortfolioId: p.psPortfolioId,
        psProjectId: p.psProjectId,
        trackedCompaniesCount: (p.tradePartners || []).length,
        totalCompaniesCount: (p.availableCompanies || []).length,
      })),
    },
  });
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((item) => typeof item === "string");
}

export async function POST(request: NextRequest) {
  const auth = checkAdmin(request);
  if (!auth.allowed) {
    return NextResponse.json({ success: false, error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (body.allowedDomains !== undefined && !isStringArray(body.allowedDomains)) {
      return NextResponse.json({ success: false, error: "allowedDomains must be an array of strings" }, { status: 400 });
    }
    if (body.allowedEmails !== undefined && !isStringArray(body.allowedEmails)) {
      return NextResponse.json({ success: false, error: "allowedEmails must be an array of strings" }, { status: 400 });
    }
    if (body.adminEmails !== undefined && !isStringArray(body.adminEmails)) {
      return NextResponse.json({ success: false, error: "adminEmails must be an array of strings" }, { status: 400 });
    }
    if (Array.isArray(body.allowedDomains) && body.allowedDomains.filter((d) => d.trim()).length === 0) {
      return NextResponse.json({ success: false, error: "At least one allowed domain is required" }, { status: 400 });
    }
    if (Array.isArray(body.adminEmails) && body.adminEmails.filter((e) => e.trim()).length === 0) {
      return NextResponse.json({ success: false, error: "At least one administrator email is required" }, { status: 400 });
    }

    const updated = updateAccessControl({
      allowedDomains: body.allowedDomains as string[] | undefined,
      allowedEmails: body.allowedEmails as string[] | undefined,
      adminEmails: body.adminEmails as string[] | undefined,
      allowPasskeyLogin:
        typeof body.allowPasskeyLogin === "boolean" ? body.allowPasskeyLogin : undefined,
    });

    return NextResponse.json({
      success: true,
      accessControl: updated,
      message: "Access control settings saved.",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 500 },
    );
  }
}
