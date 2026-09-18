import { NextRequest, NextResponse } from 'next/server';
import { getAssignedProjectsForEvaluator } from '@/services/evaluation';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['EVALUATOR', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Evaluator access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const status = searchParams.get('status') || undefined;

    const projects = await getAssignedProjectsForEvaluator(user!.id, { eventId, categoryId, status });
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load assigned projects' }, { status: 500 });
  }
}
