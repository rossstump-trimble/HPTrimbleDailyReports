import { NextResponse } from 'next/server';
import { extractPunchSheetFromBuffer } from '@/lib/punch-ocr';
import { getProjectById, getPunchItems } from '@/lib/store';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File exceeds 20 MB limit' }, { status: 413 });
    }

    const project = getProjectById(projectId);
    const knownTrades = project?.tradePartners?.map((t) => t.name) || [];

    const existingItems = getPunchItems(projectId);
    const openItems = existingItems
      .filter((item) => item.status === 'open' || item.status === 'reopened')
      .map((item) => ({
        id: item.id,
        itemNumber: item.itemNumber,
        description: item.description,
        tradeName: item.tradeName,
        locationDescription: item.locationDescription,
      }));

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractPunchSheetFromBuffer(buffer, file.type, {
      knownTrades,
      openItems,
    });

    return NextResponse.json({
      success: extraction.success,
      data: extraction,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 500 },
    );
  }
}
