import { NextResponse } from 'next/server';
import { extractInspectionSheet } from '@/lib/inspection-ocr';
import { getInspectionsForProject } from '@/lib/store';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const formData = await req.formData();
    const targetChecklistId = String(formData.get('targetChecklistId') || '').trim();

    const rawFiles = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter((f): f is File => f instanceof File);

    const files = Array.from(new Set(rawFiles));

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 20 MB limit` },
          { status: 413 },
        );
      }
    }

    const knownChecklists = getInspectionsForProject(projectId);
    const target = targetChecklistId
      ? knownChecklists.find(
          (ck) => ck.id === targetChecklistId || ck.psRecordId === targetChecklistId,
        )
      : undefined;

    const prioritizedChecklists = target
      ? [target, ...knownChecklists.filter((ck) => ck.id !== target.id)]
      : knownChecklists;

    const imageDescriptors = await Promise.all(
      files.map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        mimeType: f.type || 'image/jpeg',
        filename: f.name,
      })),
    );

    const extraction = await extractInspectionSheet(
      imageDescriptors,
      prioritizedChecklists,
    );

    if (target && !extraction.checklistGuid) {
      extraction.checklistGuid = target.psRecordId || target.id;
      extraction.checklistNumber = target.number;
      if (!extraction.title || extraction.title === 'Pre-Pour Concrete Inspection') {
        extraction.title = target.title;
      }
    }

    const previewUrls = imageDescriptors.map(
      (img) => `data:${img.mimeType};base64,${img.buffer.toString('base64')}`,
    );

    return NextResponse.json({
      success: true,
      data: extraction,
      previewUrls,
      previewUrl: previewUrls[0] || null,
      targetChecklistId: target ? target.id : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Inspection extraction failed' },
      { status: 500 },
    );
  }
}
