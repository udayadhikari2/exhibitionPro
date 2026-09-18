import { NextRequest, NextResponse } from 'next/server';
import { getCriteriaByEvent, saveCriterion, deleteCriterion } from '@/lib/dataStore';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const criteria = await getCriteriaByEvent(id);
    return NextResponse.json({ criteria });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { _id, name, description, maxMarks, minMarks, weight, order, isRequired } = body;

    if (!name || maxMarks === undefined) {
      return NextResponse.json({ error: 'Criterion name and maximum marks are required' }, { status: 400 });
    }

    const criterion = await saveCriterion({
      _id,
      eventId: id,
      name,
      description: description || '',
      maxMarks: Number(maxMarks),
      minMarks: Number(minMarks) || 0,
      weight: Number(weight) || 1,
      order: Number(order) || 1,
      isRequired: isRequired !== false,
    });

    return NextResponse.json({ success: true, criterion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const criterionId = searchParams.get('criterionId');
    if (!criterionId) {
      return NextResponse.json({ error: 'Criterion ID required' }, { status: 400 });
    }

    await deleteCriterion(criterionId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
