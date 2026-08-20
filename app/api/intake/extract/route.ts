import { NextResponse } from 'next/server';
import { extractDailyFromBuffer } from '@/lib/extract-daily';

export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File exceeds 15 MB limit' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDailyFromBuffer(buffer, file.type, file.name);

    return NextResponse.json({ success: true, extracted });
  } catch (err) {
    console.error('[intake/extract]', err);
    return NextResponse.json({ success: false, error: 'Extraction failed' }, { status: 500 });
  }
}
