import { NextResponse } from 'next/server';
import { getBowlingMatrix } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: 'Invalid month format. Expected YYYY-MM' },
        { status: 400 },
      );
    }

    const matrix = getBowlingMatrix(projectId, month);
    return NextResponse.json(matrix);
  } catch (err) {
    console.error('[bowling]', err);
    return NextResponse.json({ success: false, error: 'Failed to build bowling matrix' }, { status: 500 });
  }
}
