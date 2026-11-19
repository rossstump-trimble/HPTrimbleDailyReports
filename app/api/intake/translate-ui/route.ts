import { NextResponse } from 'next/server';
import { nonEnglishLanguageOrUndefined } from '@/lib/intake-languages';
import { translateUiStrings } from '@/lib/translate';

export const runtime = 'nodejs';

// The route is public (QR intake), so cap what one request can ask the model to do.
const MAX_STRINGS = 150;
const MAX_STRING_CHARS = 600;
const MAX_TOTAL_CHARS = 20000;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { language?: unknown; strings?: unknown };
    const language = nonEnglishLanguageOrUndefined(body.language);
    if (!language) {
      return NextResponse.json({ success: false, error: 'Unsupported language' }, { status: 400 });
    }

    const strings = Array.isArray(body.strings)
      ? body.strings.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [];
    const totalChars = strings.reduce((sum, s) => sum + s.length, 0);
    if (
      strings.length === 0 ||
      strings.length > MAX_STRINGS ||
      totalChars > MAX_TOTAL_CHARS ||
      strings.some((s) => s.length > MAX_STRING_CHARS)
    ) {
      return NextResponse.json({ success: false, error: 'Invalid strings' }, { status: 400 });
    }

    const translations = await translateUiStrings(language, strings);
    return NextResponse.json({ success: true, translations });
  } catch (err) {
    console.error('[intake/translate-ui]', err);
    return NextResponse.json({ success: false, error: 'Translation failed' }, { status: 500 });
  }
}
