import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/translate', () => ({ translateUiStrings: vi.fn() }));

import { translateUiStrings } from '@/lib/translate';
import { POST } from './route';

const mockedTranslate = vi.mocked(translateUiStrings);

function post(body: unknown) {
  return POST(
    new Request('http://localhost:3000/api/intake/translate-ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/intake/translate-ui', () => {
  beforeEach(() => {
    mockedTranslate.mockReset();
    mockedTranslate.mockResolvedValue({ Form: 'Formulario' });
  });

  it('returns translations for a supported language', async () => {
    const res = await post({ language: 'es', strings: ['Form'] });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, translations: { Form: 'Formulario' } });
  });

  it.each([
    ['English', { language: 'en', strings: ['Form'] }],
    ['an unknown language', { language: 'xx', strings: ['Form'] }],
    ['no strings', { language: 'es', strings: [] }],
    ['too many strings', { language: 'es', strings: Array.from({ length: 151 }, (_, i) => `s${i}`) }],
    ['an oversized string', { language: 'es', strings: ['x'.repeat(601)] }],
  ])('rejects %s without calling the model', async (_label, body) => {
    const res = await post(body);

    expect(res.status).toBe(400);
    expect(mockedTranslate).not.toHaveBeenCalled();
  });
});
