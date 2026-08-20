import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const local = isLocalAuthRequest(request);
  return NextResponse.json({
    mode: local ? "local" : "tid",
    tidEnabled: !local,
  });
}
