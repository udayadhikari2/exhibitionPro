import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, createEvent } from '@/services/event';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const eventType = searchParams.get('eventType') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const events = await getAllEvents({ status, eventType, search, includeArchived });
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, title, eventType, venue, startDate, endDate } = body;

    const eventName = name || title;
    if (!eventName || !eventType || !venue || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields (name, eventType, venue, startDate, endDate)' },
        { status: 400 }
      );
    }

    const newEvent = await createEvent(body, user!.id);
    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
  }
}
