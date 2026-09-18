import { NextRequest, NextResponse } from 'next/server';
import { reorderCriteria } from '@/services/criteria';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, orderedIds } = body;

    if (!eventId || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'eventId and orderedIds array are required' }, { status: 400 });
    }

    await reorderCriteria(eventId, orderedIds);
    return NextResponse.json({ success: true, message: 'Criteria reordered successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reorder criteria' }, { status: 500 });
  }
}
