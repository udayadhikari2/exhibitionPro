import { NextRequest, NextResponse } from 'next/server';
import { getPublicProjectByTeamCode } from '@/services/team';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; teamCode: string }> }
) {
  try {
    const { slug, teamCode } = await params;

    const data = await getPublicProjectByTeamCode(slug, teamCode);
    if (!data) {
      return NextResponse.json(
        { error: `Project with code "${teamCode}" not found in this exhibition` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data.event,
      project: data.project,
    });
  } catch (error: any) {
    console.error('Error fetching public project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch public project showcase' },
      { status: 500 }
    );
  }
}
