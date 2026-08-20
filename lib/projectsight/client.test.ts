import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listPortfolios,
  createDailyReport,
  attachDailyReportFile,
  extractCreatedDailyId,
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
});
