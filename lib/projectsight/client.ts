import type { PunchItem, PunchStatus, PunchImportance } from '@/types/punch';

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

export function summarizeDailyRecord(payload: unknown): Record<string, unknown> {
  if (Array.isArray(payload) && payload[0]) {
    return summarizeDailyRecord(payload[0]);
  }
  if (!payload || typeof payload !== 'object') {
    return { empty: true };
  }
  const raw = payload as Record<string, unknown>;
  const nested = raw.Items ?? raw.items ?? raw.data;
  if (nested && nested !== payload) {
    return summarizeDailyRecord(nested);
  }
  const comments = Array.isArray(raw.RecordComments) ? raw.RecordComments : [];
  const works = Array.isArray(raw.DailyWorks) ? raw.DailyWorks : [];
  const weatherNotes = String(raw.WeatherNotes ?? '');
  const firstComment =
    comments[0] && typeof comments[0] === 'object'
      ? String((comments[0] as { Comments?: unknown }).Comments ?? '')
      : '';
  return {
    DailyReportID: raw.DailyReportID ?? raw.DailyReportId ?? raw.Id,
    Date: raw.Date,
    WorkflowState: raw.WorkflowState,
    weatherNotesChars: weatherNotes.length,
    commentCount: comments.length,
    dailyWorkCount: works.length,
    preview: (weatherNotes || firstComment).slice(0, 160),
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

export async function listDailyReports(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<Record<string, unknown>[]> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/dailyreports`,
    {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    },
  );
  return items(payload);
}

export async function getDailyReport(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  dailyId: string,
): Promise<Record<string, unknown>> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/dailyreports/${dailyId}`,
    {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    },
  );
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}

export async function listCompanies(
  accessToken: string,
  portfolioId: string,
  projectId?: string,
): Promise<Record<string, unknown>[]> {
  // ProjectSight companies endpoint is at the portfolio level: /{portfolioId}/Companies
  // Response rows may include Contacts and Addresses arrays when the API returns them.
  try {
    const payload = await psFetch(
      `${projectSightBaseUrl()}/${portfolioId}/Companies`,
      {
        method: 'GET',
        headers: projectSightHeaders(accessToken),
      },
    );
    const result = items(payload);
    if (result.length > 0) return result;
  } catch (err) {
    console.warn('[projectsight] portfolio-level listCompanies failed, trying project level:', err);
  }

  if (projectId) {
    try {
      const payload = await psFetch(
        `${projectSightBaseUrl()}/${portfolioId}/${projectId}/Companies`,
        {
          method: 'GET',
          headers: projectSightHeaders(accessToken),
        },
      );
      return items(payload);
    } catch {
      // fallback
    }
  }
  return [];
}

export async function listCompaniesWithContacts(
  accessToken: string,
  portfolioId: string,
  projectId?: string,
): Promise<Record<string, unknown>[]> {
  return listCompanies(accessToken, portfolioId, projectId);
}

function resolveCompanyAddressId(company: Record<string, unknown>): number {
  const addresses = Array.isArray(company.Addresses) ? company.Addresses : [];
  const first = addresses[0];
  if (first && typeof first === 'object') {
    const id = caseGet(first as Record<string, unknown>, ['AddressID', 'AddressId', 'Id', 'id']);
    if (id != null && id !== '') {
      const n = Number(id);
      if (Number.isFinite(n)) return n;
    }
  }
  return 1;
}

export async function createProjectSightCompanyContact(
  accessToken: string,
  portfolioId: string,
  companyId: number,
  contact: {
    firstName: string;
    lastName: string;
    email?: string;
    title?: string;
    phone?: string;
    addressId?: number;
  },
): Promise<Record<string, unknown>> {
  let addressId = contact.addressId;
  if (addressId == null) {
    const companyPayload = await psFetch(
      `${projectSightBaseUrl()}/${portfolioId}/Companies/${companyId}`,
      {
        method: 'GET',
        headers: projectSightHeaders(accessToken),
      },
    );
    const company =
      companyPayload && typeof companyPayload === 'object'
        ? (Array.isArray(companyPayload)
            ? ((companyPayload[0] as Record<string, unknown> | undefined) ?? {})
            : (companyPayload as Record<string, unknown>))
        : {};
    addressId = resolveCompanyAddressId(company);
  }

  const contactRow: Record<string, unknown> = {
    AddressID: addressId,
    FirstName: contact.firstName,
    LastName: contact.lastName,
    IsActive: true,
  };
  if (contact.email != null) contactRow.EMail = contact.email;
  if (contact.title != null) contactRow.Title = contact.title;
  if (contact.phone != null) contactRow.Tel = contact.phone;

  const payload = await psFetch(`${projectSightBaseUrl()}/${portfolioId}/Companies`, {
    method: 'POST',
    headers: projectSightHeaders(accessToken),
    body: JSON.stringify({
      CompanyID: companyId,
      Contacts: [contactRow],
    }),
  });

  const raw =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const contacts = Array.isArray(raw.Contacts) ? raw.Contacts : [];
  const matched = contacts.find((row) => {
    if (!row || typeof row !== 'object') return false;
    const c = row as Record<string, unknown>;
    return (
      String(caseGet(c, ['FirstName', 'firstName']) ?? '') === contact.firstName &&
      String(caseGet(c, ['LastName', 'lastName']) ?? '') === contact.lastName
    );
  });
  const created = matched ?? contacts[contacts.length - 1];
  return (created && typeof created === 'object' ? created : raw) as Record<string, unknown>;
}

export async function listDrawings(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<Record<string, unknown>[]> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/drawings`,
    {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    },
  );
  return items(payload);
}

export async function listRfis(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<Record<string, unknown>[]> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/rfis`,
    {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    },
  );
  return items(payload);
}

export async function listSubmittals(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<Record<string, unknown>[]> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/submittals`,
    {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    },
  );
  return items(payload);
}

export async function listPunchItems(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<Record<string, unknown>[]> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/punchitems`,
    {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    },
  );
  return items(payload);
}

export function normalizePunchItem(raw: Record<string, unknown>, projectId: string): PunchItem {
  const id = String(caseGet(raw, ['PunchItemId', 'PunchItemID', 'Id', 'id', 'KeyID']) || '');
  const itemNumber = String(caseGet(raw, ['ItemNumber', 'Number', 'ItemNo']) || '');
  const description = String(caseGet(raw, ['Description', 'Subject', 'Title', 'Notes']) || 'No description');
  const rawStatus = String(caseGet(raw, ['Status', 'State', 'WorkflowState']) || 'Open').toLowerCase();

  let status: PunchStatus = 'open';
  if (rawStatus.includes('resolv')) status = 'resolved';
  else if (rawStatus.includes('close')) status = 'closed';
  else if (rawStatus.includes('reopen')) status = 'reopened';

  const rawImportance = String(caseGet(raw, ['Importance', 'Priority']) || 'Normal').toLowerCase();
  let importance: PunchImportance = 'normal';
  if (rawImportance.includes('low')) importance = 'low';
  else if (rawImportance.includes('urgent')) importance = 'urgent';
  else if (rawImportance.includes('high')) importance = 'high';

  let locationDescription = '';
  const loc = raw.Location;
  if (loc && typeof loc === 'object') {
    locationDescription = String((loc as Record<string, unknown>).Description || (loc as Record<string, unknown>).Name || '');
  } else if (typeof raw.LocationDescription === 'string') {
    locationDescription = raw.LocationDescription;
  }

  let tradeName = '';
  const assigned = raw.AssignedToCompany ?? raw.Company ?? raw.AssignedTo;
  if (assigned && typeof assigned === 'object') {
    tradeName = String((assigned as Record<string, unknown>).Name || '');
  } else if (typeof assigned === 'string') {
    tradeName = assigned;
  }

  return {
    id,
    projectId,
    itemNumber: itemNumber || undefined,
    description,
    status,
    tradeName: tradeName || 'Unassigned',
    locationDescription,
    importance,
    reportedDate: typeof raw.DateCreated === 'string' ? raw.DateCreated.slice(0, 10) : undefined,
    psPunchId: id,
  };
}

export async function createPunchItem(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  body: Record<string, unknown>,
): Promise<{ id: string; payload: unknown }> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/punchitems`,
    {
      method: 'POST',
      headers: projectSightHeaders(accessToken),
      body: JSON.stringify(body),
    },
  );
  const id = String(caseGet(payload as Record<string, unknown>, ['PunchItemId', 'PunchItemID', 'Id', 'id']) || '');
  return { id, payload };
}

export async function updatePunchItem(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  punchItemId: string,
  body: Record<string, unknown>,
): Promise<{ id: string; payload: unknown }> {
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/punchitems/${punchItemId}`,
    {
      method: 'PUT',
      headers: projectSightHeaders(accessToken),
      body: JSON.stringify(body),
    },
  );
  const id = String(caseGet(payload as Record<string, unknown>, ['PunchItemId', 'PunchItemID', 'Id', 'id']) || punchItemId);
  return { id, payload };
}

export async function createDailyReport(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  body: Record<string, unknown>,
): Promise<{ id: string; payload?: unknown }> {
  // Safety rule: strip any record identifiers so this function can only CREATE new Daily Reports
  const createPayload = { ...body };
  delete createPayload.DailyReportID;
  delete createPayload.DailyReportId;
  delete createPayload.Id;
  delete createPayload.id;
  delete createPayload.KeyID;
  delete createPayload.WorkflowState;

  const comments = Array.isArray(createPayload.RecordComments) ? createPayload.RecordComments : [];
  const works = Array.isArray(createPayload.DailyWorks) ? createPayload.DailyWorks : [];
  const labor = Array.isArray(createPayload.DailyLabor) ? createPayload.DailyLabor : [];
  const equip = Array.isArray(createPayload.DailyEquipment) ? createPayload.DailyEquipment : [];
  console.error('[projectsight] create daily payload', {
    date: createPayload.Date,
    subject: createPayload.Subject ?? createPayload.Title ?? null,
    dailyWorkCount: works.length,
    dailyLaborCount: labor.length,
    dailyEquipmentCount: equip.length,
    weatherNotesChars: String(createPayload.WeatherNotes ?? '').length,
    generalNotesChars: String(createPayload.GeneralNotes ?? createPayload.Notes ?? '').length,
    commentCount: comments.length,
    commentChars: comments
      .map((row) =>
        row && typeof row === 'object' && 'Comments' in row
          ? String((row as { Comments?: unknown }).Comments ?? '')
          : '',
      )
      .join('\n').length,
  });
  const payload = await psFetch(
    `${projectSightBaseUrl()}/${portfolioId}/${projectId}/dailyreports`,
    {
      method: 'POST',
      headers: projectSightHeaders(accessToken),
      body: JSON.stringify(createPayload),
    },
  );
  console.error('[projectsight] create daily response', summarizeDailyRecord(payload));
  const id = extractCreatedDailyId(payload);
  if (!id) {
    throw new ProjectSightHttpError(502, 'ProjectSight create did not return a daily id');
  }
  return { id, payload };
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

export interface ProjectSightChecklistRef {
  id: string;
  number: string;
  title: string;
  workflowState: string;
  location?: string;
  items?: {
    id: string;
    itemNumber: number;
    prompt: string;
    result?: string;
    comment?: string;
  }[];
}

export const FIXTURE_PROJECTSIGHT_CHECKLISTS: ProjectSightChecklistRef[] = [
  {
    id: 'ck-fix-001',
    number: 'CK-0042',
    title: 'Pre-Pour Concrete Inspection',
    workflowState: 'Open',
    location: 'Building A, Floor 2',
    items: [
      { id: 'item-1', itemNumber: 1, prompt: 'Rebar placement, spacing, and sizing verified per structural drawings', result: 'Unchecked' },
      { id: 'item-2', itemNumber: 2, prompt: 'Clear cover to formwork verified (chairs & standoffs positioned)', result: 'Unchecked' },
      { id: 'item-3', itemNumber: 3, prompt: 'Embedded items, anchor bolts, and penetrations located and secured', result: 'Unchecked' },
      { id: 'item-4', itemNumber: 4, prompt: 'Forms clean of debris, tie wire, and standing water', result: 'Unchecked' },
      { id: 'item-5', itemNumber: 5, prompt: 'Vapor barrier sealed and free from punctures or tears', result: 'Unchecked' },
      { id: 'item-6', itemNumber: 6, prompt: 'Pre-pour survey elevation marks established on bulkheads', result: 'Unchecked' },
    ],
  },
];

export async function listChecklists(
  accessToken: string,
  portfolioId: string,
  projectId: string,
): Promise<ProjectSightChecklistRef[]> {
  try {
    const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists`;
    const payload = await psFetch(url, {
      method: 'GET',
      headers: projectSightHeaders(accessToken),
    });
    const parsed = items(payload).map((item) => {
      const id = String(caseGet(item, ['ChecklistID', 'ChecklistId', 'ChecklistGuid', 'Id', 'id']) || '');
      const rawNum = caseGet(item, ['ChecklistNumber', 'Number', 'number']);
      const number = rawNum != null && String(rawNum).trim() ? String(rawNum).trim() : `CK-${id}`;
      const rawTitle = caseGet(item, ['WorkDescription', 'Title', 'Name', 'title']);
      const title = rawTitle != null && String(rawTitle).trim() ? String(rawTitle).trim() : (number && number !== `CK-${id}` ? `Checklist ${number}` : 'Pre-Placement Concrete Inspection');
      const workflowState = String(caseGet(item, ['WorkflowStateName', 'WorkflowState', 'Status', 'status']) || 'Draft');
      const location = (caseGet(item, ['Location', 'location']) as string) || undefined;

      const rawItems = (caseGet(item, ['ChecklistItems', 'Items', 'items']) || []) as Record<string, unknown>[];
      const parsedItems = Array.isArray(rawItems)
        ? rawItems.map((it, itemIdx) => {
            const rawStatus = String(caseGet(it, ['Status', 'Response', 'status']) || 'None');
            let result: string = 'Unchecked';
            if (rawStatus.toLowerCase() === 'yes') result = 'Pass';
            else if (rawStatus.toLowerCase() === 'no') result = 'Fail';
            else if (rawStatus.toLowerCase() === 'na') result = 'N/A';
            else if (rawStatus.toLowerCase() === 'none') result = 'Unchecked';
            else result = rawStatus;

            return {
              id: String(caseGet(it, ['ChecklistItemID', 'ChecklistItemId', 'GUID', 'Id', 'id']) || `item-${itemIdx + 1}`),
              itemNumber: Number(caseGet(it, ['SortOrder', 'ItemNumber', 'itemNumber']) ?? itemIdx + 1),
              prompt: String(caseGet(it, ['Description', 'prompt', 'Value', 'value']) || `Item ${itemIdx + 1}`),
              result,
              comment: (caseGet(it, ['Value', 'Comments', 'comment']) as string) || undefined,
            };
          })
        : [];

      return {
        id,
        number,
        title,
        workflowState,
        location,
        items: parsedItems,
      };
    }).filter((ck) => ck.id);

    if (parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('[projectsight] listChecklists fallback to fixture', err);
  }
  return FIXTURE_PROJECTSIGHT_CHECKLISTS;
}

export async function getChecklist(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  checklistId: string,
): Promise<Record<string, unknown>> {
  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists/${checklistId}`;
  const payload = await psFetch(url, {
    method: 'GET',
    headers: projectSightHeaders(accessToken),
  });
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}

export async function updateChecklistItems(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  checklistId: string,
  itemsList: { id?: string; itemNumber: number; prompt?: string; result: string; comment?: string }[],
  workflowState?: string,
): Promise<Record<string, unknown>> {
  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists`;
  const validItems = itemsList
    .filter((it) => it.id && !it.id.startsWith('item-'))
    .map((it) => {
      const isPass = it.result === 'Pass';
      const isFail = it.result === 'Fail';
      const isNA = it.result === 'N/A';

      const status = isPass ? 'Yes' : isFail ? 'No' : isNA ? 'NA' : it.result;
      const itemPayload: Record<string, unknown> = {
        Status: status,
      };

      const numId = Number(it.id);
      if (!isNaN(numId)) {
        itemPayload.ChecklistItemID = numId;
      } else {
        itemPayload.GUID = it.id;
      }

      // For ProjectSight Yes/No checklist items (ValueType 10), Value must be boolean string ("true"/"false") or null
      if (it.comment) {
        itemPayload.Value = it.comment;
      } else if (isPass) {
        itemPayload.Value = 'true';
      } else if (isFail) {
        itemPayload.Value = 'false';
      }

      return itemPayload;
    });

  const body: Record<string, unknown> = {
    ChecklistID: Number(checklistId) || checklistId,
    ChecklistItems: validItems,
  };
  if (workflowState) {
    body.WorkflowStateName = workflowState;
  }
  const payload = await psFetch(url, {
    method: 'POST',
    headers: projectSightHeaders(accessToken),
    body: JSON.stringify(body),
  });
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}

export async function uploadChecklistAttachment(
  accessToken: string,
  portfolioId: string,
  projectId: string,
  checklistId: string,
  filename: string,
  buffer: Buffer,
  contentType: string = 'image/jpeg',
): Promise<Record<string, unknown>> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: contentType || 'application/octet-stream' });
  form.append('file', blob, filename);
  const headers = projectSightHeaders(accessToken);
  delete headers['Content-Type'];

  const url = `${projectSightBaseUrl()}/${portfolioId}/${projectId}/checklists/${checklistId}/attachments`;
  const payload = await psFetch(url, {
    method: 'POST',
    headers,
    body: form,
  });
  return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
}
