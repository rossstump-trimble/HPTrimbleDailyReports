/**
 * Help menu configuration — URLs and contextual Online Help mappings.
 *
 * ENVIRONMENT:
 *   Commercial  → Gainsight widget handles help (no changes needed here)
 *   FedRAMP     → Native HelpMenu component is rendered using this config
 *
 * NEXT_PUBLIC_APP_ENV=fedramp  activates the native component.
 */

export const HELP_LINKS = {
  theNetwork: "https://community.trimble.com/home",
  training: "https://trimblelearn.docebosaas.com/learn",
  releaseNotes:
    "https://help.trimble.com/projectsight/en/Content/release-notes/release-notes.htm",
  requirements:
    "https://help.trimble.com/projectsight/en/Content/getting-started/system-requirements.htm",
  productIdeas: "https://trimble-projectsight.ideas.aha.io/",
  // Resources group
  licenseAssignments:
    "https://help.trimble.com/projectsight/en/Content/admin/license-management.htm",
  accountTransfers:
    "https://help.trimble.com/projectsight/en/Content/admin/account-transfers.htm",
  apiDocumentation: "https://developer.trimble.com/projectsight",
  blog: "https://blog.trimble.com/construction/category/projectsight/",
  browserCache:
    "https://help.trimble.com/projectsight/en/Content/getting-started/clear-browser-cache.htm",
  faqs: "https://help.trimble.com/projectsight/en/Content/getting-started/faqs.htm",
  videoLibrary: "https://www.youtube.com/playlist?list=PLkLtJRIBFpxVl0v9pXFNzgq7y9hSREwBi",
} as const;

/**
 * Maps a pathname segment (the first part of the URL after the leading slash)
 * to its corresponding Online Help documentation URL.
 *
 * Add new modules here as they are released.
 */
export const ONLINE_HELP_URL_MAP: Record<string, string> = {
  // Home / projects
  "": "https://help.trimble.com/projectsight/en/Content/home.htm",
  dashboard:
    "https://help.trimble.com/projectsight/en/Content/home.htm",
  // Drawings
  drawings:
    "https://help.trimble.com/projectsight/en/Content/drawings/drawings-overview.htm",
  // Documents
  documents:
    "https://help.trimble.com/projectsight/en/Content/documents/documents-overview.htm",
  "trimble-connect":
    "https://help.trimble.com/projectsight/en/Content/documents/documents-overview.htm",
  // Schedule
  schedule:
    "https://help.trimble.com/projectsight/en/Content/schedule/schedule-overview.htm",
  // Photos
  photos:
    "https://help.trimble.com/projectsight/en/Content/photos/photos-overview.htm",
  // Field Management
  "field-data":
    "https://help.trimble.com/projectsight/en/Content/field-management/field-management-overview.htm",
  // Progress Tracking
  "progress-tracking":
    "https://help.trimble.com/projectsight/en/Content/progress-tracking/progress-tracking-overview.htm",
  // RFIs
  rfis: "https://help.trimble.com/projectsight/en/Content/records/rfis/rfis-overview.htm",
  // Budget (financials)
  budget:
    "https://help.trimble.com/projectsight/en/Content/financials/budget/budget-overview.htm",
  // Search
  search:
    "https://help.trimble.com/projectsight/en/Content/home.htm",
  // Maintenance / support native pages — link to general help
  "maintenance-windows":
    "https://help.trimble.com/projectsight/en/Content/home.htm",
  "contact-support":
    "https://help.trimble.com/projectsight/en/Content/home.htm",
};

/**
 * Returns the contextual Online Help URL for the given Next.js pathname.
 * Falls back to the general help page when no specific mapping exists.
 */
export function getOnlineHelpUrl(pathname: string): string {
  const segment = pathname.replace(/^\//, "").split("/")[0];
  return (
    ONLINE_HELP_URL_MAP[segment] ??
    "https://help.trimble.com/projectsight/en/Content/home.htm"
  );
}

/**
 * Returns true when the app is running in a FedRAMP environment.
 * Reads from NEXT_PUBLIC_APP_ENV (set at build time or in .env.local).
 */
export function isFedRampEnvironment(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "fedramp";
}
