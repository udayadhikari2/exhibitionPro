import { NextRequest, NextResponse } from 'next/server';
import { getEvaluatorDashboard } from '@/services/evaluation';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['EVALUATOR', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Evaluator access required' }, { status: 403 });
    }

    const data = await getEvaluatorDashboard(user!.id);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load evaluator dashboard' }, { status: 500 });
  }
}
