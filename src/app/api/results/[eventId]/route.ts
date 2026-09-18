import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, authorizeRole } from '@/lib/auth';
import {
  getOrCreateEventResult,
  recalculateEventResults,
} from '@/services/result';
import { getEventById } from '@/services/event';
import { getCriteria } from '@/services/criteria';
import { getCategoriesByEvent } from '@/services/category';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { eventId } = await params;
    const { searchParams } = new URL(req.url);
    const recalculate = searchParams.get('recalculate') === 'true';

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let result = null;
    if (recalculate) {
      result = await recalculateEventResults(eventId);
    } else {
      result = await getOrCreateEventResult(eventId, user?.role);
    }


    const [critData, categories] = await Promise.all([
      getCriteria(eventId),
      getCategoriesByEvent(eventId),
    ]);

    return NextResponse.json({
      success: true,
      event,
      result,
      criteria: critData.criteria || [],
      categories,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event result' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { eventId } = await params;
    const body = await req.json().catch(() => ({}));
    const { tieBreakOrder } = body;

    const result = await recalculateEventResults(eventId, tieBreakOrder);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate results' },
      { status: 500 }
    );
  }
}
