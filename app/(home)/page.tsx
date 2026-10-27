import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_PROJECT_STORAGE_KEY } from "@/lib/active-project";
import { getProjectById } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function RootPage() {
  try {
    const jar = cookies();
    const rawDefault = jar.get(DEFAULT_PROJECT_STORAGE_KEY)?.value;
    if (rawDefault) {
      const decoded = decodeURIComponent(rawDefault).trim();
      if (decoded && getProjectById(decoded)) {
        redirect(`/projects/${encodeURIComponent(decoded)}/dashboard`);
      }
    }
  } catch (err) {
    // Re-throw Next.js redirect errors
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
  }
  redirect("/projects");
}
