import { NextRequest, NextResponse } from 'next/server';
import { getEventBySlug } from '@/services/event';
import { getPublicEventUrl, generateQRCodePngDataUrl, generateQRCodeSvg } from '@/lib/qr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' | 'svg' | 'png'

    const targetUrl = getPublicEventUrl(event.slug || event._id);
    const qrDataUrl = await generateQRCodePngDataUrl(targetUrl, { width: 500, margin: 2 });

    if (format === 'svg') {
      const svg = await generateQRCodeSvg(targetUrl, { width: 500 });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="${event.slug}-qr.svg"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        slug: event.slug,
        venue: event.venue,
      },
      targetUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error('Event QR error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate event QR' }, { status: 500 });
  }
}
