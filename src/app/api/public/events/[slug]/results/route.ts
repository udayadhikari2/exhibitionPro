import { NextRequest, NextResponse } from 'next/server';
import { getPublicEventResults } from '@/services/result';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getPublicEventResults(slug);

    if (!data.event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch public results' },
      { status: 500 }
    );
  }
}
