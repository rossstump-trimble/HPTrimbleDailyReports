export class ProjectSightHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProjectSightHttpError';
    this.status = status;
  }
}

export interface ProjectSightRef {
  id: string;
  name: string;
}

function caseGet(raw: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in raw) return raw[key];
  }
  const lower = new Set(keys.map((k) => k.toLowerCase()));
  for (const [key, value] of Object.entries(raw)) {
    if (lower.has(key.toLowerCase())) return value;
  }
  return undefined;
}

function items(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  }
  if (payload && typeof payload === 'object') {
    const nested =
      (payload as Record<string, unknown>).Items ??
      (payload as Record<string, unknown>).items ??
      (payload as Record<string, unknown>).data ??
      [];
    if (Array.isArray(nested)) {
      return nested.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
    }
  }
  return [];
}

export function projectSightBaseUrl(): string {
  return (
    process.env.PROJECTSIGHT_API_BASE_URL ||
    'https://us-east.api.trimble.com/projectsightapi/us1/v1'
  ).replace(/\/+$/, '');
}

export function projectSightHeaders(accessToken: string): Record<string, string> {
  const header = (process.env.PROJECTSIGHT_AUTH_HEADER || 'Authorization').toLowerCase();
  if (header === 'x-ps-authorization') {
    return {
      'X-PS-Authorization': `Bearer ${accessToken}`,
      Accept: 'application/json',
    };
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export function extractCreatedDailyId(payload: unknown): string {
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === 'object') {
    return extractCreatedDailyId(payload[0]);
  }
  if (!payload || typeof payload !== 'object') return '';
  const raw = payload as Record<string, unknown>;
  const nested = raw.Items ?? raw.items ?? raw.data;
  if (nested) {
    const fromNested = extractCreatedDailyId(nested);
    if (fromNested) return fromNested;
  }
  const id = caseGet(raw, ['DailyReportId', 'DailyReportID', 'Id', 'id', 'KeyID']);
  return id == null ? '' : String(id);
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

async function psFetch(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new ProjectSightHttpError(
      response.status,
      body.slice(0, 300) || `ProjectSight error ${response.status}`,
    );
  }
  return readJson(response);
}

export async function listPortfolios(accessToken: string): Promise<ProjectSightRef[]> {
  const payload = await psFetch(`${projectSightBaseUrl()}/portfolios`, {
    method: 'GET',
    headers: projectSightHeaders(accessToken),
  });
  return items(payload).map((item) => ({
    id: String(caseGet(item, ['PortfolioId', 'PortfolioGuid', 'Id', 'id']) || ''),
    name: String(caseGet(item, ['Name', 'name']) || 'Untitled portfolio'),
  })).filter((row) => row.id);
}

export async function listProjects(
  accessToken: string,
  portfolioId: string,
): Promise<ProjectSightRef[]> {
  const payload = await psFetch(`${projectSightBaseUrl()}/${portfolioId}/projects/list`, {
    method: 'POST',
    headers: projectSightHeaders(accessToken),
    body: JSON.stringify({}),
  });
  return items(payload).map((item) => ({
    id: String(caseGet(item, ['ProjectId', 'ProjectGuid', 'Id', 'id']) || ''),
    name: String(caseGet(item, ['Name', 'name']) || 'Untitled project'),
  })).filter((row) => row.id);
}

export async function createDailyReport(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  body: Record<string, unknown>,
): Promise<{ id: string }> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/dailyreports`,
    {
      method: 'POST',
      headers: projectSightHeaders(accessToken),
      body: JSON.stringify(body),
    },
  );
  const id = extractCreatedDailyId(payload);
  if (!id) {
    throw new ProjectSightHttpError(502, 'ProjectSight create did not return a daily id');
  }
  return { id };
}

export async function attachDailyReportFile(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  dailyId: string,
  fileName: string,
  bytes: Buffer,
  mimeType: string,
): Promise<void> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType || 'application/octet-stream' });
  form.append('file', blob, fileName);
  const headers = projectSightHeaders(accessToken);
  delete headers['Content-Type'];
  await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/dailyreports/${dailyId}/attachments`,
    {
      method: 'POST',
      headers,
      body: form,
    },
  );
}
