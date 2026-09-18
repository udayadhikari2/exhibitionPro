import { NextRequest, NextResponse } from 'next/server';
import { getAdminEvaluationOverview } from '@/services/evaluation';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const categoryId = searchParams.get('categoryId') || undefined;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const data = await getAdminEvaluationOverview(eventId, categoryId);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve evaluations overview' }, { status: 500 });
  }
}
