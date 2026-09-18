import { NextRequest, NextResponse } from 'next/server';
import { updateCriterion, deleteCriterion } from '@/services/criteria';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateCriterion(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Criterion not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, criterion: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update criterion' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const success = await deleteCriterion(id);

    return NextResponse.json({ success, message: 'Criterion removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete criterion' }, { status: 500 });
  }
}
