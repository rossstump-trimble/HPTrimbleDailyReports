import { describe, it, expect } from 'vitest';
import { POST } from './summarize/route';

describe('Superdaily Summarize API Route', () => {
  it('rejects invalid date formats', async () => {
    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: 'invalid-date' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('summarizes reports for a valid date', async () => {
    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-17' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(data.report.projectId).toBe('1025');
  });
});
