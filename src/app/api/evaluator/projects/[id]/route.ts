import { NextRequest, NextResponse } from 'next/server';
import { getProjectEvaluation } from '@/services/evaluation';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['EVALUATOR', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Evaluator access required' }, { status: 403 });
    }

    const { id } = await params;
    const data = await getProjectEvaluation(user!.id, id);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch project evaluation details' }, { status });
  }
}
