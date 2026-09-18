import { NextRequest, NextResponse } from 'next/server';
import { adminUnlockEvaluation } from '@/services/evaluation';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || 'Evaluation unlocked by administrator for scoring revisions';

    const evaluation = await adminUnlockEvaluation(
      id,
      { id: user!.id, name: user!.name },
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Evaluation unlocked successfully',
      evaluation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to unlock evaluation' }, { status: 500 });
  }
}
