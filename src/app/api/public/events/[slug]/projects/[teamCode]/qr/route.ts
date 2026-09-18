import { NextRequest, NextResponse } from 'next/server';
import { getPublicProjectByTeamCode } from '@/services/team';
import { getPublicProjectUrl, generateQRCodePngDataUrl, generateQRCodeSvg } from '@/lib/qr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; teamCode: string }> }
) {
  try {
    const { slug, teamCode } = await params;
    const data = await getPublicProjectByTeamCode(slug, teamCode);
    if (!data) {
      return NextResponse.json({ error: 'Project not found in event' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const targetUrl = getPublicProjectUrl(slug, data.project.teamCode);
    const qrDataUrl = await generateQRCodePngDataUrl(targetUrl, { width: 500, margin: 2 });

    if (format === 'svg') {
      const svg = await generateQRCodeSvg(targetUrl, { width: 500 });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="${data.project.teamCode}-qr.svg"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      teamCode: data.project.teamCode,
      projectTitle: data.project.projectTitle,
      teamName: data.project.teamName,
      stallNumber: data.project.stallNumber,
      targetUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error('Project QR error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate project QR' }, { status: 500 });
  }
}
