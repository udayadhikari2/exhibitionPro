import { NextRequest, NextResponse } from 'next/server';
import { getCriteria, createCriterion } from '@/services/criteria';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const categoryId = searchParams.get('categoryId') || undefined;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const data = await getCriteria(eventId, categoryId);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve criteria' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, categoryId, name, description, maxMarks, minMarks, weight, order, required } = body;

    if (!eventId || !name || maxMarks === undefined) {
      return NextResponse.json({ error: 'eventId, name, and maxMarks are required' }, { status: 400 });
    }

    const criterion = await createCriterion({
      eventId,
      categoryId: categoryId || null,
      name,
      description,
      maxMarks: Number(maxMarks),
      minMarks: minMarks !== undefined ? Number(minMarks) : 0,
      weight: weight !== undefined ? Number(weight) : 1,
      order: order !== undefined ? Number(order) : undefined,
      required: required !== undefined ? Boolean(required) : true,
    });

    return NextResponse.json({ success: true, criterion }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create criterion' }, { status: 500 });
  }
}
