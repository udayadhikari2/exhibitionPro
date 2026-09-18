import { NextResponse } from 'next/server';
import { getAllEvaluators } from '@/lib/dataStore';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const evaluators = await getAllEvaluators();
    // Return sanitized evaluator objects (no passwordHash)
    const sanitized = evaluators.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json({ evaluators: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
