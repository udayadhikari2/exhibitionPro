import { NextRequest, NextResponse } from 'next/server';
import { resetEvaluatorPassword } from '@/services/evaluator';
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
    const body = await req.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const success = await resetEvaluatorPassword(id, password);
    if (!success) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
