import { NextRequest, NextResponse } from 'next/server';
import { deleteAssignment } from '@/services/assignment';
import { getSessionUser, authorizeRole } from '@/lib/auth';

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
    const success = await deleteAssignment(id);

    return NextResponse.json({ success, message: 'Assignment removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove assignment' }, { status: 500 });
  }
}
