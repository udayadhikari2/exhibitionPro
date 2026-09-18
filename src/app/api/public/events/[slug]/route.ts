import { NextRequest, NextResponse } from 'next/server';
import { getPublicProjectsByEvent } from '@/services/team';
import { getPublicEventResults } from '@/services/result';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const data = await getPublicProjectsByEvent(slug, search, categoryId);
    if (!data) {
      return NextResponse.json({ error: 'Exhibition event not found' }, { status: 404 });
    }

    // Check if results are published for this event
    let resultSummary = {
      isPublished: false,
      top3: [] as any[],
    };

    try {
      const pubRes = await getPublicEventResults(slug);
      if (pubRes && pubRes.isPublished && pubRes.result) {
        resultSummary = {
          isPublished: true,
          top3: (pubRes.result.results || []).slice(0, 3).map((r) => ({
            rankOverall: r.rankOverall,
            teamName: r.teamName,
            projectTitle: r.projectTitle,
            categoryName: r.categoryName,
            averageScore: r.averageScore,
            isTied: r.isTied,
          })),
        };
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      event: data.event,
      categories: data.categories,
      projects: data.projects,
      totalProjects: data.projects.length,
      resultSummary,
    });
  } catch (error: any) {
    console.error('Error fetching public event projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch public exhibition details' },
      { status: 500 }
    );
  }
}
