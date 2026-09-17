import { NextResponse } from 'next/server';
import { extractInspectionSheet } from '@/lib/inspection-ocr';
import { getInspectionsForProject } from '@/lib/store';

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

    const knownChecklists = getInspectionsForProject(projectId);
    const buffer = Buffer.from(await file.arrayBuffer());

    const extraction = await extractInspectionSheet(
      buffer,
      file.type,
      file.name,
      knownChecklists,
    );

    const base64Data = buffer.toString('base64');
    const previewUrl = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      data: extraction,
      previewUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Inspection extraction failed' },
      { status: 500 },
    );
  }
}
