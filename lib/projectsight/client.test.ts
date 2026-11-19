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

  it('automatically retries createDailyReport without invalid location/crew when ProjectSight rejects with Code 99986', async () => {
    // First call rejects with ProjectSight location error
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          Message: 'Location 374 for Labor Wildcat Flooring: N/A is invalid or has been deleted.',
          Code: 99986,
        }),
    });
    // Second call (sanitized retry) succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ DailyReportId: 'dr-retry-success' }),
    });

    const bodyWithInvalidLocation = {
      Date: '2026-11-19',
      LocationID: 374,
      Location: 'Building A Interior > Level 3',
      DailyWorks: [
        {
          CompanyName: 'Wildcat Flooring',
          Workers: 2,
          TotalWork: 16,
          LocationID: 374,
          Location: 'Building A Interior > Level 3',
        },
      ],
    };

    const created = await createDailyReport('tok', 'pf', 'pr', bodyWithInvalidLocation);
    expect(created.id).toBe('dr-retry-success');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Verify retry payload stripped the invalid LocationID but preserved the text description
    const retryCall = fetchMock.mock.calls[1];
    const retryBody = JSON.parse(String(retryCall[1]?.body));
    expect(retryBody.LocationID).toBeUndefined();
    expect(retryBody.DailyWorks[0].LocationID).toBeUndefined();
    expect(retryBody.DailyWorks[0].Location).toBe('Building A Interior > Level 3');
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
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            CompanyID: 10042,
            Name: 'Titan Electric',
            Addresses: [{ AddressID: 55 }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
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
                Title: 'Foreman',
                Tel: '555-0100',
              },
            ],
          }),
      });

    const result = await createProjectSightCompanyContact(
      'test-token',
      'port-1',
      10042,
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@titan.com',
        title: 'Foreman',
        phone: '555-0100',
      },
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/port-1/Companies/10042'),
      expect.objectContaining({ method: 'GET' }),
    );

    const postCall = fetchMock.mock.calls[1];
    expect(String(postCall[0])).toContain('/port-1/Companies');
    expect(postCall[1]).toMatchObject({ method: 'POST' });
    const postBody = JSON.parse(String(postCall[1]?.body));
    expect(postBody).toEqual({
      CompanyID: 10042,
      Contacts: [
        {
          AddressID: 55,
          FirstName: 'Jane',
          LastName: 'Doe',
          IsActive: true,
          EMail: 'jane@titan.com',
          Title: 'Foreman',
          Tel: '555-0100',
        },
      ],
    });

    expect(result.ContactID).toBe(9901);
    expect(result.FirstName).toBe('Jane');
  });
});
