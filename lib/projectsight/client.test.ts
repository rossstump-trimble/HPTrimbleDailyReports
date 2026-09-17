import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listPortfolios,
  createDailyReport,
  attachDailyReportFile,
  extractCreatedDailyId,
  listCompaniesWithContacts,
  createProjectSightCompanyContact,
} from './client';

describe('extractCreatedDailyId', () => {
  it('reads DailyReportId aliases', () => {
    expect(extractCreatedDailyId({ DailyReportId: 'a' })).toBe('a');
    expect(extractCreatedDailyId({ DailyReportID: 'b' })).toBe('b');
    expect(extractCreatedDailyId({ Id: 'c' })).toBe('c');
    expect(extractCreatedDailyId({ KeyID: 'd' })).toBe('d');
    expect(extractCreatedDailyId({ items: [{ DailyReportId: 'e' }] })).toBe('e');
  });
});

describe('client HTTP', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    process.env.PROJECTSIGHT_API_BASE_URL = 'https://ps.example/v1';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PROJECTSIGHT_API_BASE_URL;
  });

  it('lists portfolios from Items', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [{ PortfolioId: 'p1', Name: 'HP' }] }),
    });
    await expect(listPortfolios('tok')).resolves.toEqual([{ id: 'p1', name: 'HP' }]);
  });

  it('creates a daily then attaches multipart file', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ DailyReportId: 'dr-1' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{}' });
    const created = await createDailyReport('tok', 'pf', 'pr', { Date: '2026-08-20' });
    expect(created.id).toBe('dr-1');
    await attachDailyReportFile(
      'tok',
      'pf',
      'pr',
      'dr-1',
      'FOG617.xlsx',
      Buffer.from('x'),
      'application/vnd.ms-excel',
    );
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain('/pf/pr/dailyreports');
    expect(urls.some((url) => url.includes('/pf/pr/dailyreports/dr-1/attachments'))).toBe(true);
  });

  it('throws ProjectSightHttpError on 403', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, text: async () => 'nope' });
    await expect(listPortfolios('tok')).rejects.toMatchObject({ status: 403 });
  });

  it('lists companies with contacts from portfolio Companies endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          Items: [
            {
              CompanyID: 10042,
              Name: 'Titan Electric',
              Contacts: [{ ContactID: 9901, FirstName: 'Jane', LastName: 'Doe' }],
              Addresses: [{ AddressID: 5 }],
            },
          ],
        }),
    });

    const result = await listCompaniesWithContacts('tok', 'port-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/port-1/Companies'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].Contacts).toEqual([
      { ContactID: 9901, FirstName: 'Jane', LastName: 'Doe' },
    ]);
    expect(result[0].Addresses).toEqual([{ AddressID: 5 }]);
  });

  it('creates a company contact via ProjectSight Company POST update', async () => {
    const createFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          CompanyID: 10042,
          Name: 'Titan Electric',
          Contacts: [
            {
              ContactID: 9901,
              FirstName: 'Jane',
              LastName: 'Doe',
              DisplayName: 'Jane Doe',
              EMail: 'jane@titan.com',
            },
          ],
        }),
    });
    global.fetch = createFetchMock;

    const result = await createProjectSightCompanyContact(
      'test-token',
      'port-1',
      10042,
      { firstName: 'Jane', lastName: 'Doe', email: 'jane@titan.com', title: 'Foreman' },
    );

    expect(createFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/port-1/Companies'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"FirstName":"Jane"'),
      }),
    );
    expect(result).toBeDefined();
  });
});
