import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, authorizeRole } from '@/lib/auth';
import { updateResultStatus } from '@/services/result';
import { ResultStatus } from '@/types';

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
    const body = await req.json();
    const { status } = body as { status: ResultStatus };

    if (!status || !['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    const res = await updateResultStatus(eventId, status, {
      id: user!.id,
      name: user!.name,
    });


    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: res.result,
      message: `Result status successfully transitioned to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update result status' },
      { status: 500 }
    );
  }
}
